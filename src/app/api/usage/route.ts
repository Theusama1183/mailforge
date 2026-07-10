import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const month = new Date().toISOString().slice(0, 7)

    const [quotasRes, subRes] = await Promise.all([
      supabase.from("usage_quotas").select("*").eq("workspace_id", workspaceId).eq("month", month).single(),
      supabase.from("subscriptions").select("plan_tier_id, status, trial_ends_at, current_period_end").eq("workspace_id", workspaceId).in("status", ["active", "trialing"]).maybeSingle(),
    ])

    let planLimits = { emails_per_day: 100, storage_mb: 500, api_requests_per_minute: 60 }
    if (subRes.data) {
      const { data: plan } = await supabase.from("plan_tiers").select("*").eq("id", subRes.data.plan_tier_id).single()
      if (plan) {
        planLimits = { emails_per_day: plan.emails_per_day, storage_mb: plan.storage_mb, api_requests_per_minute: plan.api_requests_per_minute }
      }
    }

    const usage = quotasRes.data || { emails_sent: 0, emails_received: 0, api_requests: 0, storage_bytes: 0 }

    return NextResponse.json({
      usage: {
        emailsSent: usage.emails_sent,
        emailsReceived: usage.emails_received,
        apiRequests: usage.api_requests,
        storageBytes: usage.storage_bytes,
      },
      limits: planLimits,
      subscription: subRes.data ? {
        status: subRes.data.status,
        trialEndsAt: subRes.data.trial_ends_at,
        periodEnd: subRes.data.current_period_end,
      } : null,
    })
  } catch (err) {
    console.error("Usage API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

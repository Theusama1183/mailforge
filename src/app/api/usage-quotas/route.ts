import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspace_id")
    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const now = new Date()
    const month = searchParams.get("month") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const [usageRes, tierRes] = await Promise.all([
      supabase.from("usage_quotas").select("*").eq("workspace_id", workspaceId).eq("month", month).maybeSingle(),
      supabase.from("rate_limit_tiers").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    ])

    if (usageRes.error) {
      return NextResponse.json({ error: usageRes.error.message }, { status: 500 })
    }
    if (tierRes.error) {
      return NextResponse.json({ error: tierRes.error.message }, { status: 500 })
    }

    const usage = usageRes.data || { emails_sent: 0, emails_received: 0, api_requests: 0, storage_bytes: 0 }
    const tier = tierRes.data || { tier: "free", emails_per_hour: 100, emails_per_day: 500, requests_per_minute: 60 }

    return NextResponse.json({
      usage: {
        emails_sent: usage.emails_sent,
        emails_received: usage.emails_received,
        api_requests: usage.api_requests,
        storage_bytes: usage.storage_bytes,
      },
      limits: {
        emails_per_hour: tier.emails_per_hour,
        emails_per_day: tier.emails_per_day,
        requests_per_minute: tier.requests_per_minute,
      },
      month,
      tier: tier.tier,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch usage quotas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { workspace_id, emails_sent = 0, emails_received = 0, api_requests = 0, storage_bytes = 0 } = body

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const { data: existing } = await supabase
      .from("usage_quotas")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("month", month)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from("usage_quotas")
        .update({
          emails_sent: existing.emails_sent + emails_sent,
          emails_received: existing.emails_received + emails_received,
          api_requests: existing.api_requests + api_requests,
          storage_bytes: existing.storage_bytes + storage_bytes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    } else {
      const { data, error } = await supabase
        .from("usage_quotas")
        .insert({
          workspace_id,
          month,
          emails_sent,
          emails_received,
          api_requests,
          storage_bytes,
        })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update usage quotas" }, { status: 500 })
  }
}

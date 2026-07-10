import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const url = new URL(req.url)
    const workspaceId = url.searchParams.get("workspace_id")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*, plan_tiers(*)")
      .eq("workspace_id", workspaceId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!subscription) {
      const { data: freePlan } = await supabase
        .from("plan_tiers")
        .select("*")
        .eq("code", "free")
        .single()

      return NextResponse.json({
        subscription: null,
        currentPlan: freePlan || { code: "free", name: "Free" },
      })
    }

    return NextResponse.json({ subscription, currentPlan: subscription.plan_tiers })
  } catch (error) {
    console.error("Failed to fetch subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

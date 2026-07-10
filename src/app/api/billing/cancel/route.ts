import { NextRequest, NextResponse } from "next/server"
import { getPaddleClient } from "@/lib/billing/paddle"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const { workspaceId } = await req.json()

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership || membership.role === "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("paddle_subscription_id")
      .eq("workspace_id", workspaceId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.paddle_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    const paddle = getPaddleClient()
    await paddle.subscriptions.cancel(subscription.paddle_subscription_id)

    await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscription.paddle_subscription_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to cancel subscription:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel" },
      { status: 500 }
    )
  }
}

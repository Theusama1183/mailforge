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

    const { data, error } = await supabase
      .from("invoices")
      .select("*, subscription:subscriptions(plan_tier_id)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("Invoices API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

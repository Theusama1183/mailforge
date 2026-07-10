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

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ invoices: invoices || [] })
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

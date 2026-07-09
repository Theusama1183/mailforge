import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const workspaceId = url.searchParams.get("workspace_id")
    if (!workspaceId) return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Only admins can view audit logs" }, { status: 403 })
    }

    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    const { data, error, count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [], total: count || 0 })
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}

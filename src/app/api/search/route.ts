import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    const folder = searchParams.get("folder")
    const workspaceId = searchParams.get("workspace_id")
    const fromFilter = searchParams.get("from")
    const toFilter = searchParams.get("to")
    const subjectFilter = searchParams.get("subject")
    const hasAttachment = searchParams.get("has_attachment")
    const before = searchParams.get("before")
    const after = searchParams.get("after")
    const read = searchParams.get("read")
    const page = Math.max(parseInt(searchParams.get("page") || "0"), 0)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = page * limit

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let query = supabase
      .from("emails")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)

    if (q) {
      query = query.textSearch("search_vector", q, { type: "plain", config: "english" })
    }

    if (folder) query = query.eq("folder", folder)
    if (workspaceId) query = query.eq("workspace_id", workspaceId)
    if (fromFilter) query = query.ilike("from_address", `%${fromFilter}%`)
    if (toFilter) query = query.contains("to_addresses", [toFilter])
    if (subjectFilter) query = query.ilike("subject", `%${subjectFilter}%`)
    if (hasAttachment === "true") query = query.neq("attachments", "[]")
    if (hasAttachment === "false") query = query.eq("attachments", "[]")
    if (before) query = query.lt("created_at", before)
    if (after) query = query.gt("created_at", after)
    if (read === "true") query = query.eq("read", true)
    if (read === "false") query = query.eq("read", false)

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ emails: data, total: count, page, limit })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}

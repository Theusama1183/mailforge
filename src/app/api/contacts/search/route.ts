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
    const query = searchParams.get("q")?.trim() || ""
    const workspaceId = searchParams.get("workspaceId")

    if (query.length < 1) return NextResponse.json([])

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let db = supabase
      .from("contacts")
      .select("id, email, name, company")
      .eq("user_id", user.id)
      .or(`email.ilike.%${query}%,name.ilike.%${query}%`)

    if (workspaceId) db = db.eq("workspace_id", workspaceId)

    const { data, error } = await db
      .order("name", { ascending: true, nullsFirst: false })
      .limit(10)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to search contacts" }, { status: 500 })
  }
}

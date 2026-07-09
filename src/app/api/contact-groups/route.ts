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
    const workspaceId = searchParams.get("workspaceId")
    const query = searchParams.get("q")?.trim()

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let db = supabase
      .from("contact_groups")
      .select("*, contact_group_members(count)")
      .eq("user_id", user.id)

    if (workspaceId) db = db.eq("workspace_id", workspaceId)
    if (query) db = db.ilike("name", `%${query}%`)

    const { data, error } = await db.order("name", { ascending: true }).limit(query ? 5 : 100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    if (!body.workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, body.workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("contact_groups")
      .insert({
        user_id: user.id,
        workspace_id: body.workspaceId,
        name: body.name,
        description: body.description || null,
        color: body.color || "#3b82f6",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
  }
}

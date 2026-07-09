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
    const workspaceId = searchParams.get("workspace_id")

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let query = supabase
      .from("email_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })

    if (workspaceId) query = query.eq("workspace_id", workspaceId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Folders fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { workspace_id, name, parent_id, color, icon, sort_order } = body

    if (!workspace_id) return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, workspace_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("email_folders")
      .insert({
        workspace_id,
        user_id: user.id,
        name,
        parent_id: parent_id || null,
        color: color || "#6366f1",
        icon: icon || "Folder",
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Folder create error:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

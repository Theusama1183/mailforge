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
      .from("email_labels")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true })

    if (workspaceId) query = query.eq("workspace_id", workspaceId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Labels fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { workspace_id, name, color } = body

    if (!workspace_id) return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, workspace_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("email_labels")
      .insert({
        workspace_id,
        user_id: user.id,
        name,
        color: color || "#6366f1",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Label create error:", error)
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 })
  }
}

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

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let db = supabase.from("templates").select("*").eq("user_id", user.id)
    if (workspaceId) db = db.eq("workspace_id", workspaceId)

    const { data, error } = await db.order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
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

    if (body.workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, body.workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        workspace_id: body.workspaceId || null,
        name: body.name,
        subject: body.subject || "",
        body_html: body.body_html || "",
        body_text: body.body_text || "",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}

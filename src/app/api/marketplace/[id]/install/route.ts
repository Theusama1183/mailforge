import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: marketTemplate } = await supabase
      .from("marketplace_templates")
      .select("*")
      .eq("id", id)
      .single()

    if (!marketTemplate) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const body = await req.json()
    const workspaceId = body.workspace_id

    if (workspaceId) {
      const { data: member } = await supabase
        .from("workspace_members").select("id").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle()
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("templates").insert({
        user_id: user.id, workspace_id: workspaceId || null,
        name: marketTemplate.name, subject: marketTemplate.subject || "",
        body_html: marketTemplate.body_html || "", body_text: marketTemplate.body_text || "",
      }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from("marketplace_templates").update({ downloads: (marketTemplate.downloads || 0) + 1 }).eq("id", id)

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to install template" }, { status: 500 })
  }
}

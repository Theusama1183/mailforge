import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: template } = await supabase
      .from("templates")
      .select("user_id, workspace_id")
      .eq("id", id)
      .single()

    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    if (template.user_id !== user.id) {
      if (template.workspace_id) {
        const { data: member } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", template.workspace_id)
          .eq("user_id", user.id)
          .maybeSingle()
        if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from("template_versions")
      .select("*")
      .eq("template_id", id)
      .order("version_number", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: template } = await supabase
      .from("templates")
      .select("name, subject, body_html, body_text, user_id, workspace_id")
      .eq("id", id)
      .single()

    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    if (template.user_id !== user.id) {
      if (template.workspace_id) {
        const { data: member } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", template.workspace_id)
          .eq("user_id", user.id)
          .maybeSingle()
        if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { data: currentVersion } = await supabase
      .from("template_versions")
      .select("version_number")
      .eq("template_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (currentVersion?.version_number || 0) + 1

    const body = await req.json()

    const { data, error } = await supabase.from("template_versions").insert({
      template_id: id,
      version_number: nextVersion,
      name: body.name || template.name,
      subject: body.subject ?? template.subject,
      body_html: body.body_html ?? template.body_html,
      body_text: body.body_text ?? template.body_text,
      metadata: body.metadata || {},
      created_by: user.id,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 })
  }
}

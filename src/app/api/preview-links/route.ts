import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { template_id, workspace_id, password, expires_in_hours, max_views } = body

    if (!template_id) {
      return NextResponse.json({ error: "template_id is required" }, { status: 400 })
    }

    const { data: template } = await supabase
      .from("templates")
      .select("user_id, workspace_id, name, subject, body_html, body_text")
      .eq("id", template_id)
      .single()

    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const isOwner = template.user_id === user.id
    let isMember = false
    if (template.workspace_id && !isOwner) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", template.workspace_id)
        .eq("user_id", user.id)
        .maybeSingle()
      isMember = !!member
    }
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let passwordHash: string | null = null
    if (password) {
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    }

    let expiresAt: string | null = null
    if (expires_in_hours && expires_in_hours > 0) {
      expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
    }

    const { data, error } = await supabase
      .from("preview_links")
      .insert({
        template_id,
        workspace_id: workspace_id || template.workspace_id || null,
        created_by: user.id,
        password_hash: passwordHash,
        expires_at: expiresAt,
        max_views: max_views || 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create preview link" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const templateId = searchParams.get("template_id")

    let query = supabase.from("preview_links").select("*, templates(name, subject)").eq("created_by", user.id).order("created_at", { ascending: false })

    if (templateId) query = query.eq("template_id", templateId)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch preview links" }, { status: 500 })
  }
}

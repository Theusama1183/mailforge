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
      .from("proofing_comments")
      .select("*, user_id")
      .eq("template_id", id)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, avatar_url")
      .in("user_id", [...new Set(data?.map((c: any) => c.user_id) || [])])

    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.avatar_url]) || [])

    const enriched = (data || []).map((c: any) => ({
      ...c,
      author_avatar: profileMap.get(c.user_id) || null,
      author_name: c.user_id === user.id ? "You" : "Team Member",
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.comment?.trim()) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("proofing_comments")
      .insert({
        template_id: id,
        user_id: user.id,
        comment: body.comment.trim(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, author_name: "You", author_avatar: null })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

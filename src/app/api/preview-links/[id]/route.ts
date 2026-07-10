import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: link, error } = await supabase
      .from("preview_links")
      .select("*, templates(name, subject, body_html, body_text, user_id)")
      .eq("id", id)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: "Preview link not found" }, { status: 404 })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "Preview link has expired" }, { status: 410 })
    }

    if (link.max_views > 0 && link.view_count >= link.max_views) {
      return NextResponse.json({ error: "Preview link has reached maximum views" }, { status: 410 })
    }

    await supabase
      .from("preview_links")
      .update({
        view_count: (link.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", id)

    const { searchParams } = new URL(req.url)
    const password = searchParams.get("password")

    if (link.password_hash) {
      if (!password) {
        return NextResponse.json({ needs_password: true, template_name: link.templates?.name }, { status: 200 })
      }
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
      if (passwordHash !== link.password_hash) {
        return NextResponse.json({ error: "Invalid password" }, { status: 403 })
      }
    }

    return NextResponse.json({
      id: link.id,
      template_name: link.templates?.name,
      subject: link.templates?.subject,
      body_html: link.templates?.body_html,
      body_text: link.templates?.body_text,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to load preview" }, { status: 500 })
  }
}

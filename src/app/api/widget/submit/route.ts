import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { widget_id, ...fields } = await req.json()
    if (!widget_id) return NextResponse.json({ error: "Missing widget_id" }, { status: 400 })

    const supabase = createAdminClient()
    const { data: widget, error } = await supabase.from("form_widgets").select("*").eq("id", widget_id).eq("active", true).single()
    if (error || !widget) return NextResponse.json({ error: "Widget not found" }, { status: 404 })

    await supabase.from("widget_submissions").insert({
      widget_id,
      data: fields,
    })

    await supabase.from("form_widgets").update({
      submission_count: (widget.submission_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", widget_id)

    return NextResponse.json({ success: true, message: widget.success_message, redirect_url: widget.redirect_url })
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 })
  }
}

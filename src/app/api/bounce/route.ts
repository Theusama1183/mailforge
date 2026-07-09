import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email_id, bounce_type } = body

    if (!email_id || !bounce_type) {
      return NextResponse.json({ error: "email_id and bounce_type are required" }, { status: 400 })
    }
    if (!["hard", "soft"].includes(bounce_type)) {
      return NextResponse.json({ error: "bounce_type must be 'hard' or 'soft'" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: email } = await supabase
      .from("emails")
      .select("id, delivery_status")
      .eq("id", email_id)
      .maybeSingle()

    if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    await supabase.from("emails").update({ delivery_status: "bounced", delivery_error: `Bounced (${bounce_type})` }).eq("id", email_id)

    await supabase.from("email_events").insert({
      email_id,
      event_type: "bounce",
      bounce_type,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process bounce" }, { status: 500 })
  }
}

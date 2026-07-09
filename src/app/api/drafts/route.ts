import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const { id, to, cc, bcc, subject, body, textBody, fromAddress, attachments, replyTo, priority, readReceipt } = await req.json()

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const draftData = {
      user_id: user.id,
      mailbox_address: fromAddress || "",
      from_address: fromAddress || "",
      to_addresses: to || [],
      cc_addresses: cc || null,
      bcc_addresses: bcc || null,
      subject: subject || "",
      body_html: body || null,
      body_text: textBody || null,
      direction: "outbound",
      folder: "drafts",
      is_draft: true,
      delivery_status: "queued",
      ...(replyTo ? { in_reply_to: replyTo } : {}),
      ...(priority ? { priority } : {}),
      ...(readReceipt !== undefined ? { read_receipt: readReceipt } : {}),
    }

    if (id) {
      const { data: existing } = await supabase
        .from("emails")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (!existing) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 })
      }

      const { data, error } = await supabase
        .from("emails")
        .update(draftData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    } else {
      const { data, error } = await supabase
        .from("emails")
        .insert(draftData)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("Draft save error:", error)
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 })
  }
}

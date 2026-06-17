import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const requestId = crypto.randomUUID?.() || Date.now().toString(36)

  try {
    const secret = req.headers.get("x-webhook-secret")
    if (secret !== process.env.EMAIL_WEBHOOK_SECRET) {
      console.warn(`[webhook:${requestId}] Unauthorized attempt`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { from, to, subject, text, html, messageId, userId } = body

    console.log(`[webhook:${requestId}] Inbound: to=${to} from=${from?.address || from} userId=${userId} subject=${subject?.slice(0, 50)}`)

    if (!from || !to || !userId) {
      console.warn(`[webhook:${requestId}] Missing fields: from=${!!from} to=${!!to} userId=${!!userId}`)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const fromAddress = typeof from === "string" ? from : from.address
    const fromName = typeof from === "string" ? null : from.name || null

    // Check if this email address belongs to a workspace
    const { data: emailAddr } = await supabase
      .from("email_addresses")
      .select("workspace_id, local_part")
      .eq("local_part", to.split("@")[0])
      .maybeSingle()

    let userIds = [userId]

    if (emailAddr?.workspace_id) {
      // Workspace email: insert for all workspace members
      const { data: members } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", emailAddr.workspace_id)

      if (members) {
        userIds = members.map(m => m.user_id)
      }
    }

    for (const uid of userIds) {
      const { error } = await supabase.from("emails").insert({
        user_id: uid,
        mailbox_address: to,
        from_address: fromAddress,
        from_name: fromName,
        to_addresses: [to],
        subject: subject || null,
        body_text: text || null,
        body_html: html || null,
        direction: "inbound",
        folder: "inbox",
        message_id: messageId || null,
      })

      if (error) {
        console.error(`[webhook:${requestId}] DB insert failed for user ${uid}:`, error.message)
      }
    }

    console.log(`[webhook:${requestId}] Stored for ${userIds.length} user(s)`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[webhook:${requestId}] Error:`, error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

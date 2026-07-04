import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function sendPushNotifications(userIds: string[], subject: string, fromAddress: string) {
  try {
    const supabase = createAdminClient()
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .in("user_id", userIds)

    if (!tokens || tokens.length === 0) return

    const messages = tokens.map((t: { token: string; platform: string }) => ({
      to: t.token,
      title: fromAddress,
      body: subject?.slice(0, 100) || "New email",
      sound: "default",
      badge: 1,
      data: { type: "new_email", from: fromAddress, subject },
    }))

    // Send via Expo Push API
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    })
  } catch (err) {
    console.error("Push notification error:", err)
  }
}

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
    const toLocalPart = to.split("@")[0]
    const toDomain = to.split("@")[1]

    // Look up the domain to get domain_id for proper email_addresses filtering
    let domainId: string | null = null
    if (toDomain) {
      const { data: domainRecord } = await supabase
        .from("domains")
        .select("id")
        .eq("domain", toDomain)
        .maybeSingle()
      if (domainRecord) {
        domainId = domainRecord.id
      }
    }

    // Find the email address by local_part AND domain_id
    let emailAddrQuery = supabase
      .from("email_addresses")
      .select("workspace_id, assigned_to, local_part")
      .eq("local_part", toLocalPart)

    if (domainId) {
      emailAddrQuery = emailAddrQuery.eq("domain_id", domainId)
    }

    const { data: emailAddr } = await emailAddrQuery.maybeSingle()

    let userIds = [userId]

    if (emailAddr?.workspace_id || emailAddr?.assigned_to) {
      if (emailAddr?.assigned_to) {
        userIds = [emailAddr.assigned_to]
      } else if (emailAddr?.workspace_id) {
        const { data: members } = await supabase
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", emailAddr.workspace_id)

        if (members) {
          userIds = members.map(m => m.user_id)
        }
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

    // Send push notifications
    await sendPushNotifications(userIds, subject || "", fromAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[webhook:${requestId}] Error:`, error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

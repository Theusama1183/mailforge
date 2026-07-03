import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/send"

export async function POST(req: Request) {
  try {
    const { to, cc, bcc, subject, body, fromAddress, attachments, inReplyTo } = await req.json()

    if (!to?.length || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Authenticate
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = user.id

    const rl = checkRateLimit(`send:${user.id}`, RATE_LIMITS.send)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait before sending more emails." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const { data: domains } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", userId)

    if (!domains?.length) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    const domain = domains[0]
    const from = fromAddress || `you@${domain.domain}`

    if (!domain.smtp_provider) {
      return NextResponse.json({ error: "SMTP not configured for this domain. Go to Settings." }, { status: 400 })
    }

    const emailId = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`

    const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${emailId}" width="1" height="1" alt="" style="display:none" />`
    const htmlWithTracking = body?.includes("<html") ? body.replace("</body>", `${trackingPixel}</body>`) : body + trackingPixel

    const parsedAttachments = attachments?.map((att: { filename: string; content: string }) => ({
      filename: att.filename,
      content: att.content.split(",")[1] || att.content,
      encoding: "base64" as const,
    }))

    const result = await sendEmail({
      smtp: {
        provider: domain.smtp_provider,
        host: domain.smtp_host,
        port: domain.smtp_port,
        username: domain.smtp_username,
        password: domain.smtp_password,
        mailgunApiKey: domain.mailgun_api_key,
        mailgunDomain: domain.mailgun_domain,
      },
      from,
      to,
      cc,
      bcc,
      subject,
      html: htmlWithTracking,
      attachments: parsedAttachments,
      replyTo: inReplyTo,
    })

    const { error: dbError } = await supabase.from("emails").insert({
      id: emailId,
      user_id: userId,
      mailbox_address: from,
      from_address: from,
      to_addresses: to,
      cc_addresses: cc || null,
      subject,
      body_html: body,
      direction: "outbound",
      folder: "sent",
      message_id: result.id,
      in_reply_to: inReplyTo || null,
    })

    if (dbError) {
      console.error("Failed to store sent email:", dbError)
    }

    return NextResponse.json({ success: true, id: emailId })
  } catch (error) {
    console.error("Send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send" },
      { status: 500 }
    )
  }
}

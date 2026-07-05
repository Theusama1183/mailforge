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

    let domain

    if (fromAddress) {
      const { data: emailAddr } = await supabase
        .from("email_addresses")
        .select("domain_id, local_part, workspace_id, assigned_to")
        .eq("local_part", fromAddress.split("@")[0])
        .maybeSingle()

      if (emailAddr) {
        const isAssigned = emailAddr.assigned_to === userId
        const { data: member } = emailAddr.workspace_id ? await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", emailAddr.workspace_id)
          .eq("user_id", userId)
          .maybeSingle() : { data: null }

        if (isAssigned || member) {
          const { data: domainRecord } = await supabase
            .from("domains")
            .select("*")
            .eq("id", emailAddr.domain_id)
            .single()
          domain = domainRecord
        }
      }
    }

    if (!domain) {
      const { data: ownDomains } = await supabase
        .from("domains")
        .select("*")
        .eq("user_id", userId)

      if (ownDomains?.length) {
        domain = ownDomains[0]
      }
    }

    if (!domain) {
      const { data: wsMemberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)

      if (wsMemberships?.length) {
        const wsIds = wsMemberships.map(m => m.workspace_id)
        const { data: wsDomains } = await supabase
          .from("email_addresses")
          .select("domain_id")
          .in("workspace_id", wsIds)

        if (wsDomains?.length) {
          const domainIds = [...new Set(wsDomains.map(d => d.domain_id))]
          const { data: domainRecords } = await supabase
            .from("domains")
            .select("*")
            .in("id", domainIds)
            .limit(1)

          if (domainRecords?.length) {
            domain = domainRecords[0]
          }
        }
      }
    }

    if (!domain) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    const sendFrom = fromAddress || `you@${domain.domain}`

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
      from: sendFrom,
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
      mailbox_address: sendFrom,
      from_address: sendFrom,
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

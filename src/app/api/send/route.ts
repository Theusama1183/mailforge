import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { autoSaveContacts } from "@/lib/contacts"

export async function POST(req: Request) {
  let emailId: string | undefined
  let userId: string | undefined
  let supabase: any
  try {
    const { to, cc, bcc, subject, body, textBody, fromAddress, attachments, inReplyTo, priority, readReceipt } = await req.json()

    if (!to?.length || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase: sb } = auth; supabase = sb
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    userId = user.id

    const rl = await checkRateLimit(`send:${user.id}`, RATE_LIMITS.send)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait before sending more emails." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    let domain
    let workspaceId: string | undefined

    if (fromAddress) {
      const { data: emailAddr } = await supabase
        .from("email_addresses")
        .select("domain_id, local_part, workspace_id, assigned_to")
        .eq("local_part", fromAddress.split("@")[0])
        .maybeSingle()

      if (emailAddr) {
        workspaceId = emailAddr.workspace_id || undefined
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
      if (ownDomains?.length) domain = ownDomains[0]
    }

    if (!domain) {
      const { data: wsMemberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)

      if (wsMemberships?.length) {
        const wsIds = wsMemberships.map((m: any) => m.workspace_id)
        const { data: wsDomains } = await supabase
          .from("email_addresses")
          .select("domain_id")
          .in("workspace_id", wsIds)

        if (wsDomains?.length) {
          const domainIds = [...new Set(wsDomains.map((d: any) => d.domain_id))]
          const { data: domainRecords } = await supabase
            .from("domains")
            .select("*")
            .in("id", domainIds)
            .limit(1)
          if (domainRecords?.length) domain = domainRecords[0]
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

    emailId = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email_id=${emailId}`
    const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${emailId}" width="1" height="1" alt="" style="display:none" />`
    const unsubscribeHtml = `<p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a></p>`
    let htmlWithTracking = body
    if (htmlWithTracking) {
      htmlWithTracking = htmlWithTracking.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
      if (htmlWithTracking.includes("<html")) {
        htmlWithTracking = htmlWithTracking.replace("</body>", `${trackingPixel}${unsubscribeHtml}</body>`)
      } else {
        htmlWithTracking = htmlWithTracking + trackingPixel + unsubscribeHtml
      }
    }

    const parsedAttachments = attachments?.map((att: { filename: string; content: string }) => ({
      filename: att.filename,
      content: att.content.split(",")[1] || att.content,
      encoding: "base64" as const,
    }))

    const scheduledFor = new Date(Date.now() + 10000).toISOString()

    const { error: dbError } = await supabase.from("emails").insert({
      id: emailId,
      user_id: userId,
      mailbox_address: sendFrom,
      from_address: sendFrom,
      to_addresses: to,
      cc_addresses: cc || null,
      subject,
      body_html: htmlWithTracking,
      body_text: textBody || null,
      direction: "outbound",
      folder: "sent",
      in_reply_to: inReplyTo || null,
      priority: priority || "normal",
      read_receipt: readReceipt || false,
      delivery_status: "queued",
      scheduled_for: scheduledFor,
    })

    if (dbError) {
      console.error("Failed to queue email:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (workspaceId) await autoSaveContacts(supabase, userId, workspaceId, [to, cc, bcc])

    return NextResponse.json({ success: true, id: emailId })
  } catch (error) {
    console.error("Queue error:", error)
    const errMsg = error instanceof Error ? error.message : "Failed to queue"
    if (emailId && supabase) {
      await supabase.from("emails").upsert({
        id: emailId,
        user_id: userId,
        delivery_status: "failed",
        delivery_error: errMsg,
      }).catch(() => {})
    }
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

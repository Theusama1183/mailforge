import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/send"
import { autoSaveContacts } from "@/lib/contacts"
import { encryptForRecipients } from "@/lib/pgp-encrypt"

export async function POST(req: Request) {
  try {
    const { to, cc, bcc, subject, body, textBody, fromAddress, priority, groupIds } = await req.json()

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(`bulk-send:${user.id}`, RATE_LIMITS.bulk)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    let domain: any
    let workspaceId: string | undefined

    if (fromAddress) {
      const { data: emailAddr } = await supabase
        .from("email_addresses")
        .select("domain_id, local_part, workspace_id, assigned_to")
        .eq("local_part", fromAddress.split("@")[0])
        .maybeSingle()

      if (emailAddr) {
        workspaceId = emailAddr.workspace_id || undefined
        const { data: member } = emailAddr.workspace_id ? await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", emailAddr.workspace_id)
          .eq("user_id", user.id)
          .maybeSingle() : { data: null }

        const isAssigned = emailAddr.assigned_to === user.id
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
        .eq("user_id", user.id)
      if (ownDomains?.length) domain = ownDomains[0]
    }

    if (!domain) {
      const { data: wsMemberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)

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
          if (domainRecords?.length) domain = domainRecords[0]
        }
      }
    }

    if (!domain) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    if (!domain.smtp_provider) {
      return NextResponse.json({ error: "SMTP not configured for this domain. Go to Settings." }, { status: 400 })
    }

    const sendFrom = fromAddress || `you@${domain.domain}`

    // Collect all resolved recipient emails
    const resolvedTo = [...(to || [])]
    const resolvedCc = [...(cc || [])]
    const resolvedBcc = [...(bcc || [])]

    // Expand group IDs into member emails
    if (groupIds?.length) {
      const { data: members } = await supabase
        .from("contact_group_members")
        .select("group_id, contacts!inner(email)")
        .in("group_id", groupIds)

      if (members) {
        for (const m of members) {
          const email = (m as any).contacts?.email
          if (email) resolvedTo.push(email)
        }
      }
    }

    if (resolvedTo.length === 0) {
      return NextResponse.json({ error: "No recipients resolved" }, { status: 400 })
    }

    const emailId = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email_id=${emailId}`
    const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${emailId}" width="1" height="1" alt="" style="display:none" />`
    const unsubscribeHtml = `<p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a></p>`
    let htmlWithTracking = body || ""
    htmlWithTracking = htmlWithTracking.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
    if (htmlWithTracking.includes("<html")) {
      htmlWithTracking = htmlWithTracking.replace("</body>", `${trackingPixel}${unsubscribeHtml}</body>`)
    } else {
      htmlWithTracking = htmlWithTracking + trackingPixel + unsubscribeHtml
    }

    // PGP encrypt for recipients with public keys using authenticated client
    const pgpTo = [...resolvedTo, ...resolvedCc]
    const { encrypted, body: pgpBody } = await encryptForRecipients(htmlWithTracking, pgpTo, supabase)

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
      to: resolvedTo,
      cc: resolvedCc.length > 0 ? resolvedCc : undefined,
      bcc: resolvedBcc.length > 0 ? resolvedBcc : undefined,
      subject,
      text: encrypted ? pgpBody : (textBody || undefined),
      html: encrypted ? undefined : htmlWithTracking,
      priority,
      listUnsubscribe: unsubscribeUrl,
      bulk: true,
    })

    const { error: dbError } = await supabase.from("emails").insert({
      id: emailId,
      user_id: user.id,
      mailbox_address: sendFrom,
      from_address: sendFrom,
      to_addresses: resolvedTo,
      cc_addresses: resolvedCc.length > 0 ? resolvedCc : null,
      subject,
      body_html: body || null,
      body_text: textBody || null,
      direction: "outbound",
      folder: "sent",
      message_id: result.id,
      priority: priority || "normal",
      delivery_status: "sent",
    })

    if (dbError) {
      console.error("Failed to store bulk sent email:", dbError)
    }

    if (workspaceId) await autoSaveContacts(supabase, user.id, workspaceId, [resolvedTo, resolvedCc, resolvedBcc])

    return NextResponse.json({ success: true, id: emailId, recipientsCount: resolvedTo.length })
  } catch (error) {
    console.error("Bulk send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { autoSaveContacts } from "@/lib/contacts"
import { validateRequestBody, sendEmailSchema } from "@/lib/validation"
import { withErrorHandling, RateLimitError, ValidationError, logAuditEvent } from "@/lib/error-handling"

export const POST = withErrorHandling(async (req: Request) => {
  // Validate input first
  const emailData = await validateRequestBody(req, sendEmailSchema)
  
  const auth = await requireAuth(req)
  const { user, supabase, ipAddress } = auth
  const userId = user.id

  // Rate limiting
  const rl = await checkRateLimit(`send:${userId}`, RATE_LIMITS.send)
  if (!rl.allowed) {
    throw new RateLimitError("Too many emails sent. Please wait before sending more.", rl.retryAfter)
  }

  const { to, cc, bcc, subject, body, textBody, fromAddress, attachments, inReplyTo, priority, readReceipt } = emailData

  let domain: any
  let workspaceId: string | undefined

  // Find appropriate domain without using service role
  if (fromAddress) {
    const [localPart] = fromAddress.split("@")
    
    // Query email addresses that user has access to (RLS will filter automatically)
    const { data: emailAddr } = await supabase
      .from("email_addresses")
      .select("domain_id, local_part, workspace_id, assigned_to")
      .eq("local_part", localPart)
      .maybeSingle()

    if (emailAddr) {
      workspaceId = emailAddr.workspace_id || undefined
      const isAssigned = emailAddr.assigned_to === userId
      
      // Check if user is workspace member (RLS will filter)
      const { data: member } = emailAddr.workspace_id ? await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", emailAddr.workspace_id)
        .eq("user_id", userId)
        .maybeSingle() : { data: null }

      if (isAssigned || member) {
        // Get domain info (RLS will filter to accessible domains)
        const { data: domainRecord } = await supabase
          .from("domains")
          .select("*")
          .eq("id", emailAddr.domain_id)
          .single()
        domain = domainRecord
      }
    }
  }

  // Fallback to user's own domains (RLS filtered)
  if (!domain) {
    const { data: ownDomains } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", userId)
    if (ownDomains?.length) domain = ownDomains[0]
  }

  // Fallback to workspace domains the user has access to
  if (!domain) {
    const { data: wsMemberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)

    if (wsMemberships?.length) {
      const wsIds = wsMemberships.map((m: any) => m.workspace_id)
      
      // Get email addresses in these workspaces (RLS filtered)
      const { data: wsEmailAddrs } = await supabase
        .from("email_addresses")
        .select("domain_id")
        .in("workspace_id", wsIds)

      if (wsEmailAddrs?.length) {
        const domainIds = [...new Set(wsEmailAddrs.map((d: any) => d.domain_id))]
        
        // Get domains (RLS will filter to accessible ones)
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
    throw new ValidationError("No domain configured or accessible")
  }

  const sendFrom = fromAddress || `you@${domain.domain}`

  if (!domain.smtp_provider) {
    throw new ValidationError("SMTP not configured for this domain. Go to Settings.")
  }

  // Generate email ID and tracking elements with HMAC-signed tokens
  const emailId = crypto.randomUUID()
  const { signEmailToken } = await import("@/lib/email-token")
  const sig = signEmailToken(emailId)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email_id=${emailId}&sig=${sig}`
  const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${emailId}&sig=${sig}" width="1" height="1" alt="" style="display:none" />`
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

  const parsedAttachments = attachments?.map((att) => ({
    filename: att.filename,
    content: att.content.split(",")[1] || att.content,
    encoding: "base64" as const,
  }))

  const scheduledFor = new Date(Date.now() + 10000).toISOString()

  // Insert email using authenticated client (RLS enforced)
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
    throw new Error("Failed to queue email for sending")
  }

  // Auto-save contacts if workspace is available
  if (workspaceId) {
    await autoSaveContacts(supabase, userId, workspaceId, [to, cc, bcc])
  }

  // Log audit event
  await logAuditEvent("email_queued", "email", emailId, null, {
    to_count: to.length,
    has_attachments: !!attachments?.length,
    domain: domain.domain,
  }, workspaceId)

  return NextResponse.json({ success: true, id: emailId })
})

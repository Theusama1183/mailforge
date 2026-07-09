import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/send"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let newEmailId: string | undefined
  let supabase: any
  try {
    const { id } = await params

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase: sb } = auth
    supabase = sb
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(`send:${user.id}`, RATE_LIMITS.send)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait before sending more emails." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const { data: email, error: fetchError } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    const { data: domainRecord } = await supabase
      .from("domains")
      .select("*")

    if (!domainRecord?.length) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    const domain = domainRecord[0]

    if (!domain.smtp_provider) {
      return NextResponse.json({ error: "SMTP not configured for this domain. Go to Settings." }, { status: 400 })
    }

    newEmailId = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`
    const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${newEmailId}" width="1" height="1" alt="" style="display:none" />`
    const htmlWithTracking = email.body_html?.includes("<html") ? email.body_html.replace("</body>", `${trackingPixel}</body>`) : (email.body_html || "") + trackingPixel

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
      from: email.from_address,
      to: email.to_addresses,
      cc: email.cc_addresses || undefined,
      subject: email.subject || "",
      text: email.body_text || undefined,
      html: htmlWithTracking,
      replyTo: email.in_reply_to || undefined,
    })

    const { error: dbError } = await supabase.from("emails").insert({
      id: newEmailId,
      user_id: user.id,
      mailbox_address: email.mailbox_address,
      from_address: email.from_address,
      to_addresses: email.to_addresses,
      cc_addresses: email.cc_addresses,
      subject: email.subject,
      body_html: email.body_html,
      body_text: email.body_text,
      direction: "outbound",
      folder: "sent",
      message_id: result.id,
      in_reply_to: email.in_reply_to,
      delivery_status: "sent",
    })

    if (dbError) {
      console.error("Failed to store resent email:", dbError)
    }

    return NextResponse.json({ success: true, id: newEmailId })
  } catch (error) {
    console.error("Resend error:", error)
    const errMsg = error instanceof Error ? error.message : "Failed to resend"
    if (newEmailId) {
      await supabase.from("emails").upsert({
        id: newEmailId,
        delivery_status: "failed",
        delivery_error: errMsg,
      }).catch(() => {})
    }
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

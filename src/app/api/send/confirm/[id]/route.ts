import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { sendEmail } from "@/lib/send"
import { encryptForRecipients } from "@/lib/pgp-encrypt"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: email } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    if (email.delivery_status === "sent" || email.delivery_status === "delivered") {
      return NextResponse.json({ success: true, message: "Already sent" })
    }

    if (email.delivery_status !== "queued") {
      return NextResponse.json({ error: "Email cannot be sent (status: " + email.delivery_status + ")" }, { status: 400 })
    }

    let domain: any
    const fromAddress = email.from_address

    if (fromAddress) {
      const { data: emailAddr } = await supabase
        .from("email_addresses")
        .select("domain_id")
        .eq("local_part", fromAddress.split("@")[0])
        .maybeSingle()

      if (emailAddr) {
        const { data: domainRecord } = await supabase
          .from("domains")
          .select("*")
          .eq("id", emailAddr.domain_id)
          .single()
        domain = domainRecord
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
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    if (!domain.smtp_provider) {
      return NextResponse.json({ error: "SMTP not configured" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email_id=${id}`

    // Replace unsubscribe placeholder with real URL
    const htmlWithUnsub = (email.body_html || "").replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)

    // PGP encrypt for recipients with public keys
    const allRecipients = [...email.to_addresses, ...(email.cc_addresses || [])]
    const { encrypted, body: pgpBody } = await encryptForRecipients(htmlWithUnsub, allRecipients)

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
      text: encrypted ? pgpBody : (email.body_text || undefined),
      html: encrypted ? undefined : htmlWithUnsub,
      replyTo: email.in_reply_to || undefined,
      listUnsubscribe: unsubscribeUrl,
      bulk: true,
    })

    const { error: dbError } = await supabase
      .from("emails")
      .update({
        delivery_status: "sent",
        message_id: result.id,
        delivered_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (dbError) {
      console.error("Failed to update sent email:", dbError)
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Confirm send error:", error)
    const errMsg = error instanceof Error ? error.message : "Failed to send"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

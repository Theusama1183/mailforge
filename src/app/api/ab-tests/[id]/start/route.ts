import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { sendEmail } from "@/lib/send"
import crypto from "crypto"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    const { id } = await params

    const body = await req.json()
    const { recipients, fromAddress, workspaceId } = body

    if (!recipients?.length) {
      return NextResponse.json({ error: "recipients array is required" }, { status: 400 })
    }

    const { data: test, error: testErr } = await supabase
      .from("ab_tests")
      .select("*, ab_test_variants(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (testErr || !test) return NextResponse.json({ error: "A/B test not found" }, { status: 404 })
    if (test.status !== "draft") return NextResponse.json({ error: "Test already started" }, { status: 400 })
    if (!test.ab_test_variants?.length || test.ab_test_variants.length !== 2) {
      return NextResponse.json({ error: "Need exactly 2 variants" }, { status: 400 })
    }

    const { data: domain } = await supabase
      .from("domains")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!domain?.smtp_provider) {
      return NextResponse.json({ error: "SMTP not configured" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`
    const sendFrom = fromAddress || `you@${domain.domain}`

    const variantA = test.ab_test_variants[0]
    const variantB = test.ab_test_variants[1]

    const midpoint = Math.ceil(recipients.length / 2)
    const groupA = recipients.slice(0, midpoint)
    const groupB = recipients.slice(midpoint)

    let sentA = 0
    let sentB = 0

    for (const recipient of groupA) {
      const emailId = crypto.randomUUID()
      const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${emailId}" width="1" height="1" alt="" style="display:none" />`
      const html = (variantA.body_html || "") + trackingPixel

      try {
        await sendEmail({
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
          to: [recipient],
          subject: variantA.subject,
          html,
          text: variantA.body_text || undefined,
        })
        await supabase.from("emails").insert({
          id: emailId, user_id: user.id, mailbox_address: sendFrom, from_address: sendFrom,
          to_addresses: [recipient], subject: variantA.subject, body_html: html,
          body_text: variantA.body_text, direction: "outbound", folder: "sent",
          delivery_status: "sent", ab_test_variant_id: variantA.id,
          ...(workspaceId && { workspace_id: workspaceId }),
        })
        sentA++
      } catch { /* skip */ }
    }

    for (const recipient of groupB) {
      const emailId = crypto.randomUUID()
      const trackingPixel = `<img src="${baseUrl}/api/track/open?email_id=${emailId}" width="1" height="1" alt="" style="display:none" />`
      const html = (variantB.body_html || "") + trackingPixel

      try {
        await sendEmail({
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
          to: [recipient],
          subject: variantB.subject,
          html,
          text: variantB.body_text || undefined,
        })
        await supabase.from("emails").insert({
          id: emailId, user_id: user.id, mailbox_address: sendFrom, from_address: sendFrom,
          to_addresses: [recipient], subject: variantB.subject, body_html: html,
          body_text: variantB.body_text, direction: "outbound", folder: "sent",
          delivery_status: "sent", ab_test_variant_id: variantB.id,
          ...(workspaceId && { workspace_id: workspaceId }),
        })
        sentB++
      } catch { /* skip */ }
    }

    await supabase.from("ab_test_variants").update({ sent_count: sentA }).eq("id", variantA.id)
    await supabase.from("ab_test_variants").update({ sent_count: sentB }).eq("id", variantB.id)
    await supabase.from("ab_tests").update({ status: "running" }).eq("id", test.id)

    return NextResponse.json({ success: true, sent: { A: sentA, B: sentB } })
  } catch (error) {
    return NextResponse.json({ error: "Failed to start A/B test" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const { to, subject, body, textBody } = await req.json()
    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(`send-test:${user.id}`, RATE_LIMITS.send)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const { data: domains } = await supabase.from("domains").select("*").eq("user_id", user.id).limit(1)
    const domain = domains?.[0]
    if (!domain) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    const testSubject = `[TEST] ${subject}`
    const testBody = body
      ? body.replace(/<body[^>]*>/i, '<body style="border: 3px solid #f59e0b; padding: 16px;">')
          .replace(/{{unsubscribe_url}}/g, "")
      : ""
    const testTextBody = textBody ? `[TEST EMAIL - Do not forward]\n\n${textBody}` : ""

    const emailId = crypto.randomUUID()
    const { error: dbError } = await supabase.from("emails").insert({
      id: emailId,
      user_id: user.id,
      mailbox_address: `test@${domain.domain}`,
      from_address: `test@${domain.domain}`,
      to_addresses: [to],
      subject: testSubject,
      body_html: testBody,
      body_text: testTextBody,
      direction: "outbound",
      folder: "sent",
      delivery_status: "queued",
      scheduled_for: new Date(Date.now() + 5000).toISOString(),
    })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: emailId, subject: testSubject })
  } catch (error) {
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
  }
}

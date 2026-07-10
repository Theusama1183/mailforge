import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyEmailToken } from "@/lib/email-token"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const emailId = url.searchParams.get("email_id")
  const sig = url.searchParams.get("sig")

  if (!emailId || !sig) {
    return new NextResponse("Missing email_id or signature", { status: 400 })
  }

  if (!verifyEmailToken(emailId, sig)) {
    return new NextResponse("Invalid signature", { status: 403 })
  }

  try {
    const supabase = createAdminClient()

    await supabase.from("emails").update({ unsubscribed: true }).eq("id", emailId)

    await supabase.from("email_events").insert({
      email_id: emailId,
      event_type: "unsubscribe",
    })

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    h1 { font-size: 24px; color: #111827; margin: 0 0 8px; }
    p { color: #6b7280; margin: 0; line-height: 1.5; }
    .check { width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">&#10003;</div>
    <h1>You have been unsubscribed</h1>
    <p>You will no longer receive emails from this sender. We're sorry to see you go.</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (err) {
    console.error("Unsubscribe error:", err)
    return new NextResponse("Failed to unsubscribe", { status: 500 })
  }
}

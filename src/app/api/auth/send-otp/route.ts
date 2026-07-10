import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"

function generateOTP(): string {
  return crypto.randomInt(1000, 10000).toString()
}

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

function renderOTPEmail(otp: string, minutes: number): string {
  const digits = otp.split("")
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your MailForge verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #3b82f6, #2563eb);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;">
                <span style="opacity:0.9;">Mail</span><span style="font-weight:800;">Forge</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 8px 0;">Your verification code</p>
              <h2 style="color:#1e293b;font-size:32px;font-weight:800;margin:0 0 24px 0;letter-spacing:8px;text-align:center;">
                ${digits.map(d => `<span style="display:inline-block;background:#f1f5f9;padding:8px 12px;border-radius:8px;margin:0 4px;min-width:32px;">${d}</span>`).join("")}
              </h2>
              <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 8px 0;">
                This code expires in <strong style="color:#3b82f6;">${minutes} minutes</strong>.
              </p>
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
                If you didn't create an account with MailForge, you can safely ignore this email.
              </p>
              <!-- Divider -->
              <div style="border-top:1px solid #e2e8f0;margin:24px 0;"></div>
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                MailForge &mdash; Self-hosted email management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rl = await checkRateLimit(`send-otp:${email}:${ip}`, { interval: 60_000, maxRequests: 3 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait before requesting another code." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const admin = createAdminClient()

    // Generate OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)

    // Check if user exists in auth.users
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string | null = null
    if (existingUser) {
      userId = existingUser.id
    }

    // Store OTP in database
    const { error: insertError } = await admin.from("auth_otps").insert({
      user_id: userId,
      otp_hash: otpHash,
      email,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    if (insertError) {
      console.error("Failed to store OTP:", insertError)
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 })
    }

    // Send email via SMTP
    const sent = await sendEmail({
      to: email,
      subject: "Your MailForge verification code",
      html: renderOTPEmail(otp, 5),
      text: `Your MailForge verification code is: ${otp}. It expires in 5 minutes.`,
    })

    if (!sent) {
      return NextResponse.json({ error: "OTP generated but email failed to send. Check SMTP config." }, { status: 500 })
    }

    return NextResponse.json({ sent: true, message: "Verification code sent" })
  } catch (error) {
    console.error("send-otp error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

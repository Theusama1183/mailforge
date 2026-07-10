import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/send"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const admin = createAdminClient()

    const { data: user } = await admin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle()
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token
    await admin.from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://${req.headers.get("host") || "localhost:3000"}`
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    // Send reset email directly via system SMTP (avoids auth issue with /api/send)
    const systemSmtpHost = process.env.SYSTEM_SMTP_HOST
    const systemSmtpUser = process.env.SYSTEM_SMTP_USER
    const systemSmtpPass = process.env.SYSTEM_SMTP_PASS
    const systemFromEmail = process.env.SYSTEM_FROM_EMAIL || "noreply@mailforge.app"

    if (systemSmtpHost && systemSmtpUser && systemSmtpPass) {
      try {
        await sendEmail({
          smtp: {
            provider: "custom",
            host: systemSmtpHost,
            port: parseInt(process.env.SYSTEM_SMTP_PORT || "587"),
            username: systemSmtpUser,
            password: systemSmtpPass,
          },
          from: systemFromEmail,
          to: [email],
          subject: "Reset your MailForge password",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="margin-bottom:16px">Password Reset</h2>
            <p style="color:#6b7280;margin-bottom:24px">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#111827;color:white;text-decoration:none;border-radius:8px;font-weight:500">
              Reset Password
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
          </div>`,
        })
      } catch (err) {
        console.error("Failed to send reset email via SMTP:", err)
      }
    } else {
      console.log("No system SMTP configured — reset link:", resetLink)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

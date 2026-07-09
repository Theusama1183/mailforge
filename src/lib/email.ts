/**
 * Email sending utility for MailForge
 * Sends transactional emails (invitations, notifications) via SMTP or Mailgun
 */
import nodemailer from "nodemailer"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

const FROM_NAME = "MailForge"
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "noreply@mailforge.app"

function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  // Fallback: try Mailgun API directly via fetch
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    // Use nodemailer with Mailgun's SMTP endpoint
    return nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      auth: {
        user: "postmaster@" + process.env.MAILGUN_DOMAIN,
        pass: process.env.MAILGUN_API_KEY,
      },
    })
  }
  return null
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn("Email not sent - configure SMTP_HOST/SMTP_USER/SMTP_PASS or MAILGUN_API_KEY")
    return false
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || "",
    })
    console.log("Email sent successfully")
    return true
  } catch (err) {
    console.error("Failed to send email:", err)
    return false
  }
}

/**
 * Generate the HTML for an invitation email
 */
export function renderInviteEmail(params: {
  inviterName: string
  workspaceName: string
  acceptUrl: string
  message?: string
}): string {
  const { inviterName, workspaceName, acceptUrl, message } = params

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${workspaceName}</title>
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
            <td style="padding:32px 40px;">
              <h2 style="color:#1e293b;font-size:20px;font-weight:600;margin:0 0 8px 0;">
                You're invited to <span style="color:#3b82f6;">${workspaceName}</span>
              </h2>
              <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                <strong style="color:#1e293b;">${inviterName}</strong> has invited you to join their workspace on MailForge.
                ${message ? `<br/><br/>"${message}"` : ""}
              </p>
              <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                MailForge lets you create, manage, and route email addresses on your domain — all from one dashboard.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #3b82f6, #2563eb);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(59,130,246,0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Divider -->
              <div style="border-top:1px solid #e2e8f0;margin:24px 0;"></div>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
                This invitation expires in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">
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

import nodemailer from "nodemailer"

const MAILGUN_API = "https://api.mailgun.net/v3"

interface SendParams {
  from: string
  fromName?: string
  to: string[]
  subject: string
  text?: string
  html?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  priority?: "low" | "normal" | "high"
  readReceipt?: boolean
  attachments?: { filename: string; content: string; encoding?: string }[]
  listUnsubscribe?: string
  bulk?: boolean
}

interface SmtpConfig {
  provider: "mailgun" | "gmail" | "custom"
  host?: string
  port?: number
  username?: string
  password?: string
  mailgunApiKey?: string
  mailgunDomain?: string
}

function getPriorityHeader(priority: "low" | "normal" | "high" | undefined): { "X-Priority": string; "X-MSMail-Priority": string } | Record<string, never> {
  if (!priority || priority === "normal") return {}
  return {
    "X-Priority": priority === "high" ? "1" : "5",
    "X-MSMail-Priority": priority === "high" ? "High" : "Low",
  }
}

export async function sendEmail(params: SendParams & { smtp: SmtpConfig }) {
  const { smtp, from, fromName, to, subject, text, html, cc, bcc, replyTo, priority, readReceipt, attachments, listUnsubscribe, bulk } = params
  const fromAddress = fromName ? `${fromName} <${from}>` : from
  const headers: Record<string, string> = { ...getPriorityHeader(priority) }
  if (readReceipt && from) {
    headers["Disposition-Notification-To"] = from
  }
  if (listUnsubscribe) {
    headers["List-Unsubscribe"] = `<${listUnsubscribe}>`
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
  }
  if (bulk) {
    headers["Precedence"] = "bulk"
  }

  if (smtp.provider === "mailgun") {
    if (!smtp.mailgunApiKey) throw new Error("Mailgun API key is required")
    const mailgunDomain = smtp.mailgunDomain || from.split("@")[1]
    if (!mailgunDomain) throw new Error("Mailgun domain is required")
    return sendViaMailgun(smtp.mailgunApiKey, mailgunDomain, { from: fromAddress, to, subject, text, html, cc, bcc, replyTo, attachments, headers })
  }

  return sendViaSmtp(smtp, { from: fromAddress, to, subject, text, html, cc, bcc, replyTo, attachments, headers })
}

async function sendViaMailgun(apiKey: string, domain: string, params: { from: string; to: string[]; subject: string; text?: string; html?: string; cc?: string[]; bcc?: string[]; replyTo?: string; attachments?: { filename: string; content: string; encoding?: string }[]; headers?: Record<string, string> }) {
  const form = new FormData()
  form.append("from", params.from)
  params.to.forEach((addr) => form.append("to", addr))
  form.append("subject", params.subject)
  if (params.text) form.append("text", params.text)
  if (params.html) form.append("html", params.html)
  params.cc?.forEach((addr) => form.append("cc", addr))
  params.bcc?.forEach((addr) => form.append("bcc", addr))
  if (params.replyTo) form.append("h:Reply-To", params.replyTo)
  if (params.headers) {
    for (const [key, value] of Object.entries(params.headers)) {
      form.append(`h:${key}`, value)
    }
  }

  if (params.attachments) {
    for (const att of params.attachments) {
      const raw = Buffer.from(att.content, "base64")
      const blob = new Blob([raw], { type: "application/octet-stream" })
      form.append("attachment", blob, att.filename)
    }
  }

  const res = await fetch(`${MAILGUN_API}/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mailgun error: ${res.status} ${err}`)
  }

  return res.json()
}

async function sendViaSmtp(config: SmtpConfig, params: { from: string; to: string[]; subject: string; text?: string; html?: string; cc?: string[]; bcc?: string[]; replyTo?: string; attachments?: { filename: string; content: string; encoding?: string }[]; headers?: Record<string, string> }) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port || 587,
    secure: (config.port || 587) === 465,
    auth: {
      user: config.username,
      pass: config.password,
    },
  })

  const mailOptions: nodemailer.SendMailOptions = {
    from: params.from,
    to: params.to.join(", "),
    cc: params.cc?.join(", "),
    bcc: params.bcc?.join(", "),
    subject: params.subject,
    text: params.text,
    html: params.html,
    replyTo: params.replyTo,
    headers: params.headers,
  }

  if (params.attachments && params.attachments.length > 0) {
    mailOptions.attachments = params.attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      encoding: att.encoding || "base64",
    }))
  }

  const info = await transporter.sendMail(mailOptions)

  return { id: info.messageId, messageId: info.messageId }
}

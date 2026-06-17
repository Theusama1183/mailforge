const MAILGUN_API = "https://api.mailgun.net/v3"

export interface SendEmailParams {
  domain: string
  apiKey: string
  from: string
  to: string[]
  subject: string
  text?: string
  html?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

export async function sendEmail(params: SendEmailParams) {
  const { domain, apiKey, from, to, subject, text, html, cc, bcc, replyTo } = params

  const form = new FormData()
  form.append("from", from)
  to.forEach((addr) => form.append("to", addr))
  form.append("subject", subject)
  if (text) form.append("text", text)
  if (html) form.append("html", html)
  cc?.forEach((addr) => form.append("cc", addr))
  bcc?.forEach((addr) => form.append("bcc", addr))
  if (replyTo) form.append("h:Reply-To", replyTo)

  const res = await fetch(`${MAILGUN_API}/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mailgun error: ${res.status} ${err}`)
  }

  return res.json()
}

import crypto from "crypto"

const HMAC_ALGORITHM = "sha256"

function getHmacSecret(): string {
  const secret = process.env.EMAIL_WEBHOOK_SECRET || process.env.IMAP_ENCRYPTION_KEY || ""
  if (!secret) {
    throw new Error("EMAIL_WEBHOOK_SECRET or IMAP_ENCRYPTION_KEY must be set for token signing")
  }
  return crypto.createHash("sha256").update("mailforge-tracking:" + secret).digest("hex")
}

export function signEmailToken(emailId: string): string {
  const hmac = crypto.createHmac(HMAC_ALGORITHM, getHmacSecret())
  hmac.update(emailId)
  return hmac.digest("base64url")
}

export function verifyEmailToken(emailId: string, signature: string): boolean {
  try {
    const expected = signEmailToken(emailId)
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

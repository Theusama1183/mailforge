const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "throwaway.email",
  "yopmail.com",
  "sharklasers.com",
  "10minutemail.com",
])

const FREE_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "icloud.com",
  "me.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
])

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email: string): boolean {
  if (!email) return false
  if (email.length > 254) return false
  if (!EMAIL_REGEX.test(email)) return false
  const [local] = email.split("@")
  if (!local || local.length > 64) return false
  if (local.startsWith(".") || local.endsWith(".")) return false
  if (/\.{2,}/.test(local)) return false
  return true
}

export function isDisposableEmail(email: string): boolean {
  if (!isValidEmail(email)) return false
  const domain = email.split("@")[1].toLowerCase()
  return DISPOSABLE_DOMAINS.has(domain)
}

export function isBusinessEmail(email: string): boolean {
  if (!isValidEmail(email)) return false
  const domain = email.split("@")[1].toLowerCase()
  return !FREE_PROVIDERS.has(domain)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

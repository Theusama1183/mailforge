export function parseUserAgent(ua: string | null): { device_type: string; email_client: string } {
  if (!ua) return { device_type: null!, email_client: null! }
  const lower = ua.toLowerCase()

  let device_type = "desktop"
  if (/mobile|android|iphone|ipod/i.test(lower) && !/ipad|tablet/i.test(lower)) device_type = "mobile"
  else if (/ipad|tablet|playbook|silk/i.test(lower)) device_type = "tablet"

  let email_client = "Unknown"
  if (lower.includes("outlook")) email_client = "Outlook"
  else if (lower.includes("gmail")) email_client = "Gmail"
  else if (lower.includes("apple mail") || lower.includes("mail.app") || lower.includes("cfnetwork")) email_client = "Apple Mail"
  else if (lower.includes("yahoo")) email_client = "Yahoo Mail"
  else if (lower.includes("thunderbird")) email_client = "Thunderbird"
  else if (lower.includes("samsung")) email_client = "Samsung Mail"
  else if (lower.includes("mail.ru")) email_client = "Mail.ru"
  else if (lower.includes("aol")) email_client = "AOL Mail"
  else if (lower.includes("protonmail")) email_client = "Proton Mail"
  else if (lower.includes("fastmail")) email_client = "Fastmail"
  else if (lower.includes("zimbra")) email_client = "Zimbra"

  return { device_type, email_client }
}

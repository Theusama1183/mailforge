/**
 * Email utility functions for display formatting.
 * Does NOT alter email content — only how it is decoded and presented.
 */

/**
 * Decode MIME encoded-word syntax: =?charset?encoding?text?=
 * Supports both Q (quoted-printable) and B (base64) encoding.
 * Example: =?utf-8?q?=F0=9F=8E=AF_Lead_Generated=3A_CarrierSource?=
 *   → "🎯 Lead Generated: CarrierSource"
 */
export function decodeMimeSubject(subject: string | null | undefined): string {
  if (!subject) return "(No subject)"

  // Decode all encoded-word segments
  return subject.replace(
    /=\?([^?]+)\?([qQbB])\?([^?]*)\?=/g,
    (_match, charset: string, encoding: string, text: string) => {
      try {
        if (encoding.toLowerCase() === "q") {
          // Quoted-printable: =HH represents a byte, _ represents space
          const decoded = text
            .replace(/_/g, " ")
            .replace(/=([0-9A-Fa-f]{2})/g, (_m: string, hex: string) =>
              String.fromCharCode(parseInt(hex, 16))
            )
          // Try UTF-8 decode if the raw bytes are multi-byte
          try {
            const bytes = new TextEncoder().encode(decoded)
            return new TextDecoder(charset || "utf-8").decode(bytes)
          } catch {
            return decoded
          }
        } else {
          // Base64
          const binaryStr = atob(text)
          const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0))
          return new TextDecoder(charset || "utf-8").decode(bytes)
        }
      } catch {
        // Fallback: return raw text
        return text
      }
    }
  )
}

/**
 * Format plain text email body for display.
 * Preserves line breaks, adds section spacing, detects label:value pairs,
 * and returns clean HTML for rendering.
 */
export function formatPlainTextBody(text: string | null | undefined): string {
  if (!text) return ""

  const cleaned = stripInvisibleChars(text)
  const lines = cleaned.split(/\r?\n/)
  const parts: string[] = []
  let inBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line = section break
    if (!trimmed) {
      if (inBlock) {
        parts.push("")
        inBlock = false
      }
      continue
    }

    // Label: Value pattern
    const labelMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9\s-]+?):\s*(.*)/)
    if (labelMatch && labelMatch[2]) {
      // Has label:value — only show if value is present
      const value = labelMatch[2].trim()
      if (value) {
        const encodedLabel = encodeHtml(labelMatch[1])
        const encodedValue = autoLink(encodeHtml(value))
        parts.push(
          `<div class="email-field"><span class="email-label">${encodedLabel}:</span> <span class="email-value">${encodedValue}</span></div>`
        )
        inBlock = true
      }
      continue
    }

    // Separator line (---, ===, ***)
    if (/^[-=*]{3,}$/.test(trimmed)) {
      parts.push(`<hr class="email-separator" />`)
      continue
    }

    // List item (- item, * item, 1. item)
    const listMatch = trimmed.match(/^(\s*[-*]\s|\s*\d+[.)]\s)(.*)/)
    if (listMatch) {
      const encodedText = autoLink(encodeHtml(listMatch[2]))
      parts.push(`<div class="email-list-item">${encodedText}</div>`)
      inBlock = true
      continue
    }

    // Status/value badges (e.g. "new_site", "active", "completed")
    const badgeValue = tryFormatBadge(trimmed)
    if (badgeValue !== trimmed) {
      parts.push(`<div class="email-badge-row">${badgeValue}</div>`)
      inBlock = true
      continue
    }

    // Regular paragraph
    const encodedLine = autoLink(encodeHtml(trimmed))
    if (inBlock && parts.length > 0 && parts[parts.length - 1] !== "") {
      // Append as a line break within the block
      const last = parts.pop() || ""
      parts.push(last + `<br />${encodedLine}`)
    } else {
      parts.push(`<div class="email-paragraph">${encodedLine}</div>`)
    }
    inBlock = true
  }

  return parts.join("\n")
}

/**
 * Auto-link URLs and email addresses in text.
 */
export function autoLink(text: string): string {
  // URL pattern: http://, https://, or www.
  const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
  // Email pattern
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

  return text
    .replace(urlPattern, (url) => {
      const href = url.startsWith("www.") ? `https://${url}` : url
      const display = url.length > 60 ? url.slice(0, 55) + "…" : url
      return `<a href="${encodeHtml(href)}" target="_blank" rel="noopener noreferrer" class="email-link">${encodeHtml(display)}</a>`
    })
    .replace(emailPattern, (email) => {
      return `<a href="mailto:${encodeHtml(email)}" class="email-link">${encodeHtml(email)}</a>`
    })
}

/**
 * Convert raw status/value strings to readable badge HTML.
 * "new_site" → <span class="badge">New Site</span>
 * "active"  → <span class="badge badge-success">Active</span>
 */
export function tryFormatBadge(value: string): string {
  // Detect snake_case, kebab-case, or lowercase status values
  if (/^[a-z]+(_[a-z]+)*$/.test(value) || /^[a-z]+(-[a-z]+)*$/.test(value)) {
    const readable = value
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())

    // Determine badge variant
    const lower = value.toLowerCase()
    let variant = "default"
    if (["active", "success", "completed", "done", "verified", "paid"].some((s) => lower.includes(s))) {
      variant = "success"
    } else if (["error", "failed", "cancelled", "rejected", "bounced"].some((s) => lower.includes(s))) {
      variant = "danger"
    } else if (["pending", "waiting", "processing", "scheduled"].some((s) => lower.includes(s))) {
      variant = "warning"
    }

    const variantClass =
      variant === "success"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : variant === "danger"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : variant === "warning"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"

    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClass}">${encodeHtml(readable)}</span>`
  }
  return value
}

/**
 * HTML-encode a string to prevent XSS.
 */
function encodeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Extract label/value pairs from text body.
 * Returns array of { label, value } for structured display.
 */
export function extractLabelValuePairs(text: string): { label: string; value: string }[] {
  if (!text) return []
  const pairs: { label: string; value: string }[] = []
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9\s-]+?):\s*(.*)/)
    if (match && match[2]?.trim()) {
      pairs.push({ label: match[1].trim(), value: match[2].trim() })
    }
  }
  return pairs
}

/**
 * Format a single email address for display, truncating if too long.
 */
export function formatAddress(address: string, maxLen = 48): string {
  if (!address) return ""
  if (address.length <= maxLen) return address
  const [local, domain] = address.split("@")
  if (domain && local) {
    const maxLocal = maxLen - domain.length - 3
    if (maxLocal > 3) {
      return `${local.slice(0, maxLocal)}…@${domain}`
    }
  }
  return address.slice(0, maxLen) + "…"
}

/**
 * Clean a sender display name by stripping embedded email addresses
 * like `"ClickUp Team" <team@mail.clickup.com>` → `ClickUp Team`
 */
export function cleanSenderName(name: string): string {
  return name.replace(/\s*<[^>]+>\s*$/, "").replace(/^["']|["']$/g, "").trim() || name
}

/**
 * Strip invisible / zero-width Unicode characters from text.
 * These are commonly used by email senders for tracking / formatting
 * and cause garbled-looking snippets.
 */
export function stripInvisibleChars(str: string): string {
  return str.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u2064\uFEFF\u034F\u00AD\u2000-\u200A]+/g, " ").trim()
}

/**
 * Truncate a string to a given length with ellipsis.
 */
export function truncateText(str: string, len = 80): string {
  if (!str) return ""
  const cleaned = stripInvisibleChars(str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
  if (cleaned.length <= len) return cleaned
  return cleaned.slice(0, len).trimEnd() + "…"
}

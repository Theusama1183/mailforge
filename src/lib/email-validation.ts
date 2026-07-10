interface LinkValidationResult {
  url: string
  valid: boolean
  status?: number
  error?: string
}

interface ValidationReport {
  total_links: number
  valid_links: number
  invalid_links: number
  results: LinkValidationResult[]
}

export function extractLinks(html: string): string[] {
  if (!html) return []
  const links: string[] = []
  const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi
  let match
  while ((match = anchorRegex.exec(html)) !== null) {
    if (match[1] && !match[1].startsWith("mailto:") && !match[1].startsWith("tel:")) {
      links.push(match[1])
    }
  }
  return [...new Set(links)]
}

export function isInternalLink(url: string): boolean {
  return url.startsWith("/") || url.startsWith("#") || url.startsWith("{{")
}

export function validateLinkUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "Empty URL" }
  }
  if (isInternalLink(url)) {
    return { valid: true }
  }
  try {
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: `Unsupported protocol: ${parsed.protocol}` }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: "Malformed URL" }
  }
}

export function validateAllLinks(html: string): ValidationReport {
  const urls = extractLinks(html)
  const results = urls.map((url) => {
    const { valid, error } = validateLinkUrl(url)
    return { url, valid, error }
  })
  return {
    total_links: results.length,
    valid_links: results.filter((r) => r.valid).length,
    invalid_links: results.filter((r) => !r.valid).length,
    results,
  }
}

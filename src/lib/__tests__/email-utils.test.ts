import { describe, it, expect } from "@jest/globals"
import {
  decodeMimeSubject,
  formatPlainTextBody,
  autoLink,
  tryFormatBadge,
  extractLabelValuePairs,
  formatAddress,
  cleanSenderName,
  stripInvisibleChars,
  truncateText,
} from "@/lib/email-utils"

describe("decodeMimeSubject", () => {
  it("decodes Q-encoded quoted-printable subject", () => {
    const encoded = "=?utf-8?Q?Hello=20World?="
    expect(decodeMimeSubject(encoded)).toBe("Hello World")
  })

  it("decodes Q-encoded underscore as space", () => {
    const encoded = "=?utf-8?Q?hello_world?="
    expect(decodeMimeSubject(encoded)).toBe("hello world")
  })

  it("returns plain subject unchanged", () => {
    expect(decodeMimeSubject("Hello World")).toBe("Hello World")
  })

  it("returns '(No subject)' for null/undefined/empty", () => {
    expect(decodeMimeSubject(null)).toBe("(No subject)")
    expect(decodeMimeSubject(undefined)).toBe("(No subject)")
    expect(decodeMimeSubject("")).toBe("(No subject)")
  })

  it("handles multiple encoded segments", () => {
    const encoded = "=?utf-8?Q?Hello?= =?utf-8?Q?World?="
    expect(decodeMimeSubject(encoded)).toBe("Hello World")
  })

  it("falls back to raw text on decode failure", () => {
    const encoded = "=?utf-8?Q?=ZZ?="
    const result = decodeMimeSubject(encoded)
    expect(result).not.toContain("=ZZ")
  })
})

describe("formatPlainTextBody", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(formatPlainTextBody(null)).toBe("")
    expect(formatPlainTextBody(undefined)).toBe("")
    expect(formatPlainTextBody("")).toBe("")
  })

  it("wraps paragraphs in divs", () => {
    const result = formatPlainTextBody("Hello world")
    expect(result).toContain("Hello world")
    expect(result).toContain("email-paragraph")
  })

  it("formats label:value pairs", () => {
    const result = formatPlainTextBody("Name: John Doe")
    expect(result).toContain("email-field")
    expect(result).toContain("email-label")
    expect(result).toContain("email-value")
  })

  it("converts separator lines to hr", () => {
    const result = formatPlainTextBody("---")
    expect(result).toContain("email-separator")
  })

  it("formats list items", () => {
    const result = formatPlainTextBody("- item one")
    expect(result).toContain("email-list-item")
    expect(result).toContain("item one")
  })
})

describe("autoLink", () => {
  it("links http URLs", () => {
    const result = autoLink("Visit https://example.com")
    expect(result).toContain("target=\"_blank\"")
    expect(result).toContain("email-link")
  })

  it("links www URLs with https:// prefix", () => {
    const result = autoLink("Go to www.example.com")
    expect(result).toContain("www.example.com")
    expect(result).toContain("email-link")
  })

  it("links email addresses", () => {
    const result = autoLink("Contact test@example.com")
    expect(result).toContain("mailto:test@example.com")
    expect(result).toContain("email-link")
  })

  it("truncates long URLs in display text", () => {
    const longUrl = "https://example.com/" + "a".repeat(60)
    const result = autoLink(longUrl)
    expect(result).toContain("…")
  })
})

describe("tryFormatBadge", () => {
  it("formats snake_case to readable badge", () => {
    const result = tryFormatBadge("new_site")
    expect(result).toContain("New Site")
    expect(result).toContain("inline-flex")
  })

  it("formats kebab-case to readable badge", () => {
    const result = tryFormatBadge("in-progress")
    expect(result).toContain("In Progress")
  })

  it("applies success variant for status keywords", () => {
    const result = tryFormatBadge("completed")
    expect(result).toContain("bg-green-100")
  })

  it("applies danger variant for error keywords", () => {
    const result = tryFormatBadge("failed")
    expect(result).toContain("bg-red-100")
  })

  it("applies warning variant for pending keywords", () => {
    const result = tryFormatBadge("processing")
    expect(result).toContain("bg-yellow-100")
  })

  it("returns value unchanged if not a badge pattern", () => {
    expect(tryFormatBadge("Some Random Text")).toBe("Some Random Text")
  })
})

describe("extractLabelValuePairs", () => {
  it("extracts label-value pairs from text", () => {
    const text = "Name: Alice\nEmail: alice@test.com"
    const pairs = extractLabelValuePairs(text)
    expect(pairs).toEqual([
      { label: "Name", value: "Alice" },
      { label: "Email", value: "alice@test.com" },
    ])
  })

  it("returns empty array for empty input", () => {
    expect(extractLabelValuePairs("")).toEqual([])
    expect(extractLabelValuePairs(null as unknown as string)).toEqual([])
  })

  it("skips lines without value", () => {
    const text = "Label: "
    expect(extractLabelValuePairs(text)).toEqual([])
  })
})

describe("formatAddress", () => {
  it("returns address unchanged if within max length", () => {
    expect(formatAddress("user@example.com")).toBe("user@example.com")
  })

  it("truncates long addresses", () => {
    const long = "verylongusername@example.com"
    expect(formatAddress(long, 20)).toContain("…")
  })

  it("returns empty string for falsy input", () => {
    expect(formatAddress("")).toBe("")
    expect(formatAddress(null as unknown as string)).toBe("")
  })
})

describe("cleanSenderName", () => {
  it("strips embedded email from sender name", () => {
    expect(cleanSenderName('"ClickUp Team" <team@mail.clickup.com>')).toBe("ClickUp Team")
  })

  it("returns original name if no email embedded", () => {
    expect(cleanSenderName("Alice")).toBe("Alice")
  })
})

describe("stripInvisibleChars", () => {
  it("removes zero-width spaces and replaces with regular spaces", () => {
    const input = "Hello\u200BWorld"
    expect(stripInvisibleChars(input)).toBe("Hello World")
  })
})

describe("truncateText", () => {
  it("returns empty string for falsy input", () => {
    expect(truncateText("")).toBe("")
    expect(truncateText(null as unknown as string)).toBe("")
  })

  it("returns text unchanged if within limit", () => {
    expect(truncateText("Hello", 80)).toBe("Hello")
  })

  it("truncates and adds ellipsis", () => {
    const long = "a".repeat(100)
    const result = truncateText(long, 10)
    expect(result).toBe("a".repeat(10) + "…")
    expect(result.length).toBe(11)
  })
})

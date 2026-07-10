import { describe, it, expect } from "@jest/globals"
import {
  isValidEmail,
  isDisposableEmail,
  isBusinessEmail,
  normalizeEmail,
} from "@/lib/email-validator"

describe("isValidEmail", () => {
  it("accepts valid email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
    expect(isValidEmail("test.user@domain.co")).toBe(true)
    expect(isValidEmail("user+tag@example.org")).toBe(true)
    expect(isValidEmail("a@b.co")).toBe(true)
  })

  it("rejects invalid email addresses", () => {
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail("notanemail")).toBe(false)
    expect(isValidEmail("@domain.com")).toBe(false)
    expect(isValidEmail("user@")).toBe(false)
    expect(isValidEmail("user@.com")).toBe(false)
    expect(isValidEmail(".user@domain.com")).toBe(false)
    expect(isValidEmail("user.@domain.com")).toBe(false)
    expect(isValidEmail("user..name@domain.com")).toBe(false)
  })

  it("rejects emails exceeding length limits", () => {
    const longLocal = "a".repeat(65) + "@domain.com"
    expect(isValidEmail(longLocal)).toBe(false)

    const longTotal = "a".repeat(250) + "@b.co"
    expect(isValidEmail(longTotal)).toBe(false)
  })
})

describe("isDisposableEmail", () => {
  it("returns true for known disposable domains", () => {
    expect(isDisposableEmail("test@mailinator.com")).toBe(true)
    expect(isDisposableEmail("test@guerrillamail.com")).toBe(true)
    expect(isDisposableEmail("test@yopmail.com")).toBe(true)
  })

  it("returns false for non-disposable domains", () => {
    expect(isDisposableEmail("user@gmail.com")).toBe(false)
    expect(isDisposableEmail("user@example.com")).toBe(false)
  })

  it("returns false for invalid email", () => {
    expect(isDisposableEmail("invalid")).toBe(false)
  })
})

describe("isBusinessEmail", () => {
  it("returns true for non-free provider domains", () => {
    expect(isBusinessEmail("user@acme.com")).toBe(true)
    expect(isBusinessEmail("user@company.org")).toBe(true)
  })

  it("returns false for free provider domains", () => {
    expect(isBusinessEmail("user@gmail.com")).toBe(false)
    expect(isBusinessEmail("user@yahoo.com")).toBe(false)
    expect(isBusinessEmail("user@outlook.com")).toBe(false)
    expect(isBusinessEmail("user@protonmail.com")).toBe(false)
  })

  it("returns false for invalid email", () => {
    expect(isBusinessEmail("invalid")).toBe(false)
  })
})

describe("normalizeEmail", () => {
  it("lowercases the email", () => {
    expect(normalizeEmail("User@Example.COM")).toBe("user@example.com")
  })

  it("trims whitespace", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com")
  })
})

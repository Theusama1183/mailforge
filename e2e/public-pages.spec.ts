import { test, expect } from "@playwright/test"

export {}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

test.describe("MailForge Public Pages", () => {
  test("/login loads with heading and form elements", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.getByRole("heading", { name: /Welcome back|Create account/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    console.log("  ✓ /login")
  })

  test("/terms loads with heading", async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`)
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible()
    console.log("  ✓ /terms")
  })

  test("/privacy loads with heading", async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`)
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible()
    console.log("  ✓ /privacy")
  })

  test("/forgot-password loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`)
    await expect(page.getByRole("heading", { name: /Forgot password|Reset password/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    console.log("  ✓ /forgot-password")
  })

  test("/mfa-challenge loads or redirects appropriately", async ({ page }) => {
    await page.goto(`${BASE_URL}/mfa-challenge`, { waitUntil: "networkidle" })
    await page.waitForTimeout(2000)
    const url = page.url()
    const isExpected = url.includes("/mfa-challenge") || url.includes("/login")
    expect(isExpected).toBeTruthy()
    console.log("  ✓ /mfa-challenge")
  })
})

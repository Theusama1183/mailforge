import { test, expect } from "@playwright/test"

export { }

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

test.describe("MailForge Navigation Tests", () => {
  test.describe("Root redirect", () => {
    test("/ redirects to /inbox then /login when unauthenticated", async ({ page }) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" })
      await page.waitForTimeout(2000)
      expect(page.url()).toContain("/login")
      console.log("  ✓ / → /inbox → /login (unauthenticated)")
    })
  })

  test.describe("Dashboard redirects when unauthenticated", () => {
    test("/workspaces redirects to /login", async ({ page }) => {
      await page.goto(`${BASE_URL}/workspaces`, { waitUntil: "networkidle" })
      await page.waitForTimeout(2000)
      expect(page.url()).toContain("/login")
      console.log("  ✓ /workspaces → /login")
    })

    test("/inbox redirects to /login", async ({ page }) => {
      await page.goto(`${BASE_URL}/inbox`, { waitUntil: "networkidle" })
      await page.waitForTimeout(2000)
      expect(page.url()).toContain("/login")
      console.log("  ✓ /inbox → /login")
    })
  })

  test.describe("Middleware redirects", () => {
    test("protected routes redirect to /login when unauthenticated", async ({ page }) => {
      const protectedRoutes = [
        { path: "/workspaces", name: "/workspaces" },
        { path: "/inbox", name: "/inbox" },
      ]

      for (const route of protectedRoutes) {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle" })
        await page.waitForTimeout(1500)
        expect(page.url()).toContain("/login")
        console.log(`  ✓ ${route.name} → /login (middleware)`)
      }
    })

    test("public pages are accessible without authentication", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await expect(page.getByRole("heading", { name: /Welcome back|Create account/i })).toBeVisible()
      console.log("  ✓ /login accessible")

      await page.goto(`${BASE_URL}/forgot-password`)
      await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible()
      console.log("  ✓ /forgot-password accessible")

      await page.goto(`${BASE_URL}/terms`)
      await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible()
      console.log("  ✓ /terms accessible")

      await page.goto(`${BASE_URL}/privacy`)
      await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible()
      console.log("  ✓ /privacy accessible")
    })
  })
})

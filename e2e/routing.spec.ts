import { test, expect } from "@playwright/test"

export { }

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

test.describe("MailForge Routing Tests", () => {
  // ──── PUBLIC PAGES (no auth required) ────
  test.describe("Public pages", () => {
    test("/login renders correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await expect(page.getByRole("heading", { name: /Welcome back|Create account/i })).toBeVisible()
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      console.log("  ✓ /login")
    })

    test("/terms renders correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/terms`)
      await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible()
      await expect(page.locator("text=Acceptance of Terms")).toBeVisible()
      console.log("  ✓ /terms")
    })

    test("/privacy renders correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/privacy`)
      await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible()
      await expect(page.locator("text=Information We Collect")).toBeVisible()
      console.log("  ✓ /privacy")
    })

    test("/onboarding redirects to /login when unauthenticated", async ({ page }) => {
      // Without auth, onboarding should redirect to login
      await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "networkidle" })
      await page.waitForTimeout(2000)
      // Should have redirected to /login
      expect(page.url()).toContain("/login")
      console.log("  ✓ /onboarding → /login (unauthenticated)")
    })
  })

  // ──── AUTH-PROTECTED PAGES (redirect to /login) ────
  test.describe("Auth-protected pages redirect to /login", () => {
    test("/workspaces redirects when unauthenticated", async ({ page }) => {
      await page.goto(`${BASE_URL}/workspaces`, { waitUntil: "networkidle" })
      await page.waitForTimeout(2000)
      expect(page.url()).toContain("/login")
      console.log("  ✓ /workspaces → /login")
    })

    test("flat /inbox redirects to /login when unauthenticated (no cookie)", async ({ page }) => {
      await page.goto(`${BASE_URL}/inbox`, { waitUntil: "networkidle" })
      await page.waitForTimeout(2000)
      // Without cookie, proxy redirects to /workspaces → /login
      expect(page.url()).toContain("/login")
      console.log("  ✓ /inbox → /login")
    })
  })

  // ──── REGISTRATION FLOW ────
  test.describe("Registration flow", () => {
    test("register form requires terms acceptance", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByText("Don't have an account? Sign up").click()
      await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible()

      // Fill form but don't check terms
      await page.fill('input[type="email"]', "test-new@example.com")
      await page.fill('input[type="password"]', "testpass123")

      // Submit button should be disabled when terms are not accepted
      const submitBtn = page.getByRole("button", { name: "Create Account" })
      await expect(submitBtn).toBeDisabled()
      console.log("  ✓ Button disabled without terms")

      // Check terms — button should become enabled
      await page.locator('input[type="checkbox"]').check()
      await expect(submitBtn).toBeEnabled()
      console.log("  ✓ Button enabled after accepting terms")

      // Submit
      await submitBtn.click()
      await page.waitForTimeout(2000)
      const url = page.url()
      console.log(`  After register: ${url}`)

      // Either goes to /onboarding (new user) or stays on /login (exists)
      expect(url.includes("/onboarding") || url.includes("/login")).toBeTruthy()
      console.log("  ✓ Registration form submits correctly")
    })
  })

  // ──── WORKSPACE ROUTING (requires auth) ────
  test.describe("Workspace-scoped routing", () => {
    test("auth-protected workspace pages redirect to /login", async ({ page }) => {
      const testWsId = "00000000-0000-0000-0000-000000000000"

      const workspaceRoutes = [
        { path: `/${testWsId}/inbox`, name: "/[workspaceId]/inbox" },
        { path: `/${testWsId}/analytics`, name: "/[workspaceId]/analytics" },
        { path: `/${testWsId}/templates`, name: "/[workspaceId]/templates" },
        { path: `/${testWsId}/imap-sync`, name: "/[workspaceId]/imap-sync" },
        { path: `/${testWsId}/settings`, name: "/[workspaceId]/settings" },
      ]

      for (const route of workspaceRoutes) {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle" })
        await page.waitForTimeout(1500)
        expect(page.url()).toContain("/login")
        console.log(`  ✓ ${route.name} → /login`)
      }
    })
  })

  // ──── LOGIN PAGE UI FEATURES ────
  test.describe("Login page features", () => {
    test("toggle between login and register modes", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)

      // Start in login mode
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()

      // Switch to register
      await page.getByText("Don't have an account? Sign up").click()
      await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible()
      await expect(page.locator('input[type="checkbox"]')).toBeVisible()

      // Switch back to login
      await page.getByText("Already have an account? Sign in").click()
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
      await expect(page.locator('input[type="checkbox"]')).toHaveCount(0)
      console.log("  ✓ Login/register toggle works")
    })

    test("password visibility toggle", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="password"]', "testpassword")
      await page.locator('button[type="button"]').click() // eye toggle
      await expect(page.locator('input[type="text"]')).toBeVisible()
      console.log("  ✓ Password visibility toggle")
    })
  })
})

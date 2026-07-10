import { test, expect } from "@playwright/test"

export { }

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

test.describe("MailForge Login Flow Tests", () => {
  test.describe("Login form validation", () => {
    test("empty fields show browser validation on submit", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)

      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      const signInBtn = page.getByRole("button", { name: "Sign In" })

      await emailInput.fill("")
      await passwordInput.fill("")
      await signInBtn.click()

      await expect(page).toHaveURL(/\/login/)
      console.log("  ✓ Empty fields prevent form submission")
    })

    test("invalid email format shows validation error", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)

      await page.fill('input[type="email"]', "not-a-valid-email")
      await page.fill('input[type="password"]', "somepassword")
      await page.getByRole("button", { name: "Sign In" }).click()

      await expect(page).toHaveURL(/\/login/)
      console.log("  ✓ Invalid email format prevents submission")
    })
  })

  test.describe("Password visibility", () => {
    test("password field has visibility toggle", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="password"]', "testpassword")
      await page.locator('button[type="button"]').click()
      await expect(page.locator('input[type="text"]')).toBeVisible()
      console.log("  ✓ Password visibility toggle works")
    })
  })

  test.describe("Mode switching", () => {
    test("toggle between login and register modes", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)

      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()

      await page.getByText("Don't have an account? Sign up").click()
      await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible()
      await expect(page.locator('input[type="checkbox"]')).toBeVisible()

      await page.getByText("Already have an account? Sign in").click()
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
      await expect(page.locator('input[type="checkbox"]')).toHaveCount(0)
      console.log("  ✓ Login/register toggle works")
    })
  })

  test.describe("Forgot password link", () => {
    test("forgot password link navigates to /forgot-password", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)

      const forgotLink = page.locator('a[href="/forgot-password"]')
      await expect(forgotLink).toBeVisible()
      await expect(forgotLink).toHaveText("Forgot password?")

      await forgotLink.click()
      await page.waitForTimeout(1000)
      expect(page.url()).toContain("/forgot-password")
      await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible()
      console.log("  ✓ Forgot password link → /forgot-password")
    })
  })

  test.describe("Registration form", () => {
    test("terms checkbox enables submit button", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByText("Don't have an account? Sign up").click()
      await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible()

      await page.fill('input[type="email"]', "test-register@example.com")
      await page.fill('input[type="password"]', "testpass123")

      const submitBtn = page.getByRole("button", { name: "Create Account" })
      await expect(submitBtn).toBeDisabled()
      console.log("  ✓ Submit disabled without terms")

      await page.locator('input[type="checkbox"]').check()
      await expect(submitBtn).toBeEnabled()
      console.log("  ✓ Submit enabled after terms accepted")
    })

    test("passwords shorter than 6 chars show error message", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByText("Don't have an account? Sign up").click()

      await page.fill('input[type="email"]', "short-pass@example.com")
      await page.fill('input[type="password"]', "abc")
      await page.locator('input[type="checkbox"]').check()
      await page.getByRole("button", { name: "Create Account" }).click()

      await page.waitForTimeout(2000)
      const errorEl = page.locator(".bg-red-50")
      await expect(errorEl).toBeVisible()
      console.log("  ✓ Short password triggers error message")
    })
  })
})

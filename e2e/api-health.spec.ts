import { test, expect } from "@playwright/test"

export {}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

test.describe("Health API", () => {
  test("GET /api/health returns 200 with healthy status", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe("healthy")
    expect(body.timestamp).toBeTruthy()
    expect(typeof body.uptime).toBe("number")
  })
})

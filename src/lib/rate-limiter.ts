import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface TierConfig {
  requestsPerMinute: number
  emailsPerHour: number
  emailsPerDay: number
}

interface WindowEntry {
  timestamps: number[]
  limit: number
  windowMs: number
}

const DEFAULT_FREE_TIER: TierConfig = {
  requestsPerMinute: 60,
  emailsPerHour: 100,
  emailsPerDay: 1000,
}

const store = new Map<string, WindowEntry>()

function getWindowMs(type: "api" | "email"): number {
  return type === "api" ? 60_000 : 3_600_000
}

function getLimit(config: TierConfig, type: "api" | "email"): number {
  return type === "api" ? config.requestsPerMinute : config.emailsPerHour
}

function slidingWindow(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.limit !== limit || entry.windowMs !== windowMs) {
    entry = { timestamps: [], limit, windowMs }
    store.set(key, entry)
  }

  const cutoff = now - entry.windowMs
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  const resetAt = Math.ceil((Math.floor(now / entry.windowMs) * entry.windowMs + entry.windowMs) / 1000) * 1000

  if (entry.timestamps.length >= entry.limit) {
    return { allowed: false, remaining: 0, resetAt }
  }

  entry.timestamps.push(now)
  return { allowed: true, remaining: entry.limit - entry.timestamps.length, resetAt }
}

export async function checkRateLimit(
  workspaceId: string,
  type: "api" | "email"
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${workspaceId}:${type}`
  const windowMs = getWindowMs(type)

  try {
    const supabase = await createClient()
    const { data: tier } = await supabase
      .from("rate_limit_tiers")
      .select("requests_per_minute, emails_per_hour, emails_per_day")
      .eq("workspace_id", workspaceId)
      .maybeSingle()

    const config: TierConfig = tier
      ? {
          requestsPerMinute: tier.requests_per_minute ?? DEFAULT_FREE_TIER.requestsPerMinute,
          emailsPerHour: tier.emails_per_hour ?? DEFAULT_FREE_TIER.emailsPerHour,
          emailsPerDay: tier.emails_per_day ?? DEFAULT_FREE_TIER.emailsPerDay,
        }
      : DEFAULT_FREE_TIER

    const limit = getLimit(config, type)
    return slidingWindow(key, limit, windowMs)
  } catch {
    const limit = getLimit(DEFAULT_FREE_TIER, type)
    return slidingWindow(key, limit, windowMs)
  }
}

export function withRateLimit(
  handler: (req: Request, ...args: unknown[]) => Promise<Response>,
  type: "api" | "email"
) {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    const url = new URL(req.url)
    const segments = url.pathname.split("/").filter(Boolean)
    const workspaceId = segments[1]

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    const result = await checkRateLimit(workspaceId, type)

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining: result.remaining },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetAt),
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

    const response = await handler(req, ...args)

    if (response instanceof NextResponse || response instanceof Response) {
      response.headers.set("X-RateLimit-Remaining", String(result.remaining))
      response.headers.set("X-RateLimit-Reset", String(result.resetAt))
    }

    return response
  }
}

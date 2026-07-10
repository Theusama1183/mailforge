import { createAdminClient } from "@/lib/supabase/admin"

export interface RateLimitConfig {
  interval: number
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
  remaining: number
  resetTime: number
}

async function getDbStore() {
  return createAdminClient()
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = new Date(now - config.interval).toISOString()

  try {
    const supabase = await getDbStore()

    // Clean up old entries first (occasionally)
    if (Math.random() < 0.01) { // 1% chance to cleanup on each request
      await supabase
        .from("rate_limits")
        .delete()
        .lt("created_at", new Date(now - 24 * 60 * 60 * 1000).toISOString())
    }

    const { count, error } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart)

    if (error) {
      // If rate limiting fails, allow the request but log the error
      console.error("Rate limiting error:", error)
      return { allowed: true, retryAfter: 0, remaining: config.maxRequests, resetTime: now + config.interval }
    }

    const currentCount = count || 0
    const remaining = Math.max(0, config.maxRequests - currentCount)

    if (currentCount >= config.maxRequests) {
      // Find the oldest request in the current window to calculate retry time
      const { data: oldest } = await supabase
        .from("rate_limits")
        .select("created_at")
        .eq("key", key)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      const retryAfter = oldest
        ? Math.ceil((new Date(oldest.created_at).getTime() + config.interval - now) / 1000)
        : Math.ceil(config.interval / 1000)

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
        resetTime: now + (retryAfter * 1000),
      }
    }

    // Record this request
    await supabase.from("rate_limits").insert({
      key,
      created_at: new Date().toISOString(),
    })

    return {
      allowed: true,
      retryAfter: 0,
      remaining: remaining - 1,
      resetTime: now + config.interval,
    }
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error("Rate limiting error:", error)
    return { allowed: true, retryAfter: 0, remaining: config.maxRequests, resetTime: now + config.interval }
  }
}

/**
 * Manually cleanup old rate limit records
 * Should be called periodically by a background job
 */
export async function cleanupRateLimits(): Promise<void> {
  try {
    const supabase = await getDbStore()
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { error } = await supabase
      .from("rate_limits")
      .delete()
      .lt("created_at", cutoff)

    if (error) {
      console.error("Rate limit cleanup error:", error)
    }
  } catch (error) {
    console.error("Rate limit cleanup error:", error)
  }
}

export const RATE_LIMITS = {
  emails: { interval: 10_000, maxRequests: 30 },
  bulk: { interval: 10_000, maxRequests: 10 },
  send: { interval: 60_000, maxRequests: 5 },
  auth: { interval: 60_000, maxRequests: 10 },
  api_keys: { interval: 300_000, maxRequests: 5 }, // 5 per 5 minutes
  upload: { interval: 60_000, maxRequests: 20 },
} as const satisfies Record<string, RateLimitConfig>

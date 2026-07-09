import { createAdminClient } from "@/lib/supabase/admin"

export interface RateLimitConfig {
  interval: number
  maxRequests: number
}

async function getDbStore() {
  return createAdminClient()
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter: number }> {
  const now = Date.now()
  const windowStart = new Date(now - config.interval).toISOString()

  try {
    const supabase = await getDbStore()

    const { count, error } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart)

    if (error) {
      return { allowed: true, retryAfter: 0 }
    }

    if (count !== null && count >= config.maxRequests) {
      const { data: oldest } = await supabase
        .from("rate_limits")
        .select("created_at")
        .eq("key", key)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      if (oldest) {
        const retryAfter = Math.ceil((new Date(oldest.created_at).getTime() + config.interval - now) / 1000)
        return { allowed: false, retryAfter: Math.max(1, retryAfter) }
      }
      return { allowed: false, retryAfter: Math.ceil(config.interval / 1000) }
    }

    await supabase.from("rate_limits").insert({
      key,
      created_at: new Date().toISOString(),
    })

    return { allowed: true, retryAfter: 0 }
  } catch {
    return { allowed: true, retryAfter: 0 }
  }
}

export const RATE_LIMITS = {
  emails: { interval: 10_000, maxRequests: 30 },
  bulk: { interval: 10_000, maxRequests: 10 },
  send: { interval: 60_000, maxRequests: 5 },
  auth: { interval: 60_000, maxRequests: 10 },
} as const satisfies Record<string, RateLimitConfig>

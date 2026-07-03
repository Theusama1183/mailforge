export interface RateLimitConfig {
  interval: number
  maxRequests: number
}

const stores = new Map<string, { timestamps: number[] }>()

function getStore(key: string) {
  let store = stores.get(key)
  if (!store) {
    store = { timestamps: [] }
    stores.set(key, store)
  }
  return store
}

function cleanup() {
  const now = Date.now()
  for (const [key, store] of stores) {
    store.timestamps = store.timestamps.filter((t) => now - t < 60_000)
    if (store.timestamps.length === 0) stores.delete(key)
  }
}

setInterval(cleanup, 60_000)

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const store = getStore(key)
  store.timestamps = store.timestamps.filter((t) => now - t < config.interval)

  if (store.timestamps.length >= config.maxRequests) {
    const oldest = store.timestamps[0]
    const retryAfter = Math.ceil((oldest + config.interval - now) / 1000)
    return { allowed: false, retryAfter }
  }

  store.timestamps.push(now)
  return { allowed: true, retryAfter: 0 }
}

export const RATE_LIMITS = {
  emails: { interval: 10_000, maxRequests: 30 },
  bulk: { interval: 10_000, maxRequests: 10 },
  send: { interval: 60_000, maxRequests: 5 },
  auth: { interval: 60_000, maxRequests: 10 },
} as const satisfies Record<string, RateLimitConfig>

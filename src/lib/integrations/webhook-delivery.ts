import { createAdminClient } from "@/lib/supabase/admin"

interface WebhookPayload {
  event: string
  workspace_id: string
  data: Record<string, unknown>
  timestamp: string
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

export async function deliverWebhook(
  workspaceId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient()

  const { data: configs } = await supabase
    .from("webhook_configs")
    .select("id, url, secret, events")
    .eq("workspace_id", workspaceId)
    .eq("active", true)

  if (!configs?.length) return

  const webhookPayload: WebhookPayload = {
    event: eventType,
    workspace_id: workspaceId,
    data: payload,
    timestamp: new Date().toISOString(),
  }

  for (const config of configs) {
    if (config.events && !config.events.includes(eventType) && !config.events.includes("*")) continue

    const { error: insertError } = await supabase.from("webhook_events").insert({
      workspace_id: workspaceId,
      event_type: eventType,
      payload: webhookPayload,
      target_url: config.url,
      status: "pending",
    })

    if (insertError) {
      console.error("Failed to log webhook event:", insertError)
      continue
    }

    sendWithRetry(config.url, config.secret, webhookPayload)
      .then((success) => {
        supabase.from("webhook_events").update({
          status: success ? "delivered" : "failed",
          delivered_at: success ? new Date().toISOString() : null,
          failed_at: success ? null : new Date().toISOString(),
        }).eq("target_url", config.url).eq("payload", webhookPayload as never).eq("status", "pending")
      })
      .catch(() => {})
  }
}

async function sendWithRetry(
  url: string,
  secret: string | null,
  payload: WebhookPayload,
  attempt = 1
): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (secret) {
      const signature = await createSignature(JSON.stringify(payload), secret)
      headers["X-Webhook-Signature"] = signature
    }

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
    if (res.ok) return true

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
      return sendWithRetry(url, secret, payload, attempt + 1)
    }

    return false
  } catch {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
      return sendWithRetry(url, secret, payload, attempt + 1)
    }
    return false
  }
}

async function createSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

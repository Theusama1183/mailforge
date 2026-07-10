import { createAdminClient } from "@/lib/supabase/admin"

type DeliveryEventType = "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained"

interface DeliveryEvent {
  email_id: string
  workspace_id: string
  event_type: DeliveryEventType
  metadata?: Record<string, unknown>
}

export async function trackDeliveryEvent(event: DeliveryEvent): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("email_events").insert({
      email_id: event.email_id,
      workspace_id: event.workspace_id,
      event_type: event.event_type,
      metadata: event.metadata,
    })
  } catch {
    // fire-and-forget: silently ignore errors
  }
}

export async function trackBounce(emailId: string, workspaceId: string, reason: string): Promise<void> {
  await trackDeliveryEvent({
    email_id: emailId,
    workspace_id: workspaceId,
    event_type: "bounced",
    metadata: { reason },
  })
}

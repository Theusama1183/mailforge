export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Domain {
  id: string
  user_id: string
  domain: string
  mailgun_api_key: string | null
  mailgun_domain: string | null
  cloudflare_token: string | null
  dns_configured: boolean
  created_at: string
}

export interface EmailAddress {
  id: string
  domain_id: string
  local_part: string
  full_address: string
  name: string | null
  created_at: string
}

export interface Email {
  id: string
  mailbox_address: string
  from_address: string
  from_name: string | null
  to_addresses: string[]
  cc_addresses: string[] | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  attachments: Attachment[]
  direction: "inbound" | "outbound"
  message_id: string | null
  in_reply_to: string | null
  references: string[]
  read: boolean
  starred: boolean
  folder: FolderType
  created_at: string
  delivery_status?: "queued" | "sending" | "sent" | "delivered" | "failed" | "bounced"
  delivery_error?: string | null
  delivered_at?: string | null
  is_draft?: boolean
  scheduled_for?: string | null
  pinned?: boolean
  snoozed_until?: string | null
  labels?: { id: string; name: string; color: string }[]
}

export interface Attachment {
  filename: string
  content_type: string
  size: number
  url?: string
}

export type FolderType = "inbox" | "sent" | "drafts" | "trash" | "spam" | "starred" | "archive"

export interface Contact {
  id: string
  user_id: string
  email: string
  name: string | null
  notes: string | null
  company: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ContactGroup {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

// Analytics types
export interface EmailEvent {
  id: string
  email_id: string
  event_type: "open" | "click" | "bounce" | "unsubscribe" | "spam_report"
  link_url?: string | null
  user_agent?: string | null
  ip_address?: string | null
  country?: string | null
  device_type?: "mobile" | "desktop" | "tablet" | null
  email_client?: string | null
  bounce_type?: "hard" | "soft" | null
  created_at: string
}

export interface AnalyticsSummary {
  total_emails: number
  inbound: number
  outbound: number
  total_opens: number
  total_clicks: number
  total_bounces: number
  total_unsubscribes: number
  open_rate: number
  click_rate: number
  bounce_rate: number
  unique_opens: number
  unique_clicks: number
}

export interface TimeSeriesPoint {
  date: string
  sent: number
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
}

export interface DeviceBreakdown {
  device_type: string
  count: number
  percentage: number
}

export interface ClientBreakdown {
  email_client: string
  count: number
  percentage: number
}

export interface HourlyHeatmap {
  hour: number
  day_of_week: number
  opens: number
  clicks: number
}

export interface PerEmailAnalytics {
  email_id: string
  subject: string | null
  to_addresses: string[]
  sent_at: string
  opens: number
  clicks: number
  unique_opens: number
  unique_clicks: number
  bounces: number
  open_rate: number
  click_rate: number
}

export interface Campaign {
  id: string
  workspace_id: string
  user_id: string
  name: string
  subject: string | null
  status: "draft" | "sending" | "sent" | "cancelled"
  total_sent: number
  total_opens: number
  total_clicks: number
  total_bounces: number
  total_unsubscribes: number
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface ABTest {
  id: string
  workspace_id: string
  user_id: string
  name: string
  status: "draft" | "running" | "completed"
  winning_variant_id: string | null
  created_at: string
  updated_at: string
  variants?: ABTestVariant[]
}

export interface ABTestVariant {
  id: string
  ab_test_id: string
  label: "A" | "B"
  subject: string
  body_html: string | null
  body_text: string | null
  sent_count: number
  open_count: number
  click_count: number
  created_at: string
}

export interface AnalyticsFilters {
  start_date?: string
  end_date?: string
  campaign_id?: string
  direction?: "inbound" | "outbound"
}

export interface UserProfile {
  id: string
  user_id: string
  avatar_url: string | null
  timezone: string
  language: string
  created_at: string
  updated_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  event_type: string
  email_enabled: boolean
  in_app_enabled: boolean
  created_at: string
}

export interface VacationAutoreply {
  id: string
  user_id: string
  email_address_id: string | null
  subject: string
  body: string
  enabled: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface ForwardingRule {
  id: string
  user_id: string
  email_address_id: string | null
  destination: string
  enabled: boolean
  keep_copy: boolean
  created_at: string
  updated_at: string
}

export interface BlockedSender {
  id: string
  user_id: string
  pattern: string
  pattern_type: "email" | "domain"
  reason: string | null
  created_at: string
}

export interface TrustedSender {
  id: string
  user_id: string
  pattern: string
  pattern_type: "email" | "domain"
  created_at: string
}

export interface AuditLog {
  id: string
  workspace_id: string
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  workspace_id: string | null
  action: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type SettingsTab = "profile" | "security" | "notifications" | "vacation" | "forwarding" | "blocks" | "domains" | "signatures" | "billing" | "team"

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
  read: boolean
  starred: boolean
  folder: FolderType
  created_at: string
}

export interface Attachment {
  filename: string
  content_type: string
  size: number
  url?: string
}

export type FolderType = "inbox" | "sent" | "drafts" | "trash" | "spam" | "starred" | "archive"

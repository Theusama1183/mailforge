import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"

export interface ImapConfig {
  host: string
  port: number
  username: string
  password: string
  useTls: boolean
}

export async function testImapConnection(config: ImapConfig) {
  try {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.useTls,
      auth: { user: config.username, pass: config.password },
      logger: false,
    })
    await client.connect()
    await client.logout()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function listMailboxes(config: ImapConfig) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.useTls,
    auth: { user: config.username, pass: config.password },
    logger: false,
  })
  try {
    await client.connect()
    const mailboxes = await client.list()
    await client.logout()
    return mailboxes.map(m => ({ path: m.path, name: m.name, specialUse: m.specialUse || null }))
  } catch (error) {
    await client.logout().catch(() => {})
    throw error
  }
}

export async function syncMailbox(config: ImapConfig, mailbox: string, sinceUid: number = 0) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.useTls,
    auth: { user: config.username, pass: config.password },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock(mailbox)
    try {
      const fetchRange = sinceUid > 0 ? `${sinceUid + 1}:*` : "1:*"
      const messages: any[] = []

      for await (const msg of client.fetch(fetchRange, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        internalDate: true,
        size: true,
        flags: true,
        source: true,
      })) {
        const parsed = await simpleParser(msg.source!)
        const formatAddresses = (addr: any) =>
          addr ? (Array.isArray(addr) ? addr.map((a: any) => a.text).filter(Boolean).join(", ") : addr.text) : ""
        messages.push({
          uid: msg.uid,
          messageId: parsed.messageId || "",
          inReplyTo: parsed.inReplyTo || "",
          references: parsed.references || "",
          from: formatAddresses(parsed.from),
          to: formatAddresses(parsed.to),
          cc: formatAddresses(parsed.cc),
          subject: parsed.subject || "",
          bodyHtml: typeof parsed.html === "string" ? parsed.html : "",
          bodyText: parsed.text || "",
          date: parsed.date || msg.internalDate,
          flags: msg.flags || [],
          size: msg.size,
        })
      }

      return {
        messages,
        highestUid: messages.length > 0 ? Math.max(...messages.map(m => m.uid)) : sinceUid,
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout().catch(() => {})
  }
}

const GMAIL_FOLDER_MAP: Record<string, string> = {
  "[Gmail]/Sent Mail": "SENT",
  "[Gmail]/Drafts": "DRAFTS",
  "[Gmail]/Spam": "SPAM",
  "[Gmail]/Trash": "TRASH",
  "[Gmail]/All Mail": "ALL",
  "[Gmail]/Starred": "STARRED",
  "[Gmail]/Important": "IMPORTANT",
}

export function mapFolder(mailboxName: string): string {
  return GMAIL_FOLDER_MAP[mailboxName] || mailboxName.toUpperCase()
}

export const DEFAULT_MAILBOXES = ["INBOX", "SENT", "DRAFTS", "TRASH", "SPAM"]

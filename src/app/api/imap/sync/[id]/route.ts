import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncMailbox, listMailboxes, mapFolder, DEFAULT_MAILBOXES } from "@/lib/imap"
import CryptoJS from "crypto-js"

function getEncryptionKey(): string {
  const key = process.env.IMAP_ENCRYPTION_KEY
  if (!key) {
    throw new Error("IMAP_ENCRYPTION_KEY environment variable is required for IMAP account encryption")
  }
  return key
}

function decrypt(encrypted: string): string {
  return CryptoJS.AES.decrypt(encrypted, getEncryptionKey()).toString(CryptoJS.enc.Utf8)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: account } = await supabase
      .from("imap_accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!account) return NextResponse.json({ error: "IMAP account not found" }, { status: 404 })

    const config = {
      host: account.host,
      port: account.port,
      username: account.username,
      password: decrypt(account.password_encrypted),
      useTls: account.use_tls,
    }

    const mailboxes = await listMailboxes(config)
    const adminDb = createAdminClient()
    let totalSynced = 0

    for (const mb of mailboxes) {
      const folder = mapFolder(mb.name)
      if (!DEFAULT_MAILBOXES.includes(folder) && !folder.startsWith("INBOX")) continue

      const { data: syncState } = await adminDb
        .from("imap_sync_state")
        .select("last_uid")
        .eq("account_id", id)
        .eq("mailbox_name", mb.path)
        .maybeSingle()

      const sinceUid = syncState?.last_uid || 0
      const result = await syncMailbox(config, mb.path, sinceUid)

      if (result.messages.length === 0) continue

      const direction = folder === "SENT" ? "outbound" : "inbound"
      const emailRows = result.messages.map(msg => ({
        user_id: user.id,
        mailbox_address: account.username,
        from_address: msg.from,
        to_addresses: msg.to.split(",").map((s: string) => s.trim()),
        cc_addresses: msg.cc ? msg.cc.split(",").map((s: string) => s.trim()) : [],
        subject: msg.subject,
        body_html: msg.bodyHtml || null,
        body_text: msg.bodyText || null,
        direction,
        folder: folder.toLowerCase(),
        message_id: msg.messageId || null,
        in_reply_to: msg.inReplyTo || null,
        references: msg.references || null,
        created_at: msg.date || new Date().toISOString(),
      }))

      const { error: insertError } = await adminDb.from("emails").insert(emailRows)
      if (insertError) {
        console.error(`Failed to insert emails for ${mb.path}:`, insertError)
        continue
      }

      await adminDb.from("imap_sync_state").upsert({
        account_id: id,
        mailbox_name: mb.path,
        last_uid: result.highestUid,
        last_sync_at: new Date().toISOString(),
      }, { onConflict: "account_id,mailbox_name" })

      totalSynced += result.messages.length
    }

    await supabase.from("imap_accounts").update({ updated_at: new Date().toISOString() }).eq("id", id)

    return NextResponse.json({ success: true, synced: totalSynced })
  } catch (error) {
    console.error("IMAP sync error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    )
  }
}

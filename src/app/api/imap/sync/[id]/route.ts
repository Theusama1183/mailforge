import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { testImapConnection, listMailboxes, syncMailbox } from "@/lib/imap"
import crypto from "crypto"

const DEFAULT_FOLDER_MAP: Record<string, string> = {
  "INBOX": "inbox",
  "SENT": "sent",
  "DRAFTS": "drafts",
  "TRASH": "trash",
  "SPAM": "spam",
  "[Gmail]/Sent Mail": "sent",
  "[Gmail]/Drafts": "drafts",
  "[Gmail]/Trash": "trash",
  "[Gmail]/Spam": "spam",
  "[Gmail]/Starred": "starred",
  "[Gmail]/All Mail": "archive",
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { data: account } = await supabase
      .from("imap_accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

    let password = ""
    try {
      const key = process.env.IMAP_ENCRYPTION_KEY
      if (!key) return NextResponse.json({ error: "IMAP_ENCRYPTION_KEY not configured" }, { status: 500 })
      const parts = account.password_encrypted.split(":")
      if (parts.length !== 2) return NextResponse.json({ error: "Invalid encrypted password format" }, { status: 500 })
      const aesKey = crypto.createHash("sha256").update(key).digest()
      const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, Buffer.from(parts[0], "hex"))
      password = decipher.update(parts[1], "hex", "utf8") + decipher.final("utf8")
    } catch {
      return NextResponse.json({ error: "Failed to decrypt password" }, { status: 500 })
    }

    const { data: log } = await supabase.from("imap_sync_logs").insert({
      account_id: id,
      status: "running",
    }).select().single()

    const config = {
      host: account.host,
      port: account.port,
      username: account.username,
      password,
      useTls: account.use_tls,
    }

    try {
      // Test connection
      const testResult = await testImapConnection(config)
      if (!testResult.ok) throw new Error(testResult.error || "Connection failed")

      // List mailboxes
      const mailboxes = await listMailboxes(config)

      // Get user's folder mappings
      const { data: mappings } = await supabase
        .from("imap_folder_mappings")
        .select("*")
        .eq("account_id", id)
        .eq("enabled", true)

      const mapLookup: Record<string, string> = {}
      if (mappings?.length) {
        for (const m of mappings) {
          mapLookup[m.remote_folder] = m.local_folder
        }
      }

      let totalSynced = 0
      for (const mailbox of mailboxes) {
        const mailboxName = typeof mailbox === "string" ? mailbox : mailbox.path
        const localFolder = mapLookup[mailboxName] || DEFAULT_FOLDER_MAP[mailboxName]
        if (!localFolder) continue

        const { data: state } = await supabase
          .from("imap_sync_state")
          .select("last_uid")
          .eq("account_id", id)
          .eq("mailbox_name", mailboxName)
          .maybeSingle()

        const sinceUid = state?.last_uid || 1
        const result = await syncMailbox(config, mailboxName, sinceUid)

        if (result.messages.length > 0) {
          if (result.highestUid > (state?.last_uid || 0)) {
            await supabase.from("imap_sync_state").upsert({
              account_id: id,
              mailbox_name: mailboxName,
              last_uid: result.highestUid,
              last_sync_at: new Date().toISOString(),
            }, { onConflict: "account_id, mailbox_name" })
          }
          totalSynced += result.messages.length
        }
      }

      await supabase.from("imap_sync_logs").update({
        status: "completed",
        messages_synced: totalSynced,
        completed_at: new Date().toISOString(),
      }).eq("id", log!.id)

      return NextResponse.json({ synced: totalSynced })
    } catch (err) {
      await supabase.from("imap_sync_logs").update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("id", log!.id)

      return NextResponse.json({
        error: err instanceof Error ? err.message : "Sync failed",
        synced: 0,
      })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 })
  }
}

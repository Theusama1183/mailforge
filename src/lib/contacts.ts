import type { SupabaseClient } from "@supabase/supabase-js"

function parseAddressList(raw: string | string[] | undefined | null): { email: string; name: string | null }[] {
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : [raw]
  const result: { email: string; name: string | null }[] = []
  for (const item of list) {
    if (!item) continue
    const parts = item.split(",")
    for (const p of parts) {
      const trimmed = p.trim()
      if (!trimmed) continue
      const match = trimmed.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/)
      if (match) {
        result.push({ name: match[1]?.trim() || null, email: match[2].toLowerCase().trim() })
      } else if (trimmed.includes("@")) {
        result.push({ name: null, email: trimmed.toLowerCase() })
      }
    }
  }
  return result
}

export async function autoSaveContacts(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  addresses: (string | string[] | undefined | null)[],
) {
  const contacts: { email: string; name: string | null }[] = []
  for (const addr of addresses) {
    contacts.push(...parseAddressList(addr))
  }

  const unique = new Map<string, string | null>()
  for (const c of contacts) {
    if (c.email && !unique.has(c.email)) {
      unique.set(c.email, c.name)
    }
  }

  if (unique.size === 0) return

  const rows = Array.from(unique.entries()).map(([email, name]) => ({
    user_id: userId,
    workspace_id: workspaceId,
    email,
    name: name || null,
  }))

  const { error } = await supabase.from("contacts").upsert(rows, {
    onConflict: "user_id,workspace_id,email",
    ignoreDuplicates: true,
  })

  if (error) {
    console.error("Failed to auto-save contacts:", error)
  }
}

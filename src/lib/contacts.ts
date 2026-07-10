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

/**
 * Optimized contact auto-saving that avoids N+1 queries
 * Uses single upsert operation with proper conflict handling
 */
export async function autoSaveContacts(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  addresses: (string | string[] | undefined | null)[],
): Promise<void> {
  const contacts: { email: string; name: string | null }[] = []
  
  // Parse all addresses
  for (const addr of addresses) {
    contacts.push(...parseAddressList(addr))
  }

  // Deduplicate contacts by email, keeping the first name found
  const unique = new Map<string, string | null>()
  for (const c of contacts) {
    if (c.email && !unique.has(c.email)) {
      unique.set(c.email, c.name)
    }
  }

  if (unique.size === 0) return

  // Prepare rows for upsert
  const rows = Array.from(unique.entries()).map(([email, name]) => ({
    user_id: userId,
    workspace_id: workspaceId,
    email,
    name: name || null,
    updated_at: new Date().toISOString(),
  }))

  try {
    // Single upsert operation - no N+1 queries
    // This will insert new contacts or update existing ones
    const { error } = await supabase.from("contacts").upsert(rows, {
      onConflict: "user_id,workspace_id,email",
      ignoreDuplicates: false, // Update existing contacts with new names if provided
    })

    if (error) {
      console.error("Failed to auto-save contacts:", error)
      // Don't throw here - contact saving should not break email sending
    }
  } catch (error) {
    console.error("Failed to auto-save contacts:", error)
    // Don't throw here - contact saving should not break email sending
  }
}

/**
 * Batch contact creation/update to avoid N+1 queries
 * Used when importing large contact lists
 */
export async function batchUpsertContacts(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  contacts: Array<{ email: string; name?: string; [key: string]: any }>,
  batchSize = 100
): Promise<{ success: number; errors: number }> {
  let successCount = 0
  let errorCount = 0

  // Process contacts in batches to avoid hitting database limits
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize)
    
    const rows = batch.map(contact => ({
      user_id: userId,
      workspace_id: workspaceId,
      email: contact.email.toLowerCase().trim(),
      name: contact.name || null,
      updated_at: new Date().toISOString(),
    }))

    try {
      const { error } = await supabase.from("contacts").upsert(rows, {
        onConflict: "user_id,workspace_id,email",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error(`Batch contact upsert error (batch ${Math.floor(i / batchSize) + 1}):`, error)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }
    } catch (error) {
      console.error(`Batch contact upsert error (batch ${Math.floor(i / batchSize) + 1}):`, error)
      errorCount += batch.length
    }
  }

  return { success: successCount, errors: errorCount }
}

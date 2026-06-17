"use client"

import { useMemo, useRef } from "react"
import Fuse from "fuse.js"
import type { Email } from "@/types"

const FUSE_OPTIONS = {
  keys: ["subject", "from_address", "from_name", "body_text", "body_html", "mailbox_address"],
  threshold: 0.4,
}

/**
 * Client-side fuzzy search across email fields using Fuse.js.
 * Returns the filtered array of emails, or null when no search is active.
 */
export function useEmailSearch(emails: Email[], query: string): Email[] | null {
  const fuseRef = useRef<Fuse<Email> | null>(null)

  return useMemo(() => {
    if (!query.trim()) return null

    if (!fuseRef.current) {
      fuseRef.current = new Fuse<Email>([], FUSE_OPTIONS)
    }
    fuseRef.current.setCollection(emails)
    return fuseRef.current.search(query).map((r) => r.item)
  }, [emails, query])
}

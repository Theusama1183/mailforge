"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { InboxList } from "@/components/inbox/inbox-list"
import { InboxToolbar } from "@/components/inbox/inbox-toolbar"
import type { SelectType } from "@/components/inbox/inbox-toolbar"
import { ComposeDialog } from "@/components/compose/compose-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Mail, Search as SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { useEmailSearch } from "@/hooks/use-email-search"
import { useRealtimeEmails } from "@/hooks/use-realtime-emails"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { decodeMimeSubject } from "@/lib/email-utils"
import type { Email } from "@/types"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  const [currentFolder, setCurrentFolder] = useState("inbox")
  const [emails, setEmails] = useState<Email[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState("all")
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 50
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [fromAddresses, setFromAddresses] = useState<{ local_part: string; domain: string; full: string }[]>([])
  const [workspaceId, setWorkspaceId] = useState<string>("")

  // Extract workspaceId from URL
  useEffect(() => {
    const path = window.location.pathname
    const segments = path.split("/").filter(Boolean)
    if (segments.length > 0) setWorkspaceId(segments[0])
  }, [])

  // Sync URL params with state
  useEffect(() => {
    const folder = searchParams.get("folder")
    const compose = searchParams.get("compose")
    setCurrentFolder(folder || "inbox")
    if (compose) setShowCompose(true)
  }, [searchParams])

  // Reset pagination on folder/address change
  useEffect(() => {
    setPage(0)
  }, [currentFolder, selectedAddress])

  // Data fetching via API (server-side pagination with rate limiting)
  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch from addresses via workspace API (works for members too)
      if (fromAddresses.length === 0 && workspaceId) {
        try {
          const res = await fetch(`/api/workspaces/${workspaceId}/emails`)
          if (res.ok) {
            const data = await res.json()
            setFromAddresses(
              (data || []).map((e: any) => ({
                local_part: e.local_part,
                domain: e.domains?.domain || "",
                full: `${e.local_part}@${e.domains?.domain || ""}`,
              }))
            )
          }
        } catch {}
      }

      const params = new URLSearchParams({
        folder: currentFolder,
        limit: String(pageSize),
        offset: String(page * pageSize),
      })
      if (selectedAddress !== "all") {
        params.set("address", selectedAddress)
      }

      const res = await fetch(`/api/emails?${params}`)

      if (res.status === 429) {
        toast.error("Too many requests. Please wait.")
        return
      }

      if (!res.ok) throw new Error("Failed to fetch")

      const data = await res.json()
      setEmails(data.emails || [])
      setTotalCount(data.count || 0)
    } catch (err) {
      console.error("Error fetching emails:", err)
    } finally {
      setLoading(false)
    }
  }, [currentFolder, selectedAddress, page, pageSize, fromAddresses.length, workspaceId])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  // Realtime subscription via extracted hook
  useRealtimeEmails(fetchEmails, true)

  // Thread grouping
  const normalizeSubject = (s: string) =>
    s?.replace(/^(Re|Fwd|Aw|Wg):\s*/i, "").trim().toLowerCase() || ""

  const threadGroups = useMemo(() => {
    const groups = new Map<string, Email[]>()
    for (const email of emails) {
      const key = email.in_reply_to || normalizeSubject(email.subject || "")
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(email)
    }
    return groups
  }, [emails])

  const threadedEmails = useMemo(
    () =>
      emails.filter((e) => {
        const key = e.in_reply_to || normalizeSubject(e.subject || "")
        const group = threadGroups.get(key)
        return group ? group[0] === e : true
      }),
    [emails, threadGroups]
  )

  const threadCounts = useMemo(
    () =>
      Object.fromEntries(
        Array.from(threadGroups.entries())
          .filter(([_, groupEmails]) => groupEmails.length > 1)
          .map(([key, groupEmails]) => {
            const e = groupEmails.find((em) => em.in_reply_to === key) || groupEmails[0]
            return [e.id, groupEmails.length]
          })
      ),
    [threadGroups]
  )

  // Client-side search via extracted hook
  const searchResults = useEmailSearch(emails, searchQuery)
  const displayEmails = searchResults ?? threadedEmails

  // Ctrl+F shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => ({
      c: () => {
        setShowCompose(true)
      },
      Escape: () => {
        setShowSearch(false)
        setSearchQuery("")
        setShowAddressDropdown(false)
      },
    }),
    []
  )

  useKeyboardShortcuts(shortcuts)

  // Action handlers
  const handleSend = async (data: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; fromAddress: string; attachments?: { filename: string; content: string }[]; inReplyTo?: string }) => {
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to send")
        return
      }
      const { id } = await res.json()

      setShowCompose(false)
      fetchEmails()

      toast("Message sent", {
        description: "Undo available",
        action: {
          label: "Undo",
          onClick: async () => {
            await fetch(`/api/send/cancel/${id}`, { method: "DELETE" })
            fetchEmails()
            toast("Message unsent")
          },
        },
      })
    } catch (err) {
      console.error("Error sending:", err)
      toast.error("Failed to send email")
    }
  }

  const handleStar = async (id: string, starred: boolean) => {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred } : e)))
    }
  }

  const handleSelect = async (id: string) => {
    const email = emails.find((e) => e.id === id)
    if (email && !email.read) {
      const res = await fetch(`/api/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      if (res.ok) {
        setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)))
      }
    }
    router.push(`/${workspaceId}/inbox/${id}`)
  }

  const handleArchive = async (id: string) => {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "archive" }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => e.id !== id))
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "trash" }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => e.id !== id))
    }
  }

  const handleToggleRead = async (id: string, wasRead: boolean) => {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !wasRead }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: !wasRead } : e)))
    }
  }

  // Selection state for toolbar
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectType = useCallback(
    (type: SelectType) => {
      setSelectedIds(() => {
        switch (type) {
          case "all":
            return new Set(displayEmails.map((e) => e.id))
          case "none":
            return new Set()
          case "read":
            return new Set(displayEmails.filter((e) => e.read).map((e) => e.id))
          case "unread":
            return new Set(displayEmails.filter((e) => !e.read).map((e) => e.id))
          case "starred":
            return new Set(displayEmails.filter((e) => e.starred).map((e) => e.id))
          case "unstarred":
            return new Set(displayEmails.filter((e) => !e.starred).map((e) => e.id))
          default:
            return new Set()
        }
      })
    },
    [displayEmails]
  )

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const res = await fetch("/api/emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, updates: { folder: "archive" } }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)))
      setSelectedIds(new Set())
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to archive")
    }
  }, [selectedIds])

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const res = await fetch("/api/emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)))
      setSelectedIds(new Set())
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to delete")
    }
  }, [selectedIds])

  const handleBulkToggleRead = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const hasUnread = ids.some((id) => {
      const email = emails.find((e) => e.id === id)
      return email && !email.read
    })
    const newRead = !hasUnread
    const res = await fetch("/api/emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, updates: { read: newRead } }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) =>
        prev.map((e) => (selectedIds.has(e.id) ? { ...e, read: newRead } : e))
      )
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to update")
    }
  }, [selectedIds, emails])

  const hasUnreadSelected = useMemo(
    () =>
      Array.from(selectedIds).some((id) => {
        const email = emails.find((e) => e.id === id)
        return email && !email.read
      }),
    [selectedIds, emails]
  )

  const handleRefresh = useCallback(() => {
    setPage(0)
    fetchEmails()
  }, [fetchEmails])

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setPage((p) => p + 1)
  }, [])

  const handleFolderChange = (folder: string) => {
    if (["settings", "analytics", "templates", "imap-sync", "workspaces"].includes(folder)) {
      const routeMap: Record<string, string> = {
        settings: `/${workspaceId}/settings`,
        analytics: `/${workspaceId}/analytics`,
        templates: `/${workspaceId}/templates`,
        "imap-sync": `/${workspaceId}/imap-sync`,
        workspaces: "/workspaces",
      }
      router.push(routeMap[folder])
      return
    }
    setCurrentFolder(folder)
    setPage(0)
    router.push(`/${workspaceId}/inbox?folder=${folder}`, { scroll: false })
  }

  const selectedLabel = selectedAddress === "all" ? "All Addresses" : selectedAddress

  return (
    <>
      <div id="main-content" />
      <PageHeader
        title={
          currentFolder === "inbox" ? "Inbox" :
          currentFolder === "sent" ? "Sent" :
          currentFolder === "starred" ? "Starred" :
          currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1)
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? "Close search" : "Open search (Ctrl+F)"}
            >
              <SearchIcon className="h-4 w-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCompose(true)}
              className="md:hidden"
              aria-label="New message"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </>
        }
      >
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 gap-1.5"
            aria-expanded={showAddressDropdown}
            aria-label={`Filter by address: ${selectedLabel}`}
          >
            {selectedLabel}
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>

          {showAddressDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAddressDropdown(false)} aria-hidden="true" />
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 max-h-60 overflow-y-auto"
                role="listbox"
                aria-label="Filter by email address"
              >
                <button
                  onClick={() => { setSelectedAddress("all"); setShowAddressDropdown(false) }}
                  role="option"
                  aria-selected={selectedAddress === "all"}
                  className={`w-full text-left px-4 py-2 text-sm ${selectedAddress === "all" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  All Addresses
                </button>
                {fromAddresses.map((addr) => (
                  <button
                    key={addr.full}
                    onClick={() => { setSelectedAddress(addr.full); setShowAddressDropdown(false) }}
                    role="option"
                    aria-selected={selectedAddress === addr.full}
                    className={`w-full text-left px-4 py-2 text-sm ${selectedAddress === addr.full ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                  >
                    {addr.full}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </PageHeader>

      {showSearch && (
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              aria-label="Search emails"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <InboxToolbar
        totalCount={totalCount}
        visibleCount={displayEmails.length}
        selectedCount={selectedIds.size}
        hasUnreadSelected={hasUnreadSelected}
        page={page}
        pageSize={pageSize}
        onSelect={handleSelectType}
        onArchiveSelected={handleBulkArchive}
        onDeleteSelected={handleBulkDelete}
        onToggleReadSelected={handleBulkToggleRead}
        onRefresh={handleRefresh}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col w-full overflow-y-auto">
          <InboxList
            emails={displayEmails}
            selectedId={undefined}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onStar={handleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
            onToggleSelection={handleToggleSelection}
            threadCounts={threadCounts}
            loading={loading}
            currentFolder={currentFolder}
          />
        </div>
      </div>

      <ComposeDialog
        open={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSend}
        fromAddresses={fromAddresses}
        key={showCompose ? "new" : "closed"}
      />
    </>
  )
}

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { InboxList } from "@/components/inbox/inbox-list"
import { InboxToolbar } from "@/components/inbox/inbox-toolbar"
import type { SelectType } from "@/components/inbox/inbox-toolbar"
import { ComposeDialog } from "@/components/compose/compose-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Mail, Search as SearchIcon, Clock, Pin, Filter, X as XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { useEmailSearch } from "@/hooks/use-email-search"
import { useRealtimeEmails } from "@/hooks/use-realtime-emails"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { decodeMimeSubject } from "@/lib/email-utils"
import type { Email } from "@/types"

export const dynamic = "force-dynamic"

const SNOOZE_OPTIONS = [
  { label: "Later today", value: "18:00" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This weekend", value: "weekend" },
  { label: "Next week", value: "nextweek" },
  { label: "Pick date", value: "custom" },
]

export default function DashboardPage() {
  const [currentFolder, setCurrentFolder] = useState("inbox")
  const [emails, setEmails] = useState<Email[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState("all")
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [filterHasAttachment, setFilterHasAttachment] = useState<boolean | undefined>(undefined)
  const [filterBefore, setFilterBefore] = useState("")
  const [filterAfter, setFilterAfter] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>(undefined)
  const [showSnoozePicker, setShowSnoozePicker] = useState<string | null>(null)
  const pageSize = 50
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [fromAddresses, setFromAddresses] = useState<{ local_part: string; domain: string; full: string }[]>([])
  const [workspaceId, setWorkspaceId] = useState<string>("")

  const isLabelFolder = currentFolder.startsWith("label:")

  useEffect(() => {
    const path = window.location.pathname
    const segments = path.split("/").filter(Boolean)
    if (segments.length > 0) setWorkspaceId(segments[0])
  }, [])

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

      // Fetch from addresses via workspace API
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

      // Label folder: fetch emails by label
      if (currentFolder.startsWith("label:")) {
        const labelId = currentFolder.replace("label:", "")
        const res = await fetch(`/api/emails/${labelId}/labels`)
        if (res.ok) {
          const emails = await res.json()
          setEmails(Array.isArray(emails) ? emails : [])
          setTotalCount(Array.isArray(emails) ? emails.length : 0)
        }
        setLoading(false)
        return
      }

      // Server-side search when query is long enough
      if (searchQuery.length >= 2 && !isLabelFolder) {
        const params = new URLSearchParams({ q: searchQuery, limit: String(pageSize), page: String(page) })
        if (selectedAddress !== "all") params.set("address", selectedAddress)
        if (filterFrom) params.set("from", filterFrom)
        if (filterTo) params.set("to", filterTo)
        if (filterSubject) params.set("subject", filterSubject)
        if (filterHasAttachment !== undefined) params.set("has_attachment", String(filterHasAttachment))
        if (filterBefore) params.set("before", filterBefore)
        if (filterAfter) params.set("after", filterAfter)
        if (workspaceId) params.set("workspace_id", workspaceId)

        const res = await fetch(`/api/search?${params}`)
        if (res.ok) {
          const data = await res.json()
          setEmails(data.emails || [])
          setTotalCount(data.total || 0)
        }
        setLoading(false)
        return
      }

      const params = new URLSearchParams({
        folder: currentFolder,
        limit: String(pageSize),
        offset: String(page * pageSize),
      })
      if (selectedAddress !== "all") params.set("address", selectedAddress)

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
  }, [currentFolder, selectedAddress, page, pageSize, fromAddresses.length, workspaceId, searchQuery, filterFrom, filterTo, filterSubject, filterHasAttachment, filterBefore, filterAfter, isLabelFolder])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  // Realtime subscription via extracted hook
  useRealtimeEmails(fetchEmails, true)

  // Thread grouping using message_id / in_reply_to / references chain
  const getThreadKey = (email: Email): string => {
    if (email.references && email.references.length > 0) return email.references[0]
    if (email.in_reply_to) return email.in_reply_to
    if (email.message_id) return email.message_id
    const normalized = email.subject
      ?.replace(/^(Re|Fwd|Aw|Wg):\s*/i, "")
      .trim()
      .toLowerCase() || ""
    return `subject:${normalized}`
  }

  const threadGroups = useMemo(() => {
    const groups = new Map<string, Email[]>()
    for (const email of emails) {
      const key = getThreadKey(email)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(email)
    }
    return groups
  }, [emails])

  const threadedEmails = useMemo(() => {
    const seen = new Set<string>()
    const result: Email[] = []
    const sorted = [...emails].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    for (const email of sorted) {
      const key = getThreadKey(email)
      if (!seen.has(key)) {
        seen.add(key)
        result.push(email)
      }
    }
    return result
  }, [emails])

  const threadCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const email of threadedEmails) {
      const key = getThreadKey(email)
      const group = threadGroups.get(key)
      if (group && group.length > 1) {
        counts[email.id] = group.length
      }
    }
    return counts
  }, [threadedEmails, threadGroups])

  // Sort: pinned emails first
  const sortedEmails = useMemo(() => {
    return [...emails].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [emails])

  // Client-side search via extracted hook
  const searchResults = useEmailSearch(sortedEmails, searchQuery)
  const displayEmails = searchQuery.length > 0 && searchQuery.length < 2 ? (searchResults ?? sortedEmails) : sortedEmails

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
  const handleSend = async (data: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; textBody?: string; fromAddress: string; attachments?: { filename: string; content: string }[]; inReplyTo?: string; priority?: "low" | "normal" | "high"; readReceipt?: boolean }) => {
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workspaceId }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to send")
        return
      }
      const { id } = await res.json()

      setShowCompose(false)
      fetchEmails()

      let cancelled = false
      const timer = setTimeout(async () => {
        if (!cancelled) {
          try {
            await fetch(`/api/send/confirm/${id}`, { method: "POST" })
            fetchEmails()
          } catch {}
        }
      }, 10000)

      toast("Message sent", {
        description: "Undo available (10s)",
        action: {
          label: "Undo",
          onClick: async () => {
            cancelled = true
            clearTimeout(timer)
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
    setSelectedEmailId(id)
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
  }

  const handleNavigate = (id: string) => {
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

  const handlePin = async (id: string, pinned: boolean) => {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, pinned } : e)))
    }
  }

  const handleSnooze = async (id: string, until: string | null) => {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snoozed_until: until }),
    })
    if (res.status === 429) { toast.error("Too many requests"); return }
    if (res.ok) {
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, snoozed_until: until } : e)))
      if (until) {
        toast.success("Snoozed until " + new Date(until).toLocaleString())
        setEmails((prev) => prev.filter((e) => e.id !== id))
      }
    }
  }

  const handleAssignLabels = async (emailId: string, labelIds: string[]) => {
    const res = await fetch(`/api/emails/${emailId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelIds }),
    })
    if (res.ok) {
      fetchEmails()
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
    if (["settings", "analytics", "templates", "imap-sync", "workspaces", "contacts"].includes(folder)) {
      const routeMap: Record<string, string> = {
        settings: `/${workspaceId}/settings`,
        analytics: `/${workspaceId}/analytics`,
        templates: `/${workspaceId}/templates`,
        "imap-sync": `/${workspaceId}/imap-sync`,
        workspaces: "/workspaces",
        contacts: `/${workspaceId}/contacts`,
      }
      router.push(routeMap[folder])
      return
    }
    setSearchQuery("")
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
          currentFolder.startsWith("label:") ? `Label: ${currentFolder.replace("label:", "")}` :
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
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails... (min 2 chars for server search)"
              aria-label="Search emails"
              className="w-full pl-9 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${showAdvancedFilters ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              title="Advanced filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">From</label>
                <Input value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="sender@example.com" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">To</label>
                <Input value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="recipient@example.com" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Subject</label>
                <Input value={filterSubject} onChange={e => setFilterSubject(e.target.value)} placeholder="subject word" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">After</label>
                <Input type="date" value={filterAfter} onChange={e => setFilterAfter(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Before</label>
                <Input type="date" value={filterBefore} onChange={e => setFilterBefore(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Attachments</label>
                <select
                  value={filterHasAttachment === undefined ? "" : String(filterHasAttachment)}
                  onChange={e => setFilterHasAttachment(e.target.value === "" ? undefined : e.target.value === "true")}
                  className="h-8 text-xs w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2"
                >
                  <option value="">Any</option>
                  <option value="true">Has attachments</option>
                  <option value="false">No attachments</option>
                </select>
              </div>
              <div className="col-span-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterSubject(""); setFilterHasAttachment(undefined); setFilterBefore(""); setFilterAfter(""); setShowAdvancedFilters(false) }}
                  className="text-xs h-7"
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
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
            selectedId={selectedEmailId}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onNavigate={handleNavigate}
            onStar={handleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
            onToggleSelection={handleToggleSelection}
            threadCounts={threadCounts}
            loading={loading}
            currentFolder={currentFolder}
            onPin={handlePin}
            onSnooze={handleSnooze}
            onAssignLabels={handleAssignLabels}
            labels={[]}
          />
        </div>
      </div>

      <ComposeDialog
        open={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSend}
        fromAddresses={fromAddresses}
        workspaceId={workspaceId}
        key={showCompose ? "new" : "closed"}
      />
    </>
  )
}

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { InboxList } from "@/components/inbox/inbox-list"
import { EmailViewer } from "@/components/inbox/email-viewer"
import { ComposeDialog } from "@/components/compose/compose-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Mail, Search as SearchIcon, Send, Star, Archive, Trash2, FileText, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { useEmailSearch } from "@/hooks/use-email-search"
import { useRealtimeEmails } from "@/hooks/use-realtime-emails"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { decodeMimeSubject } from "@/lib/email-utils"
import type { Email } from "@/types"

export const dynamic = "force-dynamic"

type ComposeMode = "new" | "reply" | "replyAll" | "forward"

export default function DashboardPage() {
  const [currentFolder, setCurrentFolder] = useState("inbox")
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>("new")
  const [replyTarget, setReplyTarget] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAddress, setSelectedAddress] = useState("all")
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [prevEmailCount, setPrevEmailCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
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

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId),
    [emails, selectedEmailId]
  )

  // Data fetching
  const fetchEmails = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

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

      const folder = currentFolder === "inbox" ? "inbox" :
                     currentFolder === "starred" ? "starred" :
                     currentFolder === "sent" ? "sent" : currentFolder

      let query = supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (folder !== "starred") {
        query = query.eq("folder", folder)
      } else {
        query = query.eq("starred", true)
      }

      if (selectedAddress !== "all") {
        query = query.eq("mailbox_address", selectedAddress)
      }

      const { data } = await query

      if (data) {
        if (prevEmailCount > 0 && data.length > prevEmailCount) {
          const newCount = data.length - prevEmailCount
          toast(`${newCount} new email(s)`, {
            description: decodeMimeSubject(data[0]?.subject) || "Received in inbox",
            icon: <Mail className="h-4 w-4 text-blue-500" />,
          })
        }
        setPrevEmailCount(data.length)
        setEmails(data as Email[])
      }
    } catch (err) {
      console.error("Error fetching emails:", err)
    } finally {
      setLoading(false)
    }
  }, [currentFolder, selectedAddress, supabase, router, prevEmailCount, fromAddresses.length, workspaceId])

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

  // Keyboard shortcuts via extracted hook
  const shortcuts = useMemo(
    () => ({
      c: () => {
        setComposeMode("new")
        setReplyTarget(null)
        setShowCompose(true)
      },
      r: () => {
        if (selectedEmail) {
          setReplyTarget(selectedEmail)
          setComposeMode("reply")
          setShowCompose(true)
        }
      },
      Escape: () => {
        setShowSearch(false)
        setSearchQuery("")
        setShowAddressDropdown(false)
      },
    }),
    [selectedEmail]
  )

  // Ctrl+F shortcut (separate because it needs metaKey/ctrlKey check)
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

  useKeyboardShortcuts(shortcuts)

  // Action handlers
  const handleSend = async (data: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; fromAddress: string; attachments?: { filename: string; content: string }[]; inReplyTo?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to send")
        return
      }
      const { id } = await res.json()

      setShowCompose(false)
      setReplyTarget(null)
      setComposeMode("new")
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
    await supabase.from("emails").update({ starred }).eq("id", id)
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred } : e)))
  }

  const handleSelect = async (id: string) => {
    setSelectedEmailId(id)
    const email = emails.find((e) => e.id === id)
    if (email && !email.read) {
      await supabase.from("emails").update({ read: true }).eq("id", id)
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)))
    }
  }

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
    setSelectedEmailId(null)
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
              onClick={() => { setComposeMode("new"); setReplyTarget(null); setShowCompose(true) }}
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

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${selectedEmailId ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 md:border-r border-gray-100 dark:border-gray-800 overflow-y-auto`}
          role="region"
          aria-label="Email list panel"
        >
          <InboxList
            emails={displayEmails}
            selectedId={selectedEmailId ?? undefined}
            onSelect={handleSelect}
            onStar={handleStar}
            threadCounts={threadCounts}
            loading={loading}
            currentFolder={currentFolder}
          />
        </div>

        <div
          className={`${!selectedEmailId ? "hidden md:flex" : "flex"} flex-1 flex-col overflow-hidden`}
          role="region"
          aria-label="Email content panel"
        >
          {selectedEmail ? (
            <EmailViewer
              email={selectedEmail}
              onReply={() => {
                setReplyTarget(selectedEmail)
                setComposeMode("reply")
                setShowCompose(true)
              }}
              onReplyAll={() => {
                setReplyTarget(selectedEmail)
                setComposeMode("replyAll")
                setShowCompose(true)
              }}
              onForward={() => {
                setReplyTarget(selectedEmail)
                setComposeMode("forward")
                setShowCompose(true)
              }}
              onBack={() => setSelectedEmailId(null)}
              onStar={() => handleStar(selectedEmail.id, !selectedEmail.starred)}
              onDelete={async () => {
                await supabase.from("emails").update({ folder: "trash" }).eq("id", selectedEmail.id)
                setSelectedEmailId(null)
                fetchEmails()
              }}
              onArchive={async () => {
                await supabase.from("emails").update({ folder: "archive" }).eq("id", selectedEmail.id)
                setSelectedEmailId(null)
                fetchEmails()
              }}
            />
          ) : (
            <EmptyEmailDetail folder={currentFolder} />
          )}
        </div>
      </div>

      <ComposeDialog
        open={showCompose}
        onClose={() => {
          setShowCompose(false)
          setReplyTarget(null)
          setComposeMode("new")
        }}
        onSend={handleSend}
        fromAddresses={fromAddresses}
        replyTo={replyTarget ? {
          to: composeMode === "forward" ? "" : (composeMode === "replyAll" ? [replyTarget.from_address, ...(replyTarget.cc_addresses || [])].join(", ") : replyTarget.from_address),
          subject: replyTarget.subject || "",
          body: replyTarget.body_text || replyTarget.body_html?.replace(/<[^>]*>/g, "").trim() || "",
          mode: composeMode,
        } : undefined}
        key={showCompose ? (replyTarget?.id || "new") : "closed"}
      />
    </>
  )
}

/**
 * Contextual empty state for the email detail panel.
 * Shows a different message depending on the current folder.
 */
function EmptyEmailDetail({ folder }: { folder: string }) {
  const config = EMPTY_DETAIL_CONFIG[folder] || EMPTY_DETAIL_CONFIG.inbox

  return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <config.icon className="h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{config.title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{config.subtitle}</p>
      </div>
    </div>
  )
}

const EMPTY_DETAIL_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }> = {
  inbox: {
    icon: Mail,
    title: "Select an email to read",
    subtitle: "Choose from your inbox",
  },
  sent: {
    icon: Send,
    title: "Select a sent email",
    subtitle: "View your sent messages",
  },
  drafts: {
    icon: FileText,
    title: "Select a draft",
    subtitle: "Continue editing your drafts",
  },
  starred: {
    icon: Star,
    title: "Select a starred email",
    subtitle: "View your bookmarked messages",
  },
  archive: {
    icon: Archive,
    title: "Select an archived email",
    subtitle: "Browse your archived messages",
  },
  spam: {
    icon: AlertTriangle,
    title: "Select an email",
    subtitle: "Review your spam folder",
  },
  trash: {
    icon: Trash2,
    title: "Select a deleted email",
    subtitle: "View messages in trash",
  },
}

"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { InboxItem } from "./inbox-item"
import { decodeMimeSubject } from "@/lib/email-utils"
import { Mail, Send, FileText, Star, Archive, AlertTriangle, Trash2 } from "lucide-react"
import type { Email } from "@/types"

interface InboxListProps {
  emails: Email[]
  selectedId?: string
  selectedIds?: Set<string>
  onSelect: (id: string) => void
  onNavigate?: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onToggleRead: (id: string, read: boolean) => void
  onToggleSelection?: (id: string) => void
  onRefresh?: () => void
  threadCounts?: Record<string, number>
  loading?: boolean
  currentFolder?: string
  onPin?: (id: string, pinned: boolean) => void
  onSnooze?: (id: string, until: string | null) => void
  onAssignLabels?: (emailId: string, labelIds: string[]) => void
  labels?: { id: string; name: string; color: string }[]
}

const EMPTY_LIST_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }> = {
  inbox: { icon: Mail, title: "No emails yet", subtitle: "When emails arrive, they'll appear here" },
  sent: { icon: Send, title: "No sent emails", subtitle: "Emails you send will appear here" },
  drafts: { icon: FileText, title: "No drafts", subtitle: "Saved drafts will appear here" },
  starred: { icon: Star, title: "No starred emails", subtitle: "Starred emails will appear here" },
  archive: { icon: Archive, title: "No archived emails", subtitle: "Archived emails will appear here" },
  spam: { icon: AlertTriangle, title: "No spam", subtitle: "Spam emails will appear here" },
  trash: { icon: Trash2, title: "Trash is empty", subtitle: "Deleted emails will appear here" },
}

export function InboxList({
  emails,
  selectedId,
  selectedIds,
  onSelect,
  onNavigate,
  onStar,
  onArchive,
  onDelete,
  onToggleRead,
  onToggleSelection,
  onRefresh,
  threadCounts = {},
  loading = false,
  currentFolder = "inbox",
  onPin,
  onSnooze,
}: InboxListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const pullStartY = useRef(0)
  const isPulling = useRef(false)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = selectedId
        ? emails.findIndex((e) => e.id === selectedId)
        : -1

      if (e.key === "ArrowDown" && currentIndex < emails.length - 1) {
        e.preventDefault()
        onSelect(emails[currentIndex + 1].id)
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        e.preventDefault()
        onSelect(emails[currentIndex - 1].id)
      } else if (e.key === "Home") {
        e.preventDefault()
        if (emails.length > 0) onSelect(emails[0].id)
      } else if (e.key === "End") {
        e.preventDefault()
        if (emails.length > 0) onSelect(emails[emails.length - 1].id)
      } else if (e.key === "Enter" && selectedId) {
        e.preventDefault()
        onNavigate?.(selectedId)
      }
    },
    [emails, selectedId, onSelect, onNavigate]
  )

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current
    if (!container || container.scrollTop > 0) return
    pullStartY.current = e.touches[0].clientY
    isPulling.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current
    if (!container || container.scrollTop > 0) {
      setPullDistance(0)
      return
    }

    const dy = e.touches[0].clientY - pullStartY.current
    if (dy > 0) {
      isPulling.current = true
      const clamped = Math.min(dy * 0.5, 80)
      setPullDistance(clamped)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (isPulling.current && pullDistance >= 50) {
      onRefresh?.()
    }
    setPullDistance(0)
    isPulling.current = false
  }, [pullDistance, onRefresh])

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
              </div>
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (emails.length === 0) {
    const config = EMPTY_LIST_CONFIG[currentFolder] || EMPTY_LIST_CONFIG.inbox
    const Icon = config.icon
    return (
      <div className="flex-1 flex items-center justify-center p-6" ref={containerRef}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <Icon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {config.title}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {config.subtitle}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto focus:outline-none relative"
      role="listbox"
      aria-label="Email list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400 transition-all"
          style={{ height: pullDistance, opacity: pullDistance / 50 }}
        >
          <svg className={`w-4 h-4 ${pullDistance >= 50 ? "text-blue-500" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          {pullDistance >= 50 ? "Release to refresh" : "Pull to refresh"}
        </div>
      )}
      {emails.map((email) => {
        const decodedSubject = decodeMimeSubject(email.subject)
        return (
          <div
            key={email.id}
            ref={email.id === selectedId ? selectedRef : undefined}
            role="option"
            aria-selected={email.id === selectedId}
            aria-label={`${email.from_name || email.from_address || "Unknown"}: ${decodedSubject}`}
          >
            <InboxItem
              email={email}
              isSelected={email.id === selectedId}
              isUnread={!email.read}
              isChecked={selectedIds?.has(email.id) ?? false}
              threadCount={threadCounts[email.id]}
              onSelect={onSelect}
              onNavigate={onNavigate}
              onStar={onStar}
              onArchive={onArchive}
              onDelete={onDelete}
              onToggleRead={onToggleRead}
              onToggleCheck={onToggleSelection}
              onPin={onPin}
              onSnooze={onSnooze}
            />
          </div>
        )
      })}

      {emails.length > 0 && (
        <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
          {emails.length} email{emails.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

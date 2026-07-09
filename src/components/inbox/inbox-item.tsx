"use client"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { decodeMimeSubject, truncateText, cleanSenderName } from "@/lib/email-utils"
import { Star, Archive, Trash2, MailOpen, Mail, Check, Send, Clock, AlertCircle, CheckCircle2, Pin, PinOff, BellOff } from "lucide-react"
import type { Email } from "@/types"

interface InboxItemProps {
  email: Email
  isSelected: boolean
  isUnread: boolean
  isChecked: boolean
  threadCount?: number
  onSelect: (id: string) => void
  onNavigate?: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onToggleRead: (id: string, read: boolean) => void
  onToggleCheck?: (id: string) => void
  onPin?: (id: string, pinned: boolean) => void
  onSnooze?: (id: string, until: string | null) => void
}

export function InboxItem({
  email,
  isSelected,
  isUnread,
  isChecked,
  threadCount,
  onSelect,
  onNavigate,
  onStar,
  onArchive,
  onDelete,
  onToggleRead,
  onToggleCheck,
}: InboxItemProps) {
  const [hovering, setHovering] = useState(false)

  const handleSelect = useCallback(() => {
    if (window.getSelection()?.toString()) return
    onSelect(email.id)
    onNavigate?.(email.id)
  }, [email.id, onSelect, onNavigate])
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onSelect(email.id)
        onNavigate?.(email.id)
      }
    },
    [email.id, onSelect, onNavigate]
  )
  const handleStar = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onStar(email.id, !email.starred)
    },
    [email.id, email.starred, onStar]
  )
  const handleStarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onStar(email.id, !email.starred)
      }
    },
    [email.id, email.starred, onStar]
  )

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onArchive(email.id)
    },
    [email.id, onArchive]
  )
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete(email.id)
    },
    [email.id, onDelete]
  )
  const handleToggleRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleRead(email.id, email.read)
    },
    [email.id, email.read, onToggleRead]
  )
  const handleCheck = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleCheck?.(email.id)
    },
    [email.id, onToggleCheck]
  )
  const handleCheckKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onToggleCheck?.(email.id)
      }
    },
    [email.id, onToggleCheck]
  )

  const decodedSubject = decodeMimeSubject(email.subject)
  const senderName = cleanSenderName(email.from_name || email.from_address || "Unknown")
  const snippet = truncateText(email.body_text || email.body_html || "", 100)
  const time = formatShortTime(email.created_at)

  return (
    <div
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      role="button"
      tabIndex={0}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800/80 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset group",
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-900/50 border-l-2 border-l-transparent",
        isUnread ? "bg-white dark:bg-gray-950" : "bg-gray-50/50 dark:bg-gray-900/30"
      )}
      aria-current={isSelected ? "true" : undefined}
      aria-label={`${isUnread ? "Unread" : "Read"} email from ${senderName}: ${decodedSubject}`}
    >
      <div className="flex items-start gap-1">
        {/* Checkbox */}
        <div
          className={cn(
            "flex-shrink-0 pt-2.5 pl-0.5 transition-opacity duration-150",
            hovering || isChecked ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            onClick={handleCheck}
            onKeyDown={handleCheckKeyDown}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={0}
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              isChecked
                ? "bg-blue-500 border-blue-500"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            )}
          >
            {isChecked && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sender row */}
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                "text-sm truncate",
                isUnread
                  ? "font-semibold text-gray-900 dark:text-gray-100"
                  : "font-medium text-gray-700 dark:text-gray-300"
              )}
              title={senderName}
            >
              {senderName}
            </span>
            {threadCount && threadCount > 1 ? (
              <span className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                {threadCount}
              </span>
            ) : null}
          </div>

          {/* Subject row */}
          <div
            className={cn(
              "text-sm truncate mb-0.5 flex items-center gap-1.5",
              isUnread
                ? "font-medium text-gray-800 dark:text-gray-200"
                : "text-gray-600 dark:text-gray-400"
            )}
            title={decodedSubject}
          >
            {email.pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500" />}
            {email.snoozed_until && <BellOff className="h-3 w-3 text-purple-500 shrink-0" />}
            <span className="truncate">{decodedSubject}</span>
          </div>

          {/* Labels row */}
          {email.labels && email.labels.length > 0 && (
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              {email.labels.map(label => (
                <span
                  key={label.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none"
                  style={{ backgroundColor: label.color + "20", color: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Snippet row */}
          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {snippet}
          </div>

          {/* Delivery status for outbound emails */}
          {email.direction === "outbound" && email.delivery_status && email.delivery_status !== "sent" && (
            <div className="flex items-center gap-1 mt-1">
              {email.delivery_status === "queued" && <Clock className="h-3 w-3 text-gray-400" />}
              {email.delivery_status === "sending" && <Send className="h-3 w-3 text-blue-400 animate-pulse" />}
              {email.delivery_status === "delivered" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              {email.delivery_status === "failed" && <AlertCircle className="h-3 w-3 text-red-500" />}
              {email.delivery_status === "bounced" && <AlertCircle className="h-3 w-3 text-orange-500" />}
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                email.delivery_status === "delivered" && "text-green-600 dark:text-green-400",
                email.delivery_status === "failed" && "text-red-600 dark:text-red-400",
                email.delivery_status === "bounced" && "text-orange-600 dark:text-orange-400",
                email.delivery_status === "queued" && "text-gray-400",
                email.delivery_status === "sending" && "text-blue-500",
              )}>
                {email.delivery_status}
              </span>
            </div>
          )}
        </div>

        {/* Right column: time (default) / hover actions */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 relative w-[72px]">
          {hovering ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleArchive}
                type="button"
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Archive"
                title="Archive"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                type="button"
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleToggleRead}
                type="button"
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                aria-label={isUnread ? "Mark as read" : "Mark as unread"}
                title={isUnread ? "Mark as read" : "Mark as unread"}
              >
                {isUnread ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mt-0.5">
              {time}
            </span>
          )}
          {email.snoozed_until && (
            <span className="text-[10px] text-purple-500 whitespace-nowrap">
              {formatSnoozeTime(email.snoozed_until)}
            </span>
          )}
          <button
            onClick={handleStar}
            onKeyDown={handleStarKeyDown}
            type="button"
            className={cn(
              "p-0.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              email.starred
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 dark:text-gray-500 hover:text-yellow-400"
            )}
            aria-label={email.starred ? "Unstar email" : "Star email"}
          >
            <Star
              className="h-3.5 w-3.5"
              fill={email.starred ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatSnoozeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    if (diffMs <= 0) return ""
    const diffHrs = diffMs / (1000 * 60 * 60)
    if (diffHrs < 1) return `${Math.round(diffMs / (1000 * 60))}m`
    if (diffHrs < 24) return `${Math.round(diffHrs)}h`
    return `${Math.round(diffHrs / 24)}d`
  } catch { return "" }
}

function formatShortTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    const isThisYear = date.getFullYear() === now.getFullYear()
    if (isThisYear) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

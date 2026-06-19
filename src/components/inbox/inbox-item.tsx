"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { decodeMimeSubject, truncateText } from "@/lib/email-utils"
import { Star } from "lucide-react"
import type { Email } from "@/types"

interface InboxItemProps {
  email: Email
  isSelected: boolean
  isUnread: boolean
  threadCount?: number
  onSelect: (id: string) => void
  onStar: (id: string, starred: boolean) => void
}

export function InboxItem({
  email,
  isSelected,
  isUnread,
  threadCount,
  onSelect,
  onStar,
}: InboxItemProps) {
  const handleSelect = useCallback(() => onSelect(email.id), [email.id, onSelect])
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Activate on Enter or Space (same as button behavior)
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onSelect(email.id)
      }
    },
    [email.id, onSelect]
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

  const decodedSubject = decodeMimeSubject(email.subject)
  const senderName = email.from_name || email.from_address || "Unknown"
  const snippet = truncateText(email.body_text || email.body_html || "", 100)
  const time = formatShortTime(email.created_at)

  return (
    <div
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
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
      <div className="flex items-start gap-2">
        {/* Sender name + Star column */}
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
              "text-sm truncate mb-0.5",
              isUnread
                ? "font-medium text-gray-800 dark:text-gray-200"
                : "text-gray-600 dark:text-gray-400"
            )}
            title={decodedSubject}
          >
            {decodedSubject}
          </div>

          {/* Snippet row */}
          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {snippet}
          </div>
        </div>

        {/* Right column: time + star */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {time}
          </span>
          <button
            onClick={handleStar}
            onKeyDown={handleStarKeyDown}
            type="button"
            className={cn(
              "p-0.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              email.starred
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-400"
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

/**
 * Format a date string into a short display.
 * Today → "3:45 PM"
 * This year → "Jan 12"
 * Older → "Jan 12, 2023"
 */
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

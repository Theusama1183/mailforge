"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Avatar } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { cn, formatDate, truncate } from "@/lib/utils"
import type { Email } from "@/types"

export function EmailList({
  emails,
  selectedId,
  onSelect,
  onStar,
  threadCounts,
}: {
  emails: Email[]
  selectedId?: string
  onSelect: (id: string) => void
  onStar: (id: string, starred: boolean) => void
  threadCounts?: Record<string, number>
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: emails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No emails yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">When emails arrive, they will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto" role="list" aria-label="Email list">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const email = emails[virtualRow.index]
          const senderName = email.from_name || email.from_address.split("@")[0]

          return (
            <div
              key={email.id}
              role="listitem"
              onClick={() => onSelect(email.id)}
              onKeyDown={(e) => { if (e.key === "Enter") onSelect(email.id) }}
              tabIndex={0}
              aria-selected={email.id === selectedId}
              aria-label={`Email from ${senderName}: ${email.subject || "No subject"}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={cn(
                "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors",
                email.id === selectedId
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                !email.read && "bg-blue-50/30 dark:bg-blue-900/10"
              )}
            >
              <div className="shrink-0">
                <Avatar name={senderName} size="md" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-sm truncate",
                    !email.read ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {senderName}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {formatDate(email.created_at)}
                  </span>
                </div>

                <p className={cn(
                  "text-sm truncate mt-0.5",
                  !email.read ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
                )}>
                  {email.subject || "(No subject)"}
                </p>

                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {truncate(email.body_text || email.body_html?.replace(/<[^>]*>/g, "") || "", 80)}
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                  {email.mailbox_address && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 truncate max-w-28">
                      {email.mailbox_address}
                    </span>
                  )}
                  {threadCounts?.[email.id] && threadCounts[email.id] > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                      {threadCounts[email.id]}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onStar(email.id, !email.starred) }}
                className="shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label={email.starred ? "Unstar email" : "Star email"}
              >
                <Star className={cn(
                  "h-3.5 w-3.5",
                  email.starred ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"
                )} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

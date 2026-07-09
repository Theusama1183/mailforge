"use client"

import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Email } from "@/types"
import { decodeMimeSubject } from "@/lib/email-utils"

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html
  try {
    const DOMPurify = require("dompurify") as typeof import("dompurify").default
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ["style"],
      ALLOW_DATA_ATTR: false,
    })
  } catch {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  }
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    }
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" })
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

export function ThreadConversation({
  threadEmails,
  currentEmailId,
}: {
  threadEmails: Email[]
  currentEmailId: string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(currentEmailId)

  if (threadEmails.length <= 1) return null

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Conversation ({threadEmails.length} messages)
        </p>

        <div className="space-y-1">
          {threadEmails.map((msg) => {
            const isCurrent = msg.id === currentEmailId
            const isExpanded = expandedId === msg.id
            const senderName = msg.from_name || msg.from_address?.split("@")[0] || "Unknown"
            const snippet = msg.body_text
              ? msg.body_text.slice(0, 120)
              : msg.body_html
                ? msg.body_html.replace(/<[^>]*>/g, "").slice(0, 120)
                : ""

            return (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg border transition-colors",
                  isCurrent
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                )}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  aria-expanded={isExpanded}
                >
                  <Avatar name={senderName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isCurrent
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {senderName}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {decodeMimeSubject(msg.subject) || snippet || "(No content)"}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
                    {formatMessageTime(msg.created_at)}
                  </span>
                  <svg
                    className={cn(
                      "h-3.5 w-3.5 text-gray-400 transition-transform shrink-0",
                      isExpanded && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {msg.body_html ? (
                      <div
                        className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none break-words [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(msg.body_html),
                        }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {msg.body_text || "(No content)"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

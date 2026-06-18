"use client"

import { useMemo } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Reply, Forward, ReplyAll, Trash2, Archive, Star } from "lucide-react"
import type { Email } from "@/types"

// Lazy-loaded DOMPurify to avoid blocking initial render
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html
  // Dynamic import to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify") as typeof import("dompurify").default

  // If this is a full HTML document, extract just the body content
  let cleanHtml = html
  if (/^\s*<(?:!DOCTYPE|html)/i.test(html)) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    if (bodyMatch) {
      cleanHtml = bodyMatch[1]
    } else {
      // Strip outer html/head/body tags
      cleanHtml = html
        .replace(/^[\s\S]*?<body[^>]*>/i, '')
        .replace(/<\/body>[\s\S]*$/i, '')
        .replace(/<\/html>\s*$/i, '')
    }
  }

  return DOMPurify.sanitize(cleanHtml, {
    ALLOWED_TAGS: [
      "p", "br", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6",
      "a", "img", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th",
      "blockquote", "pre", "code", "strong", "em", "u", "s", "hr", "dl", "dt", "dd",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "width", "height", "class", "target", "rel", "title"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  })
}

export function EmailViewer({
  email,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onStar,
  onBack,
}: {
  email: Email
  onReply?: () => void
  onReplyAll?: () => void
  onForward?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onStar?: () => void
  onBack?: () => void
}) {
  const senderName = email.from_name || email.from_address.split("@")[0]

  const sanitizedHtml = useMemo(() => {
    if (!email.body_html) return ""
    return sanitizeHtml(email.body_html)
  }, [email.body_html])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden" aria-label="Back to email list">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onReply} aria-label="Reply to sender">
              <Reply className="h-4 w-4 mr-1.5" />
              Reply
            </Button>
            {onReplyAll && (
              <Button variant="ghost" size="sm" onClick={onReplyAll} aria-label="Reply all">
                <ReplyAll className="h-4 w-4 mr-1.5" />
                Reply All
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onForward} aria-label="Forward email">
              <Forward className="h-4 w-4 mr-1.5" />
              Forward
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onStar} aria-label={email.starred ? "Unstar email" : "Star email"}>
            <Star className={email.starred ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onArchive} aria-label="Archive email">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete email">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {email.subject || "(No subject)"}
          </h1>

          <div className="flex items-start gap-3 mb-6">
            <Avatar name={senderName} size="lg" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 dark:text-gray-100">{senderName}</p>
                <span className="text-sm text-gray-400">
                  {formatDate(email.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                to {email.to_addresses?.join(", ")}
              </p>
              {email.cc_addresses && email.cc_addresses.length > 0 && (
                <p className="text-xs text-gray-400">
                  cc: {email.cc_addresses.join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            {email.body_html ? (
              <div
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            ) : (
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {email.body_text || "No content"}
              </div>
            )}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Attachments ({email.attachments.length})
              </p>
              <div className="space-y-2">
                {email.attachments.map((att, i) => (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => att.url && window.open(att.url, "_blank", "noopener,noreferrer")}
                    onKeyDown={(e) => { if (e.key === "Enter" && att.url) window.open(att.url, "_blank", "noopener,noreferrer") }}
                    aria-label={`Download attachment ${att.filename}`}
                  >
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {att.filename}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { EmailToolbar } from "./email-toolbar"
import { EmailHeader } from "./email-header"
import { EmailBodyRenderer } from "./email-body-renderer"
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
        .replace(/^[\s\S]*?<body[^>]*>/i, "")
        .replace(/<\/body>[\s\S]*$/i, "")
        .replace(/<\/html>\s*$/i, "")
    }
  }

  return DOMPurify.sanitize(cleanHtml, {
    ADD_TAGS: ["style"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target", "style", "align", "valign", "bgcolor", "cellpadding", "cellspacing", "border"],
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
  const sanitizedHtml = useMemo(() => {
    if (!email.body_html) return ""
    return sanitizeHtml(email.body_html)
  }, [email.body_html])

  const hasAttachments = email.attachments && email.attachments.length > 0

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Toolbar */}
      <EmailToolbar
        onReply={onReply || (() => {})}
        onReplyAll={onReplyAll || (() => {})}
        onForward={onForward || (() => {})}
        onStar={onStar || (() => {})}
        onDelete={onDelete || (() => {})}
        onArchive={onArchive || (() => {})}
        onBack={onBack || (() => {})}
        isStarred={email.starred || false}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Email header */}
        <EmailHeader email={email} />

        {/* Email body with max-width constraint */}
        {sanitizedHtml ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div
              className="email-body-html max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        ) : (
          <EmailBodyRenderer
            bodyHtml={email.body_html}
            bodyText={email.body_text}
            subject={email.subject}
          />
        )}

        {/* Attachments section */}
        {hasAttachments ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Attachments ({email.attachments!.length})
              </p>
              <div className="space-y-2">
                {email.attachments!.map((att, i) => (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => att.url && window.open(att.url, "_blank", "noopener,noreferrer")}
                    onKeyDown={(e) => { if (e.key === "Enter" && att.url) window.open(att.url, "_blank", "noopener,noreferrer") }}
                    aria-label={`Download attachment ${att.filename}`}
                  >
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {att.filename}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {att.size ? `${(att.size / 1024).toFixed(1)} KB` : "Unknown size"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>

      {/* Inline styles for HTML body rendering */}
      <style jsx global>{`
        .email-body-html {
          line-height: 1.6;
        }
        .email-body-html p {
          margin-bottom: 0.75em;
        }
        .email-body-html a {
          color: #2563eb;
          text-decoration: underline;
          word-break: break-all;
        }
        .dark .email-body-html a {
          color: #60a5fa;
        }
        .email-body-html img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }
        .email-body-html blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #6b7280;
        }
        .dark .email-body-html blockquote {
          border-left-color: #374151;
          color: #9ca3af;
        }
        .email-body-html table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.75rem 0;
        }
        .email-body-html th,
        .email-body-html td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .dark .email-body-html th,
        .dark .email-body-html td {
          border-color: #374151;
        }
      `}</style>
    </div>
  )
}

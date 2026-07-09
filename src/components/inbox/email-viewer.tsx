"use client"

import { useMemo } from "react"
import { EmailToolbar } from "./email-toolbar"
import { EmailHeader } from "./email-header"
import { EmailBodyRenderer } from "./email-body-renderer"
import { stripInvisibleChars } from "@/lib/email-utils"
import type { Email } from "@/types"

// Lazy-loaded DOMPurify to avoid blocking initial render
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html
  // Dynamic import to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify") as typeof import("dompurify").default

  // If this is a full HTML document, preserve <style> from <head>, then extract body content
  let cleanHtml = html
  if (/^\s*<(?:!DOCTYPE|html)/i.test(html)) {
    const styleTags: string[] = []
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    let m
    while ((m = styleRegex.exec(html)) !== null) {
      styleTags.push(`<style>${m[1]}</style>`)
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    if (bodyMatch) {
      cleanHtml = styleTags.join("\n") + "\n" + bodyMatch[1]
    } else {
      cleanHtml = styleTags.join("\n") + "\n" + html
        .replace(/^[\s\S]*?<body[^>]*>/i, "")
        .replace(/<\/body>[\s\S]*$/i, "")
        .replace(/<\/html>\s*$/i, "")
    }
  }

  return DOMPurify.sanitize(stripInvisibleChars(cleanHtml), {
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
  onResend,
  onPin,
  onSnooze,
  onLabel,
  labels,
  showLabelPicker,
}: {
  email: Email
  onReply?: () => void
  onReplyAll?: () => void
  onForward?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onStar?: () => void
  onBack?: () => void
  onResend?: () => void
  onPin?: () => void
  onSnooze?: () => void
  onLabel?: () => void
  labels?: { id: string; name: string; color: string }[]
  showLabelPicker?: boolean
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
        onResend={onResend}
        onPin={onPin}
        onSnooze={onSnooze}
        onLabel={onLabel}
        isStarred={email.starred || false}
        isPinned={email.pinned || false}
        showResend={email.direction === "outbound" && (email.delivery_status === "failed" || email.delivery_status === "bounced")}
        showLabelPicker={showLabelPicker}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Email header */}
        <EmailHeader email={email} />

        {/* Labels */}
        {labels && labels.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 flex items-center gap-1.5 flex-wrap">
            {labels.map(label => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium leading-none"
                style={{ backgroundColor: label.color + "20", color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Label picker */}
        {showLabelPicker && onLabel && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 mb-2">Assign labels</p>
              <div className="flex flex-wrap gap-1.5">
                {/* Labels rendered by parent via label picker overlay */}
              </div>
            </div>
          </div>
        )}

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
          font-size: 0.9375rem;
          color: #1f2937;
        }
        .dark .email-body-html {
          color: #e5e7eb;
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
        }
        .email-body-html th,
        .email-body-html td {
          padding: 0.5rem;
          text-align: left;
        }
        .email-body-html h1,
        .email-body-html h2,
        .email-body-html h3,
        .email-body-html h4 {
          margin-top: 1.25em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.3;
        }
        .email-body-html ul,
        .email-body-html ol {
          padding-left: 1.5em;
          margin-bottom: 0.75em;
        }
        .email-body-html li {
          margin-bottom: 0.25em;
        }
        .email-body-html hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.5em 0;
        }
        .dark .email-body-html hr {
          border-top-color: #374151;
        }
      `}</style>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { formatPlainTextBody, decodeMimeSubject } from "@/lib/email-utils"
import { FileText, Code } from "lucide-react"

interface EmailBodyRendererProps {
  bodyHtml?: string | null
  bodyText?: string | null
  subject?: string | null
}

/**
 * Renders the email body with proper formatting.
 * - HTML emails are sanitized and rendered with prose styles.
 * - Plain text emails are formatted with label/value pairs, badges, and auto-linked URLs.
 * - Users can toggle between HTML and plain text views.
 */
export function EmailBodyRenderer({ bodyHtml, bodyText, subject }: EmailBodyRendererProps) {
  const [showRaw, setShowRaw] = useState(false)
  const hasHtml = Boolean(bodyHtml && bodyHtml.trim().length > 0)
  const hasText = Boolean(bodyText && bodyText.trim().length > 0)
  const hasContent = hasHtml || hasText

  const formattedText = useMemo(
    () => (bodyText ? formatPlainTextBody(bodyText) : ""),
    [bodyText]
  )

  if (!hasContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No email body content</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            This email has no visible content
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* View toggle */}
      {hasHtml && hasText ? (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex-shrink-0">
          <button
            onClick={() => setShowRaw(false)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md transition-colors font-medium",
              !showRaw
                ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
            aria-label="Show formatted view"
          >
            Formatted
          </button>
          <button
            onClick={() => setShowRaw(true)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md transition-colors font-medium",
              showRaw
                ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
            aria-label="Show raw text view"
          >
            <Code className="h-3 w-3 inline mr-1" />
            Raw
          </button>
        </div>
      ) : null}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* HTML view */}
          {!showRaw && hasHtml ? (
            <div
              className="email-body-html max-w-none break-words"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(bodyHtml || ""),
              }}
            />
          ) : null}

          {/* Plain text formatted view */}
          {!showRaw && !hasHtml && hasText ? (
            <div
              className="email-body-text text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-2"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          ) : null}

          {/* Raw text view */}
          {showRaw || (!hasHtml && hasText) ? (
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed break-words">
              {bodyText || ""}
            </pre>
          ) : null}
        </div>
      </div>

      {/* Custom styles for email body formatting */}
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

        .email-body-text .email-field {
          margin-bottom: 0.25rem;
          line-height: 1.5;
        }
        .email-body-text .email-label {
          font-weight: 600;
          color: #374151;
        }
        .dark .email-body-text .email-label {
          color: #d1d5db;
        }
        .email-body-text .email-value {
          color: #4b5563;
        }
        .dark .email-body-text .email-value {
          color: #9ca3af;
        }
        .email-body-text .email-paragraph {
          margin-bottom: 0.5rem;
        }
        .email-body-text .email-list-item {
          padding-left: 1rem;
          margin-bottom: 0.25rem;
        }
        .email-body-text .email-separator {
          border: 0;
          border-top: 1px solid #e5e7eb;
          margin: 0.75rem 0;
        }
        .dark .email-body-text .email-separator {
          border-top-color: #374151;
        }
        .email-body-text .email-badge-row {
          margin-bottom: 0.5rem;
        }
        .email-body-text .email-link {
          color: #2563eb;
          text-decoration: underline;
          word-break: break-all;
        }
        .dark .email-body-text .email-link {
          color: #60a5fa;
        }
        .email-body-text a:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}

/**
 * Minimal HTML sanitizer for email body rendering.
 * Strips script tags, event handlers, and other dangerous elements
 * while preserving safe HTML structure.
 */
function sanitizeHtml(html: string): string {
  // First, attempt to use DOMParser if available (client-side)
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html")
      // Remove script tags
      const scripts = doc.querySelectorAll("script, iframe, object, embed, link")
      scripts.forEach((el) => el.remove())
      // Remove event handler attributes
      const allElements = doc.querySelectorAll("*")
      allElements.forEach((el) => {
        const attrs = el.attributes
        for (let i = attrs.length - 1; i >= 0; i--) {
          const name = attrs[i].name.toLowerCase()
          if (
            name.startsWith("on") ||
            name === "javascript:" ||
            name === "vbscript:"
          ) {
            el.removeAttribute(attrs[i].name)
          }
        }
      })
      return doc.body.innerHTML
    } catch {
      // Fall through to regex-based sanitization
    }
  }

  // Fallback: regex-based sanitization
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/href=["']javascript:["']/gi, "")
    .replace(/href=["']vbscript:["']/gi, "")
}

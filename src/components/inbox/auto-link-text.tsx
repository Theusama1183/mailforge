"use client"

import { useMemo } from "react"

interface AutoLinkTextProps {
  text: string
  className?: string
}

/**
 * Renders text with URLs and email addresses auto-linked as clickable anchors.
 * URLs are opened in a new tab with proper security attributes.
 */
export function AutoLinkText({ text, className }: AutoLinkTextProps) {
  const html = useMemo(() => {
    // URL pattern
    const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
    // Email pattern
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

    // Escape HTML entities first
    let result = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

    // Auto-link URLs
    result = result.replace(urlPattern, (url) => {
      const href = url.startsWith("www.") ? `https://${url}` : url
      const display = url.length > 70 ? url.slice(0, 65) + "…" : url
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline break-all">${display}</a>`
    })

    // Auto-link emails
    result = result.replace(emailPattern, (email) => {
      return `<a href="mailto:${email}" class="text-blue-600 dark:text-blue-400 hover:underline break-all">${email}</a>`
    })

    return result
  }, [text])

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

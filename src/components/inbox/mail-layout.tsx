"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MailLayoutProps {
  /** Sidebar navigation content (folders, settings, etc.) */
  sidebar: ReactNode
  /** Email list panel */
  list: ReactNode
  /** Email detail / viewer panel */
  detail: ReactNode
  /** Whether a detail (email) is currently selected */
  hasSelection: boolean
  /** Optional className for the root element */
  className?: string
}

/**
 * Responsive 3-panel mail layout.
 *
 * - Desktop (lg+): sidebar | list | detail (3 columns)
 * - Tablet (md-lg): collapsible sidebar, list + detail side by side
 * - Mobile (<md): only one panel visible at a time (handled by parent show/hide)
 */
export function MailLayout({ sidebar, list, detail, hasSelection, className }: MailLayoutProps) {
  return (
    <div className={cn("flex-1 flex overflow-hidden bg-white dark:bg-gray-950", className)}>
      {/* Sidebar: hidden on mobile, shown on desktop */}
      <aside
        className="hidden lg:flex lg:w-56 xl:w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
        role="navigation"
        aria-label="Mail folders"
      >
        {sidebar}
      </aside>

      {/* Email list panel */}
      <section
        className={cn(
          "flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden",
          // On mobile: full width when no selection, hidden when selection
          hasSelection ? "hidden md:flex md:w-80 xl:w-96" : "flex flex-1 md:flex md:w-80 xl:w-96"
        )}
        role="region"
        aria-label="Email list"
      >
        {list}
      </section>

      {/* Email detail panel */}
      <section
        className={cn(
          "flex flex-col flex-1 overflow-hidden",
          // On mobile: full width when selection, hidden when no selection
          !hasSelection ? "hidden md:flex" : "flex"
        )}
        role="region"
        aria-label="Email content"
      >
        {detail}
      </section>
    </div>
  )
}

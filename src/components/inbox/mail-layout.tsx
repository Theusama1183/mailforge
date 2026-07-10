"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MailLayoutProps {
  list: ReactNode
  detail: ReactNode
  hasSelection: boolean
  className?: string
}

export function MailLayout({ list, detail, hasSelection, className }: MailLayoutProps) {
  return (
    <div className={cn("flex-1 flex overflow-hidden bg-white dark:bg-gray-950", className)}>
      <section
        className={cn(
          "flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden",
          hasSelection ? "hidden md:flex md:w-80 xl:w-96" : "flex flex-1 md:flex md:w-80 xl:w-96"
        )}
        role="region"
        aria-label="Email list"
      >
        {list}
      </section>

      <section
        className={cn(
          "flex flex-col flex-1 overflow-hidden",
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

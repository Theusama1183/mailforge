"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Inbox error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || "An unexpected error occurred while loading your inbox."}
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button onClick={() => window.location.href = "/inbox"} variant="outline">
          Reload page
        </Button>
      </div>
    </div>
  )
}

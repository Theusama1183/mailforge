"use client"

import { Reply, ReplyAll, Forward, Trash2, Archive, Star, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmailToolbarProps {
  onReply: () => void
  onReplyAll: () => void
  onForward: () => void
  onStar: () => void
  onDelete: () => void
  onArchive: () => void
  onBack: () => void
  isStarred: boolean
  className?: string
}

/**
 * Email detail toolbar with action buttons.
 * Proper icon spacing, hover states, and accessible labels.
 */
export function EmailToolbar({
  onReply,
  onReplyAll,
  onForward,
  onStar,
  onDelete,
  onArchive,
  onBack,
  isStarred,
  className,
}: EmailToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0",
        className
      )}
      role="toolbar"
      aria-label="Email actions"
    >
      {/* Back button (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="md:hidden h-8 w-8"
        aria-label="Back to email list"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 ml-auto sm:ml-0">
        {/* Action buttons with text labels */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReply}
          className="h-8 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Reply to sender"
        >
          <Reply className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Reply</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReplyAll}
          className="h-8 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Reply to all"
        >
          <ReplyAll className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Reply All</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onForward}
          className="h-8 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Forward email"
        >
          <Forward className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Forward</span>
        </Button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" aria-hidden="true" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onStar}
          className={cn(
            "h-8 w-8",
            isStarred
              ? "text-yellow-400 hover:text-yellow-500"
              : "text-gray-400 dark:text-gray-500 hover:text-yellow-400"
          )}
          aria-label={isStarred ? "Unstar email" : "Star email"}
        >
          <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onArchive}
          className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Archive email"
        >
          <Archive className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-red-500"
          aria-label="Delete email"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

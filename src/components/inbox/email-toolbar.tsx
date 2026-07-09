"use client"

import { Reply, ReplyAll, Forward, Trash2, Archive, Star, ArrowLeft, RefreshCw, Pin, BellOff, Tag } from "lucide-react"
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
  onResend?: () => void
  onPin?: () => void
  onSnooze?: () => void
  onLabel?: () => void
  isStarred: boolean
  isPinned?: boolean
  showResend?: boolean
  showLabelPicker?: boolean
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
  onResend,
  onPin,
  onSnooze,
  onLabel,
  isStarred,
  isPinned,
  showResend,
  showLabelPicker,
  className,
}: EmailToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-4 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0 sticky top-0 z-10",
        className
      )}
      role="toolbar"
      aria-label="Email actions"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-label="Back to email list"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" aria-hidden="true" />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReply}
          className="h-8 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5"
          aria-label="Reply to sender"
        >
          <Reply className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Reply</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReplyAll}
          className="h-8 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5"
          aria-label="Reply to all"
        >
          <ReplyAll className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Reply all</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onForward}
          className="h-8 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5"
          aria-label="Forward email"
        >
          <Forward className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Forward</span>
        </Button>
      </div>

      {showResend && onResend && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResend}
          className="h-8 gap-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950 px-2.5"
          aria-label="Resend email"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Resend</span>
        </Button>
      )}
      <div className="ml-auto flex items-center gap-0.5">
        {onPin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPin}
            className={cn(
              "h-8 w-8",
              isPinned
                ? "text-amber-500 hover:text-amber-600"
                : "text-gray-400 dark:text-gray-500 hover:text-amber-500"
            )}
            aria-label={isPinned ? "Unpin email" : "Pin email"}
          >
            <Pin className="h-4 w-4" fill={isPinned ? "currentColor" : "none"} />
          </Button>
        )}
        {onSnooze && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSnooze}
            className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-purple-500"
            aria-label="Snooze email"
          >
            <BellOff className="h-4 w-4" />
          </Button>
        )}
        {onLabel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLabel}
            className={cn(
              "h-8 w-8",
              showLabelPicker
                ? "text-blue-500"
                : "text-gray-400 dark:text-gray-500 hover:text-blue-500"
            )}
            aria-label="Manage labels"
          >
            <Tag className="h-4 w-4" />
          </Button>
        )}
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

"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Check, Archive, Trash2, MailOpen, Mail, RefreshCw, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

export type SelectType = "all" | "none" | "read" | "unread" | "starred" | "unstarred"

interface InboxToolbarProps {
  totalCount: number
  visibleCount: number
  selectedCount: number
  hasUnreadSelected: boolean
  page: number
  pageSize: number
  onSelect: (type: SelectType) => void
  onArchiveSelected: () => void
  onDeleteSelected: () => void
  onToggleReadSelected: () => void
  onRefresh: () => void
  onPrevPage?: () => void
  onNextPage?: () => void
}

export function InboxToolbar({
  totalCount,
  visibleCount,
  selectedCount,
  hasUnreadSelected,
  page,
  pageSize,
  onSelect,
  onArchiveSelected,
  onDeleteSelected,
  onToggleReadSelected,
  onRefresh,
  onPrevPage,
  onNextPage,
}: InboxToolbarProps) {
  const [showSelectDropdown, setShowSelectDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSelectDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isAllSelected = selectedCount === visibleCount && visibleCount > 0
  const isNoneSelected = selectedCount === 0
  const isIndeterminate = !isAllSelected && !isNoneSelected

  const handleCheckboxChange = () => {
    if (isAllSelected) {
      onSelect("none")
    } else {
      onSelect("all")
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10 min-h-[40px]">
      <div className="flex items-center gap-1">
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center">
            <button
              onClick={handleCheckboxChange}
              className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isAllSelected ? "Deselect all" : "Select all"}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isAllSelected
                    ? "bg-blue-500 border-blue-500"
                    : isIndeterminate
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 dark:border-gray-600"
                )}
              >
                {(isAllSelected || isIndeterminate) && (
                  <Check className={cn("h-3 w-3", "text-white")} />
                )}
              </div>
            </button>
            <button
              onClick={() => setShowSelectDropdown(!showSelectDropdown)}
              className="w-5 h-9 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Select options"
            >
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
          </div>

          {showSelectDropdown && (
            <div className="absolute top-full left-0 mt-0.5 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
              <DropdownItem label="All" onClick={() => { onSelect("all"); setShowSelectDropdown(false) }} />
              <DropdownItem label="None" onClick={() => { onSelect("none"); setShowSelectDropdown(false) }} />
              <DropdownItem label="Read" onClick={() => { onSelect("read"); setShowSelectDropdown(false) }} />
              <DropdownItem label="Unread" onClick={() => { onSelect("unread"); setShowSelectDropdown(false) }} />
              <DropdownItem label="Starred" onClick={() => { onSelect("starred"); setShowSelectDropdown(false) }} />
              <DropdownItem label="Unstarred" onClick={() => { onSelect("unstarred"); setShowSelectDropdown(false) }} />
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1 mr-2 whitespace-nowrap">
            {selectedCount} selected
          </span>
        )}

        {selectedCount > 0 && (
          <div className="flex items-center gap-0.5 ml-1">
            <ToolbarButton onClick={onArchiveSelected} icon={Archive} label="Archive" />
            <ToolbarButton onClick={onDeleteSelected} icon={Trash2} label="Delete" />
            <ToolbarButton
              onClick={onToggleReadSelected}
              icon={hasUnreadSelected ? MailOpen : Mail}
              label={hasUnreadSelected ? "Mark as read" : "Mark as unread"}
            />
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          </div>
        )}

        <ToolbarButton onClick={onRefresh} icon={RefreshCw} label="Refresh" />
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="whitespace-nowrap">
          {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
        </span>
        <button
          onClick={onPrevPage}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
          disabled={page === 0}
          aria-label="Newer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNextPage}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
          disabled={(page + 1) * pageSize >= totalCount}
          aria-label="Older"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function DropdownItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      {label}
    </button>
  )
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

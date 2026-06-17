"use client"

import { useWorkspace } from "@/components/workspace-provider"
import { Users } from "lucide-react"

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  const { activeWorkspace, workspaces } = useWorkspace()

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex items-center gap-3 min-w-0">
        {activeWorkspace && workspaces.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 shrink-0">
            <Users className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{activeWorkspace.name}</span>
          </div>
        )}
        {children}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-1 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

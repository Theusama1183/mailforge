"use client"

import { useEffect, useState, useRef } from "react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-provider"
import { Inbox, Send, Star, Archive, Trash2, FileText, AlertTriangle, Settings, LogOut, Compass, Moon, Sun, TrendingUp, LayoutTemplate, Users, Server, ChevronDown, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const folders = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "starred", label: "Starred", icon: Star },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "spam", label: "Spam", icon: AlertTriangle },
  { id: "trash", label: "Trash", icon: Trash2 },
]

export function Sidebar({
  currentFolder,
  onFolderChange,
  onCompose,
}: {
  currentFolder: string
  onFolderChange: (folder: string) => void
  onCompose: () => void
}) {
  const { theme, setTheme } = useTheme()
  const { workspaces, activeWorkspace, setWorkspaces, switchWorkspace } = useWorkspace()
  const [showWsDropdown, setShowWsDropdown] = useState(false)
  const [localUnread, setLocalUnread] = useState<Record<string, number>>({})
  const supabase = createClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch workspaces on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      fetch("/api/workspaces").then(res => res.json()).then(data => {
        setWorkspaces(Array.isArray(data) ? data : [])
      })
    })
  }, [supabase, setWorkspaces])

  // Fetch unread counts for all folders
  useEffect(() => {
    async function fetchUnreadCounts() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("emails")
          .select("folder, read, starred")
          .eq("user_id", user.id)
        if (data) {
          const counts: Record<string, number> = {}
          for (const email of data) {
            if (email.folder && !email.read) {
              counts[email.folder] = (counts[email.folder] || 0) + 1
            }
            if (email.starred) {
              counts.starred = (counts.starred || 0) + 1
            }
          }
          setLocalUnread(counts)
        }
      } catch {
        // Silently handle fetch errors
      }
    }
    fetchUnreadCounts()
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWsDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full select-none">
      {/* Brand + Workspace */}
      <div className="p-4 pb-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          MailForge
        </h1>
        {workspaces.length > 0 && (
          <div className="relative mt-3" ref={dropdownRef}>
            <button
              onClick={() => setShowWsDropdown(!showWsDropdown)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex-1 text-left truncate font-medium">
                {activeWorkspace?.name || "Select workspace"}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
            </button>
            {showWsDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto animate-in fade-in duration-100">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { switchWorkspace(ws.id); router.push(`/${ws.id}/inbox`); setShowWsDropdown(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      ws.id === activeWorkspace?.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === activeWorkspace?.id && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="px-3 py-2">
        <Button
          onClick={onCompose}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl py-5 shadow-sm hover:shadow-md transition-all duration-150"
        >
          <Compass className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Folder navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto" aria-label="Mail folders">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 pb-1">
          Mail
        </div>
        <div className="space-y-0.5">
          {folders.map((folder) => {
            const Icon = folder.icon
            const unread = localUnread[folder.id]
            const isActive = currentFolder === folder.id
            return (
              <Button
                key={folder.id}
                variant="ghost"
                onClick={() => onFolderChange(folder.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${folder.label}${unread ? ` (${unread} unread)` : ""}`}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal transition-all duration-150 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium shadow-sm border-l-[3px] border-l-blue-500 dark:border-l-blue-400 rounded-l-none"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 border-l-[3px] border-l-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{folder.label}</span>
                {unread !== undefined && unread > 0 && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none" aria-label={`${unread} unread`}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 pb-1">
          Workspace
        </div>
        <div className="space-y-0.5">
          <Button
            variant="ghost"
            onClick={() => onFolderChange("analytics")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onFolderChange("templates")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
          >
            <LayoutTemplate className="h-4 w-4 shrink-0" />
            <span>Templates</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onFolderChange("imap-sync")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
          >
            <Server className="h-4 w-4 shrink-0" />
            <span>IMAP Sync</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onFolderChange("workspaces")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Workspaces</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onFolderChange("settings")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Button>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
            suppressHydrationWarning
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

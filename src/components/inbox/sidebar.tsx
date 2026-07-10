"use client"

import { useEffect, useState, useRef } from "react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-provider"
import { Inbox, Send, Star, Archive, Trash2, FileText, AlertTriangle, Settings, LogOut, Compass, Moon, Sun, TrendingUp, LayoutTemplate, Users, Server, Contact2, ChevronDown, Check, Plus, FolderPlus, Tag, X, Palette, BarChart3, ShoppingBag, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CustomFolder {
  id: string
  name: string
  parent_id: string | null
  color: string
  icon: string
  sort_order: number
}

interface Label {
  id: string
  name: string
  color: string
}

const systemFolders = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "starred", label: "Starred", icon: Star },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "spam", label: "Spam", icon: AlertTriangle },
  { id: "trash", label: "Trash", icon: Trash2 },
]

const LABEL_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7", "#ec4899"]

function navItemClass(active: boolean) {
  return cn(
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm justify-start font-normal transition-colors",
    active
      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
  )
}

export function Sidebar({
  currentFolder,
  onFolderChange,
  onCompose,
  workspaceId,
  open,
  onClose,
}: {
  currentFolder: string
  onFolderChange: (folder: string) => void
  onCompose: () => void
  workspaceId?: string
  open?: boolean
  onClose?: () => void
}) {
  const { theme, setTheme } = useTheme()
  const { workspaces, activeWorkspace, setWorkspaces, switchWorkspace } = useWorkspace()
  const [showWsDropdown, setShowWsDropdown] = useState(false)
  const [localUnread, setLocalUnread] = useState<Record<string, number>>({})
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [showLabelForm, setShowLabelForm] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [folderColor, setFolderColor] = useState("#6366f1")
  const [labelName, setLabelName] = useState("")
  const [labelColor, setLabelColor] = useState("#6366f1")
  const supabase = createClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      fetch("/api/workspaces").then(res => res.json()).then(data => {
        setWorkspaces(Array.isArray(data) ? data : [])
      })
    })
  }, [supabase, setWorkspaces])

  useEffect(() => {
    async function fetchData() {
      try {
        const [foldersRes, labelsRes] = await Promise.all([
          fetch(`/api/folders${workspaceId ? `?workspace_id=${workspaceId}` : ""}`),
          fetch(`/api/labels${workspaceId ? `?workspace_id=${workspaceId}` : ""}`)
        ])
        if (foldersRes.ok) setCustomFolders(await foldersRes.json())
        if (labelsRes.ok) setLabels(await labelsRes.json())
      } catch {}
    }
    fetchData()
  }, [workspaceId])

  useEffect(() => {
    async function fetchUnreadCounts() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        let query = supabase.from("emails").select("folder, read, starred").eq("user_id", user.id)
        if (workspaceId) query = query.eq("workspace_id", workspaceId)
        const { data } = await query
        if (data) {
          const counts: Record<string, number> = {}
          for (const email of data) {
            if (email.folder && !email.read) counts[email.folder] = (counts[email.folder] || 0) + 1
            if (email.starred) counts.starred = (counts.starred || 0) + 1
          }
          setLocalUnread(counts)
        }
      } catch {}
    }
    fetchUnreadCounts()
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [supabase, workspaceId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowWsDropdown(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && onClose) onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEsc)
      return () => document.removeEventListener("keydown", handleEsc)
    }
  }, [open, onClose])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !workspaceId) return
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, name: folderName.trim(), color: folderColor }),
      })
      if (!res.ok) { toast.error("Failed to create folder"); return }
      const folder = await res.json()
      setCustomFolders(prev => [...prev, folder])
      setFolderName("")
      setFolderColor("#6366f1")
      setShowFolderForm(false)
      toast.success("Folder created")
    } catch { toast.error("Failed to create folder") }
  }

  const handleDeleteFolder = async (id: string) => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete folder"); return }
      setCustomFolders(prev => prev.filter(f => f.id !== id))
      toast.success("Folder deleted")
    } catch { toast.error("Failed to delete folder") }
  }

  const handleCreateLabel = async () => {
    if (!labelName.trim() || !workspaceId) return
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, name: labelName.trim(), color: labelColor }),
      })
      if (!res.ok) { toast.error("Failed to create label"); return }
      const label = await res.json()
      setLabels(prev => [...prev, label])
      setLabelName("")
      setLabelColor("#6366f1")
      setShowLabelForm(false)
      toast.success("Label created")
    } catch { toast.error("Failed to create label") }
  }

  const handleDeleteLabel = async (id: string) => {
    try {
      const res = await fetch(`/api/labels/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete label"); return }
      setLabels(prev => prev.filter(l => l.id !== id))
      toast.success("Label deleted")
    } catch { toast.error("Failed to delete label") }
  }

  const handleNav = (folder: string) => {
    onFolderChange(folder)
    if (onClose) onClose()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand + Workspace */}
      <div className="p-4 pb-2">
        {onClose && (
          <button onClick={onClose} className="lg:hidden absolute top-4 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">MailForge</h1>
        {workspaces.length > 0 && (
          <div className="relative mt-3" ref={dropdownRef}>
            <button
              onClick={() => setShowWsDropdown(!showWsDropdown)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex-1 text-left truncate font-medium">{activeWorkspace?.name || "Select workspace"}</span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
            </button>
            {showWsDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { switchWorkspace(ws.id); router.push(`/${ws.id}/inbox`); setShowWsDropdown(false); if (onClose) onClose() }}
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
        <Button onClick={onCompose} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl py-5 shadow-sm hover:shadow-md transition-all duration-150">
          <Compass className="h-4 w-4" /> Compose
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto" aria-label="Mail folders">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Mail</span>
        </div>
        <div className="space-y-0.5">
          {systemFolders.map((folder) => {
            const Icon = folder.icon
            const unread = localUnread[folder.id]
            const isActive = currentFolder === folder.id
            return (
              <button
                key={folder.id}
                onClick={() => handleNav(folder.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${folder.label}${unread ? ` (${unread} unread)` : ""}`}
                className={navItemClass(isActive)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{folder.label}</span>
                {unread !== undefined && unread > 0 && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Custom folders */}
        {customFolders.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Folders</span>
            </div>
            <div className="space-y-0.5">
              {customFolders.map((folder) => {
                const isActive = currentFolder === folder.id
                return (
                  <div key={folder.id} className="group flex items-center">
                    <button
                      onClick={() => handleNav(folder.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(navItemClass(isActive), "flex-1")}
                    >
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: folder.color }} />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 shrink-0 mr-1 transition-opacity"
                      title="Delete folder"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {workspaceId && (
          <button
            onClick={() => setShowFolderForm(!showFolderForm)}
            className="flex items-center gap-2 px-3 py-1.5 mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full transition-colors"
            aria-label="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </button>
        )}

        {showFolderForm && (
          <div className="px-3 py-2 mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <Input placeholder="Folder name" value={folderName} onChange={e => setFolderName(e.target.value)} className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && handleCreateFolder()} />
            <div className="flex items-center gap-1.5 flex-wrap">
              {LABEL_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFolderColor(c)}
                  className={`w-5 h-5 rounded-full border-2 ${folderColor === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleCreateFolder} className="text-xs h-7 flex-1">Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowFolderForm(false)} className="text-xs h-7">Cancel</Button>
            </div>
          </div>
        )}

        {/* Labels */}
        {labels.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Labels</span>
            </div>
            <div className="space-y-0.5">
              {labels.map((label) => (
                <div key={label.id} className="group flex items-center">
                  <button
                    onClick={() => handleNav(`label:${label.id}`)}
                    className={cn(navItemClass(false), "flex-1")}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                    <span className="flex-1 text-left truncate">{label.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 shrink-0 mr-1 transition-opacity"
                    title="Delete label"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {workspaceId && (
          <button
            onClick={() => setShowLabelForm(!showLabelForm)}
            className="flex items-center gap-2 px-3 py-1.5 mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full transition-colors"
            aria-label="New Label"
          >
            <Tag className="h-3.5 w-3.5" /> New Label
          </button>
        )}

        {showLabelForm && (
          <div className="px-3 py-2 mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <Input placeholder="Label name" value={labelName} onChange={e => setLabelName(e.target.value)} className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && handleCreateLabel()} />
            <div className="flex items-center gap-1.5 flex-wrap">
              {LABEL_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setLabelColor(c)}
                  className={`w-5 h-5 rounded-full border-2 ${labelColor === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleCreateLabel} className="text-xs h-7 flex-1">Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLabelForm(false)} className="text-xs h-7">Cancel</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <div className="space-y-0.5">
          {[
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "templates", label: "Templates", icon: LayoutTemplate },
            { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
            { id: "contacts", label: "Contacts", icon: Contact2 },
            { id: "ab-tests", label: "A/B Tests", icon: BarChart3 },
            { id: "imap-sync", label: "IMAP Sync", icon: Server },
            { id: "workspaces", label: "Workspaces", icon: Users },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => handleNav(item.id)} className={navItemClass(false)}>
                <Icon className="h-4 w-4 shrink-0" /> <span>{item.label}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={navItemClass(false)} suppressHydrationWarning>
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button onClick={handleSignOut} className={navItemClass(false)}>
            <LogOut className="h-4 w-4 shrink-0" /> <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )

  // Normalize open to always be a boolean for hydration stability
  const sidebarOpen = open ?? false

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      {/* Mobile overlay sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role={open !== undefined ? "navigation" : undefined}
        aria-label={open !== undefined ? "Mail folders" : undefined}
      >
        {sidebarContent}
      </div>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col h-full w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800" role={open !== undefined ? "navigation" : undefined} aria-label={open !== undefined ? "Mail folders" : undefined}>
        {sidebarContent}
      </div>
    </>
  )
}

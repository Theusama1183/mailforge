"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/inbox/sidebar"
import { useWorkspace } from "@/components/workspace-provider"
import { useEffect, useState } from "react"
import { Menu } from "lucide-react"

export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const segments = pathname.split("/").filter(Boolean)

  let currentFolder: string
  let currentWorkspaceId: string | null = null

  if (segments.length === 0) {
    currentFolder = "inbox"
  } else if (segments[0] === "workspaces") {
    currentFolder = "workspaces"
  } else {
    currentWorkspaceId = segments[0]
    currentFolder = segments[1] || "inbox"
  }

  useEffect(() => {
    if (segments.length === 0 && activeWorkspaceId) {
      router.replace(`/${activeWorkspaceId}/inbox`)
    }
  }, [pathname, activeWorkspaceId, router])

  const handleFolderChange = (folder: string) => {
    const routes: Record<string, string> = {
      inbox: "inbox",
      sent: "inbox?folder=sent",
      drafts: "inbox?folder=drafts",
      starred: "inbox?folder=starred",
      archive: "inbox?folder=archive",
      spam: "inbox?folder=spam",
      trash: "inbox?folder=trash",
      analytics: "analytics",
      templates: "templates",
      contacts: "contacts",
      "imap-sync": "imap-sync",
      workspaces: "workspaces",
      settings: "settings",
    }
    const route = routes[folder]
    if (!route) return

    if (folder === "workspaces") {
      router.push("/workspaces")
    } else {
      const wsId = currentWorkspaceId || activeWorkspaceId
      if (wsId) router.push(`/${wsId}/${route}`)
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        currentFolder={currentFolder}
        onFolderChange={handleFolderChange}
        onCompose={() => {
          const wsId = currentWorkspaceId || activeWorkspaceId
          if (wsId) router.push(`/${wsId}/inbox?compose=1`)
        }}
        workspaceId={currentWorkspaceId || activeWorkspaceId || undefined}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-2 px-4 h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}

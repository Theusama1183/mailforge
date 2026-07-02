"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/inbox/sidebar"
import { useWorkspace } from "@/components/workspace-provider"
import { useEffect } from "react"

export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()

  // Parse pathname to extract workspaceId and current folder
  const segments = pathname.split("/").filter(Boolean)

  let currentFolder: string
  let currentWorkspaceId: string | null = null

  if (segments.length === 0) {
    // Root path `/`
    currentFolder = "inbox"
  } else if (segments[0] === "workspaces") {
    currentFolder = "workspaces"
  } else {
    // Workspace-scoped route: /{workspaceId}/{folder?}
    currentWorkspaceId = segments[0]
    currentFolder = segments[1] || "inbox"
  }

  // Redirect root `/` to default workspace inbox
  useEffect(() => {
    if (segments.length === 0 && activeWorkspaceId) {
      router.replace(`/${activeWorkspaceId}/inbox`)
    }
  }, [segments.length, activeWorkspaceId, router])

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
      if (wsId) {
        router.push(`/${wsId}/${route}`)
      }
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
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}

"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface Workspace {
  id: string
  name: string
  role: string
}

interface WorkspaceContextValue {
  activeWorkspaceId: string | null
  activeWorkspace: Workspace | null
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  switchWorkspace: (id: string | null) => void
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeWorkspaceId: null,
  activeWorkspace: null,
  workspaces: [],
  setWorkspaces: () => {},
  switchWorkspace: () => {},
  loading: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("mailforge_active_workspace")
    if (stored) {
      setActiveWorkspaceId(stored)
    }
    setInitialized(true)
    setLoading(false)
  }, [])

  // Persist to localStorage AND set a cookie for middleware redirects
  useEffect(() => {
    if (!initialized) return
    if (activeWorkspaceId) {
      localStorage.setItem("mailforge_active_workspace", activeWorkspaceId)
      document.cookie = `mailforge_active_workspace=${activeWorkspaceId}; path=/; max-age=31536000; SameSite=Lax`
    } else {
      localStorage.removeItem("mailforge_active_workspace")
      document.cookie = "mailforge_active_workspace=; path=/; max-age=0"
    }
  }, [activeWorkspaceId, initialized])

  const switchWorkspace = useCallback((id: string | null) => {
    setActiveWorkspaceId(id)
  }, [])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!initialized) return
    if (!activeWorkspaceId && workspaces.length > 0) {
      setActiveWorkspaceId(workspaces[0].id)
    }
  }, [workspaces, activeWorkspaceId, initialized])

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        activeWorkspace,
        workspaces,
        setWorkspaces,
        switchWorkspace,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider")
  return ctx
}

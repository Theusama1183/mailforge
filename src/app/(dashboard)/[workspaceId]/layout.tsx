"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/components/workspace-provider"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { activeWorkspaceId, switchWorkspace, workspaces, setWorkspaces } = useWorkspace()
  const [authorized, setAuthorized] = useState(false)

  const workspaceId = params?.workspaceId as string

  useEffect(() => {
    async function validate() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // If workspaces aren't loaded yet, fetch them
      let currentWorkspaces = workspaces
      if (currentWorkspaces.length === 0) {
        try {
          const res = await fetch("/api/workspaces")
          const data = await res.json()
          setWorkspaces(data || [])
          currentWorkspaces = data || []
        } catch {
          router.push("/workspaces")
          return
        }
      }

      // Check if user has access to this workspace
      const hasAccess = currentWorkspaces.some((w) => w.id === workspaceId)
      if (!hasAccess) {
        // No access — redirect to first available workspace or workspaces page
        if (currentWorkspaces.length > 0) {
          router.replace(`/${currentWorkspaces[0].id}/inbox`)
        } else {
          router.replace("/workspaces")
        }
        return
      }

      // Set active workspace in context
      if (workspaceId !== activeWorkspaceId) {
        switchWorkspace(workspaceId)
      }
      setAuthorized(true)
    }

    if (workspaceId) {
      validate()
    }
  }, [workspaceId, supabase, router, workspaces, setWorkspaces, switchWorkspace, activeWorkspaceId])

  if (!authorized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}

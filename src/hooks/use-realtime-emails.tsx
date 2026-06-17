"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

/**
 * Subscribes to Supabase Realtime INSERT events on the `emails` table.
 * Calls onNewEmail whenever a new email arrives.
 * Shows a toast notification when new emails are detected.
 */
export function useRealtimeEmails(
  onNewEmail: () => void,
  enabled: boolean = true
) {
  const onNewEmailRef = useRef(onNewEmail)
  onNewEmailRef.current = onNewEmail

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const channel = supabase
      .channel("emails-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emails",
        },
        (payload: RealtimePostgresChangesPayload<{ subject?: string }>) => {
          const newEmail = payload.new as { subject?: string } | undefined
          toast("New email received", {
            description: newEmail?.subject || "Received in inbox",
            icon: <Mail className="h-4 w-4 text-blue-500" />,
          })
          onNewEmailRef.current()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled])
}

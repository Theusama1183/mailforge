"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { createClient } from "@/lib/supabase/client"
import { EmailViewer } from "@/components/inbox/email-viewer"
import { ThreadConversation } from "@/components/inbox/thread-conversation"
import { ComposeDialog } from "@/components/compose/compose-dialog"
import { ArrowLeft, Mail, Pin, BellOff, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Email } from "@/types"
import { decodeMimeSubject } from "@/lib/email-utils"

type ComposeMode = "reply" | "replyAll" | "forward"

function buildReplyBody(email: Email, mode: ComposeMode): string {
  const date = email.created_at
    ? new Date(email.created_at).toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : ""

  if (mode === "forward") {
    if (email.body_html) {
      return (
        `<br><br>---------- Forwarded message ---------<br>` +
        `<b>From:</b> ${email.from_name || email.from_address}<br>` +
        `<b>Date:</b> ${date}<br>` +
        `<b>Subject:</b> ${email.subject || ""}<br>` +
        `<b>To:</b> ${(email.to_addresses || []).join(", ")}<br><br>` +
        email.body_html
      )
    }
    return (
      `\n\n---------- Forwarded message ---------\n` +
      `From: ${email.from_name || email.from_address}\n` +
      `Date: ${date}\n` +
      `Subject: ${email.subject || ""}\n` +
      `To: ${(email.to_addresses || []).join(", ")}\n\n` +
      (email.body_text || "")
    )
  }

  if (email.body_html) {
    return (
      `<br><br>` +
      `<blockquote style="border-left:2px solid #ccc;padding-left:8px;margin:4px 0 0;color:#555;font-size:inherit;">` +
      `On ${date}, ${email.from_name || email.from_address} wrote:<br><br>` +
      email.body_html +
      `</blockquote>`
    )
  }

  return (
    `\n\nOn ${date}, ${email.from_name || email.from_address} wrote:\n` +
    `> ${(email.body_text || "").split("\n").join("\n> ")}`
  )
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const emailId = params.emailId as string
  const supabase = createClient()

  const [email, setEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>("reply")
  const [threadEmails, setThreadEmails] = useState<Email[]>([])
  const [fromAddresses, setFromAddresses] = useState<
    { local_part: string; domain: string; full: string }[]
  >([])
  const [emailLabels, setEmailLabels] = useState<{ id: string; name: string; color: string }[]>([])
  const [allLabels, setAllLabels] = useState<{ id: string; name: string; color: string }[]>([])
  const [showLabelPicker, setShowLabelPicker] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("emails")
          .select("*")
          .eq("id", emailId)
          .single()

        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setEmail(data as Email)

        // Mark as read
        if (!data.read) {
          await supabase.from("emails").update({ read: true }).eq("id", emailId)
          setEmail((prev) => (prev ? { ...prev, read: true } : null))
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()

    // Fetch labels
    const loadLabels = async () => {
      try {
        const res1 = await window.fetch(`/api/emails/${emailId}/labels`)
        if (res1.ok) { const data = await res1.json(); if (Array.isArray(data)) setEmailLabels(data) }
      } catch {}
      try {
        const res2 = await window.fetch("/api/labels")
        if (res2.ok) { const data = await res2.json(); if (Array.isArray(data)) setAllLabels(data) }
      } catch {}
    }
    loadLabels()
  }, [emailId, supabase])

  // Fetch thread siblings
  useEffect(() => {
    if (!emailId) return
    const fetchThread = async () => {
      try {
        const res = await fetch(`/api/emails/${emailId}/thread`)
        if (res.ok) {
          const data = await res.json()
          setThreadEmails(data.emails || [])
        }
      } catch {
        // Thread fetch is non-critical
      }
    }
    fetchThread()
  }, [emailId])

  // Fetch from addresses
  useEffect(() => {
    if (!workspaceId) return
    const fetchAddresses = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/emails`)
        if (res.ok) {
          const data = await res.json()
          setFromAddresses(
            (data || []).map((e: any) => ({
              local_part: e.local_part,
              domain: e.domains?.domain || "",
              full: `${e.local_part}@${e.domains?.domain || ""}`,
            }))
          )
        }
      } catch {}
    }
    fetchAddresses()
  }, [workspaceId])

  const handleSend = useCallback(
    async (data: {
      to: string[]
      cc: string[]
      bcc: string[]
      subject: string
      body: string
      textBody?: string
      fromAddress: string
      attachments?: { filename: string; content: string }[]
      inReplyTo?: string; priority?: "low" | "normal" | "high"; readReceipt?: boolean
    }) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const res = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, workspaceId, userId: user.id }),
        })

        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || "Failed to send")
          return
        }
        const { id } = await res.json()

        setShowCompose(false)

        let cancelled = false
        const timer = setTimeout(async () => {
          if (!cancelled) {
            try {
              await fetch(`/api/send/confirm/${id}`, { method: "POST" })
            } catch {}
          }
        }, 10000)

        toast("Message sent", {
          description: "Undo available (10s)",
          action: {
            label: "Undo",
            onClick: async () => {
              cancelled = true
              clearTimeout(timer)
              await fetch(`/api/send/cancel/${id}`, { method: "DELETE" })
              toast("Message unsent")
            },
          },
        })
      } catch (err) {
        console.error("Error sending:", err)
        toast.error("Failed to send email")
      }
    },
    [supabase]
  )

  const handleStar = useCallback(
    async (id: string, starred: boolean) => {
      await supabase.from("emails").update({ starred }).eq("id", id)
      setEmail((prev) => (prev && prev.id === id ? { ...prev, starred } : prev))
    },
    [supabase]
  )

  const handleDelete = useCallback(async () => {
    if (!email) return
    await supabase.from("emails").update({ folder: "trash" }).eq("id", email.id)
    router.push(`/${workspaceId}/inbox`)
  }, [email, supabase, router, workspaceId])

  const handleArchive = useCallback(async () => {
    if (!email) return
    await supabase.from("emails").update({ folder: "archive" }).eq("id", email.id)
    router.push(`/${workspaceId}/inbox`)
  }, [email, supabase, router, workspaceId])

  const handlePin = useCallback(async () => {
    if (!email) return
    const newPinned = !email.pinned
    await supabase.from("emails").update({ pinned: newPinned }).eq("id", email.id)
    setEmail(prev => prev ? { ...prev, pinned: newPinned } : null)
    toast.success(newPinned ? "Pinned" : "Unpinned")
  }, [email, supabase])

  const handleSnooze = useCallback(async (until: string | null) => {
    if (!email) return
    await supabase.from("emails").update({ snoozed_until: until }).eq("id", email.id)
    setEmail(prev => prev ? { ...prev, snoozed_until: until } : null)
    if (until) {
      toast.success("Snoozed until " + new Date(until).toLocaleString())
      router.push(`/${workspaceId}/inbox`)
    }
  }, [email, supabase, router, workspaceId])

  const handleToggleLabel = useCallback(async (labelId: string) => {
    if (!email) return
    const hasLabel = emailLabels.some(l => l.id === labelId)
    const res = await fetch(`/api/emails/${email.id}/labels`, {
      method: hasLabel ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelIds: [labelId] }),
    })
    if (res.ok) {
      const updated = await fetch(`/api/emails/${email.id}/labels`).then(r => r.json())
      if (Array.isArray(updated)) setEmailLabels(updated)
    }
  }, [email, emailLabels])

  const handleResend = useCallback(async () => {
    if (!email) return
    try {
      const res = await fetch(`/api/emails/${email.id}/resend`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to resend")
        return
      }
      toast.success("Email queued for resend")
    } catch {
      toast.error("Failed to resend email")
    }
  }, [email])

  // Keyboard shortcuts (must be before early returns — Rules of Hooks)
  const shortcuts = useMemo(
    () => ({
      r: () => {
        setComposeMode("reply")
        setShowCompose(true)
      },
      a: () => {
        setComposeMode("replyAll")
        setShowCompose(true)
      },
      f: () => {
        setComposeMode("forward")
        setShowCompose(true)
      },
      Escape: () => router.push(`/${workspaceId}/inbox`),
    }),
    [router, workspaceId]
  )
  useKeyboardShortcuts(shortcuts)

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-4 max-w-3xl mx-auto w-full">
          <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3.5 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
            <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-5/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-4/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <Mail className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email not found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This email may have been deleted</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${workspaceId}/inbox`)}
            className="mt-4"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to inbox
          </Button>
        </div>
      </div>
    )
  }

  const replyBody = buildReplyBody(email, composeMode)

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
        <EmailViewer
          email={email}
          onReply={() => {
            setComposeMode("reply")
            setShowCompose(true)
          }}
          onReplyAll={() => {
            setComposeMode("replyAll")
            setShowCompose(true)
          }}
          onForward={() => {
            setComposeMode("forward")
            setShowCompose(true)
          }}
          onBack={() => router.push(`/${workspaceId}/inbox`)}
          onStar={() => handleStar(email.id, !email.starred)}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onResend={handleResend}
          onPin={handlePin}
          onSnooze={() => {
            const options = [
              { label: "Later today", getValue: () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.toISOString() }},
              { label: "Tomorrow", getValue: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString() }},
              { label: "This weekend", getValue: () => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(9, 0, 0, 0); return d.toISOString() }},
              { label: "Next week", getValue: () => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay() + 1)); d.setHours(9, 0, 0, 0); return d.toISOString() }},
            ]
            toast("Snooze until...", {
              description: (
                <div className="flex flex-col gap-1 mt-1">
                  {options.map(opt => (
                    <button
                      key={opt.label}
                      className="text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                      onClick={() => handleSnooze(opt.getValue())}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    className="text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-500"
                    onClick={() => handleSnooze(null)}
                  >
                    Remove snooze
                  </button>
                </div>
              ) as any,
              duration: 10000,
            })
          }}
          onLabel={() => setShowLabelPicker(!showLabelPicker)}
          labels={emailLabels}
          showLabelPicker={showLabelPicker}
        />

        <ThreadConversation
          threadEmails={threadEmails}
          currentEmailId={email.id}
        />

        {/* Label picker overlay */}
        {showLabelPicker && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Labels</p>
            <div className="flex flex-wrap gap-2">
              {allLabels.map(label => {
                const isActive = emailLabels.some(l => l.id === label.id)
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: label.color + "20",
                      color: label.color,
                      "--tw-ring-color": isActive ? label.color : undefined,
                    } as React.CSSProperties}
                  >
                    {label.name}
                  </button>
                )
              })}
              {allLabels.length === 0 && (
                <p className="text-xs text-gray-400">No labels yet. Create them in the sidebar.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <ComposeDialog
        open={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSend}
        fromAddresses={fromAddresses}
        workspaceId={workspaceId}
        replyTo={{
          id: email.id,
          to:
            composeMode === "forward"
              ? ""
              : composeMode === "replyAll"
                ? [email.from_address, ...(email.cc_addresses || [])].join(", ")
                : email.from_address,
          subject: email.subject || "",
          body: replyBody,
          mode: composeMode,
        }}
        key={showCompose ? `reply-${email.id}-${composeMode}` : "closed"}
      />
    </>
  )
}

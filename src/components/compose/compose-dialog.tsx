"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { RichEditor } from "./rich-editor"
import { createClient } from "@/lib/supabase/client"
import { X, Minus, Send, Paperclip, FileText, LayoutTemplate } from "lucide-react"

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
  "application/zip", "application/gzip",
]

interface FromAddress {
  local_part: string
  domain: string
  full: string
}

interface Attachment {
  filename: string
  content: string
}

interface ReplyToData {
  to: string
  subject: string
  body: string
  mode?: "reply" | "replyAll" | "forward" | "new"
}

interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
}

export function ComposeDialog({
  open,
  onClose,
  onSend,
  fromAddresses = [],
  replyTo,
}: {
  open: boolean
  onClose: () => void
  onSend: (data: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; fromAddress: string; attachments?: Attachment[]; inReplyTo?: string }) => void
  fromAddresses?: FromAddress[]
  replyTo?: ReplyToData
}) {
  const [fromIndex, setFromIndex] = useState(0)
  const [to, setTo] = useState(replyTo?.to || "")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [subject, setSubject] = useState(
    replyTo?.mode === "forward"
      ? `Fwd: ${replyTo.subject}`
      : replyTo?.mode === "reply" || replyTo?.mode === "replyAll"
      ? `Re: ${replyTo.subject}`
      : ""
  )
  const [bodyHtml, setBodyHtml] = useState("")
  const [bodyText, setBodyText] = useState(
    replyTo?.mode === "forward"
      ? `\n\n---------- Forwarded message ---------\n${replyTo.body}`
      : replyTo?.body
      ? `\n\n---\n${replyTo.body}`
      : ""
  )
  const [minimized, setMinimized] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showRichText, setShowRichText] = useState(true)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from("templates").select("id, name, subject, body_html, body_text").eq("user_id", user.id).then(({ data }) => {
        setTemplates(data || [])
      })
    })
  }, [open])

  // Focus trap: keep focus within the dialog when open
  useEffect(() => {
    if (!open || minimized) return

    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus the first focusable element
    const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector)
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      const focusable = dialog.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    dialog.addEventListener("keydown", handleKeyDown)

    return () => {
      dialog.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, minimized])

  function insertTemplate(t: Template) {
    if (t.subject) setSubject(t.subject)
    if (t.body_text) setBodyText(t.body_text)
    if (t.body_html) {
      setBodyHtml(t.body_html)
      setShowRichText(false)
    }
    setShowTemplates(false)
  }

  if (!open) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachmentError(null)

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setAttachmentError(`"${file.name}" exceeds the 25MB size limit`)
        continue
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== "") {
        setAttachmentError(`"${file.name}" has an unsupported file type`)
        continue
      }

      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      setAttachments(prev => [...prev, { filename: file.name, content }])
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (i: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await onSend({
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        cc: showCc ? cc.split(",").map((s) => s.trim()).filter(Boolean) : [],
        bcc: showBcc ? bcc.split(",").map((s) => s.trim()).filter(Boolean) : [],
        subject,
        body: bodyHtml || bodyText,
        fromAddress: fromAddresses[fromIndex]?.full || "",
        attachments: attachments.length > 0 ? attachments : undefined,
        inReplyTo: replyTo?.mode === "reply" || replyTo?.mode === "replyAll" ? replyTo.subject : undefined,
      })
    } finally {
      setSending(false)
    }
  }

  const handleEditorChange = useCallback((html: string, text: string) => {
    setBodyHtml(html)
    setBodyText(text)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData("text/html")
    if (html && /<(table|div|style|img|hr|center|font|span)[^>]*>/i.test(html)) {
      e.preventDefault()
      e.stopPropagation()
      setBodyHtml(html)
      setBodyText(e.clipboardData.getData("text/plain") || html.replace(/<[^>]*>/g, ""))
      setShowRichText(false)
    }
  }, [])

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-6 z-50">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-lg shadow-lg w-80">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-t-lg cursor-pointer" onClick={() => setMinimized(false)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setMinimized(false) }} aria-label="Maximize compose window">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{subject || "New Message"}</span>
            <button onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="Discard draft"><X className="h-4 w-4 text-gray-400" /></button>
          </div>
        </div>
      </div>
    )
  }

  const modeLabel = replyTo?.mode === "forward" ? "Fwd" : replyTo?.mode === "reply" || replyTo?.mode === "replyAll" ? "Reply" : "New Message"

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Compose email"
      className="fixed bottom-0 right-6 z-50 w-[560px] max-w-[calc(100vw-2rem)]"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-xl shadow-2xl" onPaste={handlePaste}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-t-xl border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{modeLabel}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(true)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" aria-label="Minimize compose window"><Minus className="h-3.5 w-3.5 text-gray-500" /></button>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" aria-label="Close and discard draft"><X className="h-3.5 w-3.5 text-gray-500" /></button>
          </div>
        </div>

        <div className="px-4 py-2 space-y-3">
          {fromAddresses.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="compose-from" className="text-xs font-medium text-gray-500 w-8">From</label>
              <Select
                id="compose-from"
                value={String(fromIndex)}
                onChange={(e) => setFromIndex(Number(e.target.value))}
                className="flex-1 border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm focus:ring-0 bg-transparent"
              >
                {fromAddresses.map((addr, i) => (
                  <option key={addr.full} value={String(i)}>{addr.full}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label htmlFor="compose-to" className="text-xs font-medium text-gray-500 w-8">To</label>
            <Input
              id="compose-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              className="border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm focus:ring-0"
            />
            <div className="flex gap-2 shrink-0">
              {!showCc && <Button variant="ghost" size="sm" onClick={() => setShowCc(true)} className="text-xs text-blue-600 hover:text-blue-700 h-auto px-1" aria-label="Add Cc field">Cc</Button>}
              {!showBcc && <Button variant="ghost" size="sm" onClick={() => setShowBcc(true)} className="text-xs text-blue-600 hover:text-blue-700 h-auto px-1" aria-label="Add Bcc field">Bcc</Button>}
            </div>
          </div>

          {showCc && (
            <div className="flex items-center gap-2">
              <label htmlFor="compose-cc" className="text-xs font-medium text-gray-500 w-8">Cc</label>
              <Input id="compose-cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Cc recipients" className="border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm focus:ring-0" />
            </div>
          )}

          {showBcc && (
            <div className="flex items-center gap-2">
              <label htmlFor="compose-bcc" className="text-xs font-medium text-gray-500 w-8">Bcc</label>
              <Input id="compose-bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="Bcc recipients" className="border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm focus:ring-0" />
            </div>
          )}

          <label htmlFor="compose-subject" className="sr-only">Subject</label>
          <Input id="compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm font-medium focus:ring-0" />

          {showRichText ? (
            <RichEditor value={bodyText} onChange={handleEditorChange} placeholder="Write your message..." />
          ) : bodyHtml ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500">HTML Template</span>
                <button
                  type="button"
                  onClick={() => { setShowRichText(true); setBodyHtml("") }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Edit as Rich Text
                </button>
              </div>
              <div
                ref={editorRef}
                className="p-3 max-h-[300px] overflow-y-auto text-sm"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          ) : null}

          {attachmentError && (
            <p className="text-xs text-red-500" role="alert">{attachmentError}</p>
          )}

          {attachments.length > 0 && (
            <div className="space-y-1" role="list" aria-label="File attachments">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-sm" role="listitem">
                  <FileText className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  <span className="flex-1 truncate text-gray-600 dark:text-gray-400">{att.filename}</span>
                  <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500" aria-label={`Remove attachment ${att.filename}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button onClick={handleSend} disabled={sending || !to.trim()} className="gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60" aria-label="Send email">
              {sending ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {sending ? "Sending..." : "Send"}
            </Button>
            <Button variant="ghost" size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.gz" />
            {templates.length > 0 && (
              <div className="relative">
                <Button variant="ghost" size="icon"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Insert template"
                  aria-expanded={showTemplates}
                >
                  <LayoutTemplate className="h-4 w-4" />
                </Button>
                {showTemplates && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} aria-hidden="true" />
                    <div className="absolute bottom-full left-0 mb-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto" role="listbox" aria-label="Select a template">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => insertTemplate(t)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 truncate"
                          role="option"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400">
            Discard
          </Button>
        </div>
      </div>
    </div>
  )
}

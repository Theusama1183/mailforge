"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { RichEditor } from "./rich-editor"
import { ContactAutocomplete } from "./contact-autocomplete"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { X, Minus, Send, Paperclip, FileText, Mail, LayoutTemplate, Flag, Check, Signature } from "lucide-react"

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024
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
  id?: string
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

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{(\w+)\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))]
}

export function ComposeDialog({
  open,
  onClose,
  onSend,
  fromAddresses = [],
  replyTo,
  workspaceId,
}: {
  open: boolean
  onClose: () => void
  onSend: (data: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; textBody?: string; fromAddress: string; attachments?: Attachment[]; inReplyTo?: string; priority?: "low" | "normal" | "high"; readReceipt?: boolean }) => void
  fromAddresses?: FromAddress[]
  replyTo?: ReplyToData
  workspaceId?: string
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
  const [bodyHtml, setBodyHtml] = useState(
    replyTo?.body && replyTo.body.trim().startsWith("<") ? replyTo.body : ""
  )
  const [templateHtml, setTemplateHtml] = useState("")
  const [bodyText, setBodyText] = useState(
    replyTo?.body
      ? replyTo.body.trim().startsWith("<")
        ? replyTo.body
        : replyTo.mode === "forward"
          ? `\n\n---------- Forwarded message ---------\n${replyTo.body}`
          : `\n\n---\n${replyTo.body}`
      : ""
  )
  const [minimized, setMinimized] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [showTemplates, setShowTemplates] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedHtml, setEditedHtml] = useState("")
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal")
  const [requestReadReceipt, setRequestReadReceipt] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [signatures, setSignatures] = useState<{ id: string; name: string; content: string; is_default: boolean }[]>([])
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null)
  const [showSignatures, setShowSignatures] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevDraftKeyRef = useRef("")

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      Promise.all([
        supabase.from("templates").select("id, name, subject, body_html, body_text").eq("user_id", user.id),
        supabase.from("user_signatures").select("id, name, content, is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
      ]).then(([templatesResult, signaturesResult]) => {
        setTemplates(templatesResult.data || [])
        const sigs = signaturesResult.data || []
        setSignatures(sigs)
        const defaultSig = sigs.find(s => s.is_default)
        if (defaultSig) setSelectedSignatureId(defaultSig.id)
      })
    })
  }, [open])

  useEffect(() => {
    if (!isEditing || !contentRef.current) return
    const root = contentRef.current
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    const handler = (e: Event) => {
      const ke = e as KeyboardEvent
      if ((ke.ctrlKey || ke.metaKey) && ["b", "i", "u", "s", "j"].includes(ke.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    const pasteHandler = (e: ClipboardEvent) => {
      e.preventDefault()
      const text = e.clipboardData?.getData("text/plain") || ""
      document.execCommand("insertText", false, text)
    }
    while (walker.nextNode()) {
      const node = walker.currentNode as HTMLElement
      if (node === root) continue
      const hasText = !node.hasChildNodes() || (node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE)
      if (hasText && node.textContent?.trim()) {
        node.contentEditable = "true"
        node.addEventListener("keydown", handler)
        node.addEventListener("paste", pasteHandler)
      } else {
        node.contentEditable = "false"
      }
    }
    return () => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
      while (w.nextNode()) {
        const n = w.currentNode as HTMLElement
        n.removeEventListener("keydown", handler)
        n.removeEventListener("paste", pasteHandler)
      }
    }
  }, [isEditing])

  // Auto-save draft to localStorage
  const DRAFT_KEY = useMemo(() => {
    if (!fromAddresses.length) return ""
    const addr = fromAddresses[fromIndex]?.full || "draft"
    return `mailforge_draft_${addr}_${replyTo?.mode || "new"}`
  }, [fromAddresses, fromIndex, replyTo])

  useEffect(() => {
    if (prevDraftKeyRef.current && prevDraftKeyRef.current !== DRAFT_KEY) {
      try { localStorage.removeItem(prevDraftKeyRef.current) } catch {}
    }
    prevDraftKeyRef.current = DRAFT_KEY
  }, [DRAFT_KEY])

  useEffect(() => {
    if (!open) return
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.timestamp && Date.now() - draft.timestamp < 3600000) {
          if (draft.to) setTo(draft.to)
          if (draft.cc) { setCc(draft.cc); if (draft.cc) setShowCc(true) }
          if (draft.bcc) { setBcc(draft.bcc); if (draft.bcc) setShowBcc(true) }
          if (draft.subject) setSubject(draft.subject)
          if (draft.bodyHtml) { setBodyHtml(draft.bodyHtml); setEditedHtml(draft.bodyHtml) }
          if (draft.bodyText) setBodyText(draft.bodyText)
          if (draft.priority) setPriority(draft.priority)
          if (draft.readReceipt) setRequestReadReceipt(draft.readReceipt)
          if (draft.templateHtml) { setTemplateHtml(draft.templateHtml); if (draft.isEditing) setIsEditing(true) }
        }
      }
    } catch {}
  }, [open, DRAFT_KEY])

  useEffect(() => {
    if (!open || minimized || sending) return
    const interval = setInterval(() => {
      try {
        const draft = {
          to, cc: showCc ? cc : "", bcc: showBcc ? bcc : "",
          subject, bodyHtml, bodyText, priority, readReceipt: requestReadReceipt,
          templateHtml: templateHtml || "", isEditing,
          timestamp: Date.now(),
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      } catch {}
      if (to || subject || bodyHtml) {
        fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draftId,
            to: to ? to.split(",").map(s => s.trim()).filter(Boolean) : [],
            cc: showCc && cc ? cc.split(",").map(s => s.trim()).filter(Boolean) : [],
            bcc: showBcc && bcc ? bcc.split(",").map(s => s.trim()).filter(Boolean) : [],
            subject,
            body: bodyHtml,
            textBody: bodyText,
            fromAddress: fromAddresses[fromIndex]?.full || "",
          }),
        }).then(res => {
          if (res.ok) res.json().then(d => { if (!draftId && d.id) setDraftId(d.id) })
        }).catch(() => {})
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [open, minimized, sending, to, cc, showCc, bcc, showBcc, subject, bodyHtml, bodyText, priority, requestReadReceipt, DRAFT_KEY, draftId, fromAddresses, fromIndex])

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  useEffect(() => {
    if (!open || minimized) return

    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const previouslyFocused = document.activeElement as HTMLElement

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

  function insertSignature(sigId: string) {
    setShowSignatures(false)
    setSelectedSignatureId(sigId === selectedSignatureId ? null : sigId)
    const sig = signatures.find(s => s.id === sigId)
    if (!sig || !sig.content) return
    const sigHtml = `<br><br>--<br>${sig.content}`
    if (bodyHtml.includes("--<br>")) {
      const withoutSig = bodyHtml.replace(/<br><br>--<br>[\s\S]*$/, "")
      setBodyHtml(withoutSig + sigHtml)
      setBodyText((bodyText || "").replace(/\n\n--[\s\S]*$/, "") + "\n\n--\n" + sig.content.replace(/<[^>]+>/g, ""))
    } else {
      setBodyHtml(bodyHtml + sigHtml)
      setBodyText((bodyText || "") + "\n\n--\n" + sig.content.replace(/<[^>]+>/g, ""))
    }
  }

  function handleTemplateSelect(templateId: string) {
    setShowTemplates(false)
    const t = templates.find((tmpl) => tmpl.id === templateId)
    if (!t) return

    if (t.subject) setSubject(t.subject)

    const contentMatch = t.body_html?.match(/{{(?:content|body)}}([\s\S]*?){{\/(?:content|body)}}/)?.[1]
    if (contentMatch) {
      setTemplateHtml(t.body_html)
      setBodyHtml(t.body_html)
      setBodyText(contentMatch.trim())
    } else if (t.body_html) {
      setTemplateHtml(t.body_html)
      setBodyHtml(t.body_html)
      setBodyText(t.body_text || "")
    } else {
      setBodyText(t.body_text || "")
    }

    setIsEditing(false)
    setEditedHtml(t.body_html || "")

    const allText = `${t.subject || ""} ${t.body_text || ""} ${t.body_html || ""}`
    const placeholders = extractPlaceholders(allText)
    const values: Record<string, string> = {}
    for (const p of placeholders) {
      values[p] = ""
    }
    setPlaceholderValues(values)
  }

  function replacePlaceholders(text: string): string {
    let result = text
    for (const [key, value] of Object.entries(placeholderValues)) {
      if (value) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
      }
    }
    return result
  }

  const placeholders = useMemo(() => {
    const allText = subject + " " + bodyText + " " + bodyHtml + " " + templateHtml
    return extractPlaceholders(allText)
  }, [subject, bodyText, bodyHtml, templateHtml])

  if (!open) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachmentError(null)

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setAttachmentError(`"${file.name}" exceeds the 25MB size limit`)
        continue
      }

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
      const finalSubject = replacePlaceholders(subject)
      const htmlContent = isEditing
        ? (contentRef.current?.innerHTML || editedHtml)
        : editedHtml
      const finalBody = templateHtml
        ? replacePlaceholders(htmlContent || templateHtml)
        : replacePlaceholders(bodyHtml || bodyText)
      const textContent = isEditing
        ? (contentRef.current?.textContent || bodyText)
        : bodyText
      await onSend({
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        cc: showCc ? cc.split(",").map((s) => s.trim()).filter(Boolean) : [],
        bcc: showBcc ? bcc.split(",").map((s) => s.trim()).filter(Boolean) : [],
        subject: finalSubject,
        body: finalBody,
        textBody: textContent,
        fromAddress: fromAddresses[fromIndex]?.full || "",
        attachments: attachments.length > 0 ? attachments : undefined,
        inReplyTo: replyTo?.id || undefined,
        priority,
        readReceipt: requestReadReceipt,
      })
      clearDraft()
      if (draftId) {
        setDraftId(null)
        fetch(`/api/emails/${draftId}`, { method: "DELETE" }).catch(() => {})
      }
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    const hasContent = to || cc || bcc || subject || bodyHtml || bodyText || attachments.length > 0
    if (hasContent) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const handleDiscardConfirm = () => {
    clearDraft()
    if (draftId) {
      setDraftId(null)
      fetch(`/api/emails/${draftId}`, { method: "DELETE" }).catch(() => {})
    }
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleEditorChange = useCallback((html: string, text: string) => {
    if (!templateHtml) setBodyHtml(html)
    setBodyText(text)
  }, [templateHtml])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData("text/html")
    if (html && /<(table|div|style|img|hr|center|font|span)[^>]*>/i.test(html)) {
      e.preventDefault()
      e.stopPropagation()
      setTemplateHtml(html)
      setEditedHtml(html)
      setBodyHtml(html)
      setBodyText(e.clipboardData.getData("text/plain") || html.replace(/<[^>]*>/g, ""))
      setIsEditing(false)
    }
  }, [])

  if (minimized) {
    return (
      <div className="fixed right-0 top-1/4 z-50">
        <div
          onClick={() => setMinimized(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") setMinimized(false) }}
          aria-label="Maximize compose window"
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-lg shadow-lg py-3 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="flex flex-col items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 [writing-mode:vertical-rl] rotate-180">{subject || "New Message"}</span>
          </div>
        </div>
      </div>
    )
  }

  const modeLabel = replyTo?.mode === "forward" ? "Forward" : replyTo?.mode === "reply" || replyTo?.mode === "replyAll" ? "Reply" : "New Message"

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Compose email"
      className="fixed right-0 top-0 h-full z-50 w-[560px] max-w-[calc(100vw-2rem)] animate-[slideInFromRight_0.2s_ease-out]"
    >
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl" onPaste={handlePaste}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{modeLabel}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(true)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" aria-label="Minimize compose window"><Minus className="h-3.5 w-3.5 text-gray-500" /></button>
            <button onClick={handleClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" aria-label="Close and discard draft"><X className="h-3.5 w-3.5 text-gray-500" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {fromAddresses.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="compose-from" className="text-xs font-medium text-gray-500 w-8 shrink-0">From</label>
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
            <label htmlFor="compose-to" className="text-xs font-medium text-gray-500 w-8 shrink-0">To</label>
            <ContactAutocomplete id="compose-to" value={to} onChange={setTo} placeholder="Recipients" workspaceId={workspaceId} />
            <div className="flex gap-2 shrink-0">
              {!showCc && <Button variant="ghost" size="sm" onClick={() => setShowCc(true)} className="text-xs text-blue-600 hover:text-blue-700 h-auto px-1" aria-label="Add Cc field">Cc</Button>}
              {!showBcc && <Button variant="ghost" size="sm" onClick={() => setShowBcc(true)} className="text-xs text-blue-600 hover:text-blue-700 h-auto px-1" aria-label="Add Bcc field">Bcc</Button>}
            </div>
          </div>

          {showCc && (
            <div className="flex items-center gap-2">
              <label htmlFor="compose-cc" className="text-xs font-medium text-gray-500 w-8 shrink-0">Cc</label>
              <ContactAutocomplete id="compose-cc" value={cc} onChange={setCc} placeholder="Cc recipients" workspaceId={workspaceId} />
            </div>
          )}

          {showBcc && (
            <div className="flex items-center gap-2">
              <label htmlFor="compose-bcc" className="text-xs font-medium text-gray-500 w-8 shrink-0">Bcc</label>
              <ContactAutocomplete id="compose-bcc" value={bcc} onChange={setBcc} placeholder="Bcc recipients" workspaceId={workspaceId} />
            </div>
          )}

          <label htmlFor="compose-subject" className="sr-only">Subject</label>
          <Input id="compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm font-medium focus:ring-0" />

          {placeholders.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 space-y-2">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Template Variables</p>
              <div className="grid grid-cols-2 gap-2">
                {placeholders.map((p) => (
                  <Input
                    key={p}
                    value={placeholderValues[p] || ""}
                    onChange={(e) => setPlaceholderValues(prev => ({ ...prev, [p]: e.target.value }))}
                    placeholder={`{${p}}`}
                    className="h-7 text-xs border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 rounded"
                  />
                ))}
              </div>
            </div>
          )}

          {templateHtml && !isEditing ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500">Template Preview</span>
                <button
                  type="button"
                  onClick={() => { setEditedHtml(e => e || templateHtml); setIsEditing(true) }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Edit Content
                </button>
              </div>
              <div
                className="p-3 text-sm [&_table]:max-w-full"
                dangerouslySetInnerHTML={{ __html: replacePlaceholders(editedHtml || templateHtml) }}
              />
            </div>
          ) : templateHtml && isEditing ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500">Editing Template</span>
                <button
                  type="button"
                  onClick={() => { setEditedHtml(contentRef.current?.innerHTML || editedHtml); setIsEditing(false) }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Done
                </button>
              </div>
              <div
                ref={contentRef}
                suppressContentEditableWarning
                className="p-3 text-sm [&_table]:max-w-full focus:outline-none"
                dangerouslySetInnerHTML={{ __html: editedHtml }}
              />
            </div>
          ) : (
            <RichEditor value={bodyHtml || bodyText} onChange={handleEditorChange} placeholder="Write your message..." />
          )}

          {attachmentError && (
            <p className="text-xs text-red-500" role="alert">{attachmentError}</p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-2">
              <Flag className={`h-3.5 w-3.5 ${priority === "high" ? "text-red-500" : priority === "low" ? "text-blue-400" : "text-gray-400"}`} />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Priority"
              >
                <option value="low">Low priority</option>
                <option value="normal">Normal</option>
                <option value="high">High priority</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requestReadReceipt}
                onChange={(e) => setRequestReadReceipt(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">Request read receipt</span>
            </label>
          </div>

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

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <Button onClick={() => {
              if (to || subject || bodyHtml) {
                fetch("/api/drafts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: draftId,
                    to: to ? to.split(",").map(s => s.trim()).filter(Boolean) : [],
                    cc: showCc && cc ? cc.split(",").map(s => s.trim()).filter(Boolean) : [],
                    bcc: showBcc && bcc ? bcc.split(",").map(s => s.trim()).filter(Boolean) : [],
                    subject,
                    body: bodyHtml,
                    textBody: bodyText,
                    fromAddress: fromAddresses[fromIndex]?.full || "",
                  }),
                }).then(res => {
                  if (res.ok) {
                    res.json().then(d => {
                      if (!draftId && d.id) setDraftId(d.id);
                      toast.success("Draft saved")
                    })
                  } else {
                    toast.error("Failed to save draft")
                  }
                }).catch(() => toast.error("Failed to save draft"))
              }
            }} disabled={sending || (!to && !subject && !bodyHtml)} variant="ghost" size="sm" className="text-gray-500">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
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
                          onClick={() => handleTemplateSelect(t.id)}
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
            <div className="relative">
              <Button variant="ghost" size="icon"
                onClick={() => setShowSignatures(!showSignatures)}
                className={`text-gray-400 hover:text-gray-600 ${selectedSignatureId ? "text-blue-500" : ""}`}
                aria-label="Insert signature"
                aria-expanded={showSignatures}
              >
                <Signature className="h-4 w-4" />
              </Button>
              {showSignatures && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSignatures(false)} aria-hidden="true" />
                  <div className="absolute bottom-full left-0 mb-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto" role="listbox" aria-label="Select a signature">
                    {signatures.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">No signatures. Add one in Settings.</div>
                    )}
                    {signatures.map(s => (
                      <button
                        key={s.id}
                        onClick={() => insertSignature(s.id)}
                        className={`w-full text-left px-3 py-2 text-sm truncate hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedSignatureId === s.id ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}
                        role="option"
                      >
                        {s.name} {s.is_default && <Check className="h-3 w-3 inline ml-1" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            clearDraft()
            if (draftId) {
              setDraftId(null)
              fetch(`/api/emails/${draftId}`, { method: "DELETE" }).catch(() => {})
            }
            onClose()
          }} className="text-gray-400">
            Discard
          </Button>
        </div>
      </div>

      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowDiscardConfirm(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-label="Discard draft"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Discard draft?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              You have unsaved changes. If you discard now, this draft will be lost.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDiscardConfirm(false)}>
                Keep editing
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDiscardConfirm} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

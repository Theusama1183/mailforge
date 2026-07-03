"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichEditor } from "@/components/compose/rich-editor"
import { Plus, Save, Trash2, FileText, Clock, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
  created_at: string
  updated_at: string
}

function isBuilderTemplate(t: Template): boolean {
  try {
    const parsed = JSON.parse(t.body_text)
    return parsed && typeof parsed === "object" && parsed.root
  } catch {
    return false
  }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [bodyText, setBodyText] = useState("")
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceId as string

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data } = await supabase.from("templates").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
    setTemplates(data || [])
    setLoading(false)
  }

  function startNew() {
    setEditing({ id: "", name: "", subject: "", body_html: "", body_text: "", created_at: "", updated_at: "" })
    setName("")
    setSubject("")
    setBodyHtml("")
    setBodyText("")
  }

  function startEdit(t: Template) {
    setEditing(t)
    setName(t.name)
    setSubject(t.subject)
    setBodyHtml(t.body_html)
    setBodyText(t.body_text)
  }

  async function save() {
    if (!name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing?.id) {
      const { error } = await supabase.from("templates").update({
        name, subject, body_html: bodyHtml, body_text: bodyText, updated_at: new Date().toISOString(),
      }).eq("id", editing.id)
      if (!error) loadTemplates()
    } else {
      const { error } = await supabase.from("templates").insert({
        user_id: user.id, name, subject, body_html: bodyHtml, body_text: bodyText,
      })
      if (!error) { loadTemplates(); setEditing(null) }
    }
  }

  async function remove(id: string) {
    await supabase.from("templates").delete().eq("id", id)
    if (editing?.id === id) setEditing(null)
    loadTemplates()
  }

  return (
    <>
      <PageHeader title="Email Templates" description="Save and reuse email templates"
        actions={<Button onClick={startNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                {templates.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-10">No templates yet</p>
                )}
                {templates.map(t => (
                  <div
                    key={t.id}
                    onClick={() => startEdit(t)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      editing?.id === t.id
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</span>
                    </div>
                    {t.subject && <p className="text-xs text-gray-400 mt-1 truncate">{t.subject}</p>}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">{new Date(t.updated_at).toLocaleDateString()}</span>
                    </div>
                    {isBuilderTemplate(t) && (
                      <div className="mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/${workspaceId}/templates/builder#${t.id}`) }}
                          className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Builder
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="md:col-span-2">
                {editing !== null ? (
                  <div className="space-y-4">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="font-medium" />
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" />
                    {isBuilderTemplate(editing) ? (
                      <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-3">This template was created with the Email Builder.</p>
                        <Button onClick={() => router.push(`/${workspaceId}/templates/builder#${editing.id}`)} className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Open in Builder
                        </Button>
                      </div>
                    ) : (
                      <RichEditor value={bodyText} onChange={(html, text) => { setBodyHtml(html); setBodyText(text) }} placeholder="Template body..." />
                    )}
                    <div className="flex items-center gap-2">
                      <Button onClick={save} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => router.push(`/${workspaceId}/templates/builder#${editing.id || ''}`)} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {editing.id ? 'Edit in Builder' : 'New Builder Template'}
                      </Button>
                      {editing.id && (
                        <Button variant="destructive" size="sm" onClick={() => remove(editing.id)} className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    Select or create a template
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

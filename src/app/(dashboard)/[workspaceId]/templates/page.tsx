"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichEditor } from "@/components/compose/rich-editor"
import { Plus, Save, Trash2, FileText, Clock, ExternalLink, Search, Download, Upload, Tag, Eye, EyeOff, Variable, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"

const CATEGORIES = ["", "Marketing", "Transactional", "Newsletter", "Promotional", "Event", "Feedback", "Social", "Other"] as const

interface TemplateVariable {
  name: string
  defaultValue: string
}

interface TemplateMeta {
  category?: string
  variables?: TemplateVariable[]
}

interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
  created_at: string
  updated_at: string
}

function getMeta(bodyText: string): TemplateMeta {
  try {
    const parsed = JSON.parse(bodyText)
    return parsed?._meta || {}
  } catch {
    return {}
  }
}

function applyMeta(bodyText: string, meta: TemplateMeta): string {
  try {
    const parsed = JSON.parse(bodyText)
    parsed._meta = meta
    return JSON.stringify(parsed)
  } catch {
    return bodyText
  }
}

function isBuilderTemplate(t: Template): boolean {
  try {
    const parsed = JSON.parse(t.body_text)
    return parsed && typeof parsed === "object" && parsed.root
  } catch {
    return false
  }
}

function replaceVariables(text: string, variables: TemplateVariable[]): string {
  let result = text
  for (const v of variables) {
    result = result.replace(new RegExp(`\\{\\{\\s*${v.name}\\s*\\}\\}`, "g"), v.defaultValue)
  }
  return result
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [meta, setMeta] = useState<TemplateMeta>({})
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [showVariables, setShowVariables] = useState(false)
  const [newVar, setNewVar] = useState({ name: "", defaultValue: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceId as string

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    const m = getMeta(bodyText)
    setMeta(m)
    setVariables(m.variables || [])
  }, [bodyText])

  async function loadTemplates() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    let query = supabase.from("templates").select("*").eq("user_id", user.id)
    if (workspaceId) query = query.eq("workspace_id", workspaceId)
    const { data } = await query.order("updated_at", { ascending: false })
    setTemplates(data || [])
    setLoading(false)
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    const tMeta = getMeta(t.body_text)
    const matchesCategory = !categoryFilter || tMeta.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  function startNew() {
    setEditing({ id: "", name: "", subject: "", body_html: "", body_text: "", created_at: "", updated_at: "" })
    setName("")
    setSubject("")
    setBodyHtml("")
    setBodyText("")
    setMeta({})
    setVariables([])
    setShowPreview(false)
  }

  function startEdit(t: Template) {
    setEditing(t)
    setName(t.name)
    setSubject(t.subject)
    setBodyHtml(t.body_html)
    setBodyText(t.body_text)
    setShowPreview(false)
  }

  async function save() {
    if (!name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updatedMeta = { ...meta, variables }
    const finalBodyText = applyMeta(bodyText, updatedMeta)

    if (editing?.id) {
      const { error } = await supabase.from("templates").update({
        name, subject, body_html: bodyHtml, body_text: finalBodyText, updated_at: new Date().toISOString(),
      }).eq("id", editing.id)
      if (!error) loadTemplates()
    } else {
      const { error } = await supabase.from("templates").insert({
        user_id: user.id, workspace_id: workspaceId || null, name, subject, body_html: bodyHtml, body_text: finalBodyText,
      })
      if (!error) { loadTemplates(); setEditing(null) }
    }
  }

  async function remove(id: string) {
    await supabase.from("templates").delete().eq("id", id)
    if (editing?.id === id) setEditing(null)
    loadTemplates()
  }

  function exportTemplate(t: Template) {
    const tMeta = getMeta(t.body_text)
    const data = {
      name: t.name,
      subject: t.subject,
      body_html: t.body_html,
      body_text: t.body_text,
      category: tMeta.category,
      variables: tMeta.variables,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${t.name.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        let bodyText = data.body_text || ""
        if (data.category || data.variables) {
          bodyText = applyMeta(bodyText, { category: data.category || "", variables: data.variables || [] })
        }
        await supabase.from("templates").insert({
          user_id: user.id, workspace_id: workspaceId || null,
          name: data.name || "Imported",
          subject: data.subject || "",
          body_html: data.body_html || "",
          body_text: bodyText,
        })
        loadTemplates()
      } catch (err) {
        console.error("Import error:", err)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function addVariable() {
    if (!newVar.name.trim()) return
    setVariables([...variables, { name: newVar.name.trim(), defaultValue: newVar.defaultValue }])
    setNewVar({ name: "", defaultValue: "" })
  }

  function removeVariable(index: number) {
    setVariables(variables.filter((_, i) => i !== index))
  }

  function getPreviewHtml(t: Template): string {
    if (t.body_html) {
      let html = t.body_html
      const tMeta = getMeta(t.body_text)
      if (tMeta.variables) {
        html = replaceVariables(html, tMeta.variables)
      }
      return html
    }
    return ""
  }

  return (
    <>
      <PageHeader title="Email Templates" description="Save and reuse email templates"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={importTemplate} className="hidden" />
            <Button onClick={startNew} className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>
        } />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search templates..." className="pl-9" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.filter(Boolean).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-2">
                  {filteredTemplates.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-10">
                      {searchQuery || categoryFilter ? "No matching templates" : "No templates yet"}
                    </p>
                  )}
                  {filteredTemplates.map(t => {
                    const tMeta = getMeta(t.body_text)
                    return (
                      <div key={t.id}>
                        <div
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
                          {tMeta.category && (
                            <div className="flex items-center gap-1 mt-1">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500">{tMeta.category}</span>
                            </div>
                          )}
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
                      </div>
                    )
                  })}
                </div>

                <div className="md:col-span-2">
                  {editing !== null ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="font-medium flex-1" />
                        <select
                          value={meta.category || ""}
                          onChange={e => setMeta({ ...meta, category: e.target.value })}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        >
                          <option value="">No category</option>
                          {CATEGORIES.filter(Boolean).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" />

                      <div className="flex items-center gap-2">
                        {isBuilderTemplate(editing) && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1">
                              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {showPreview ? "Hide Preview" : "Preview"}
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setShowVariables(!showVariables)} className="gap-1">
                          <Variable className="h-4 w-4" />
                          Variables
                        </Button>
                      </div>

                      {showVariables && (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                          <div className="text-sm font-medium">Template Variables</div>
                          {variables.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{`{{${v.name}}}`}</code>
                              <span className="text-gray-500">→</span>
                              <span className="text-gray-600">{v.defaultValue || "(no default)"}</span>
                              <button onClick={() => removeVariable(i)} className="ml-auto text-red-500 hover:text-red-700">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <input
                              value={newVar.name}
                              onChange={e => setNewVar({ ...newVar, name: e.target.value })}
                              placeholder="Variable name"
                              className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm bg-transparent"
                            />
                            <input
                              value={newVar.defaultValue}
                              onChange={e => setNewVar({ ...newVar, defaultValue: e.target.value })}
                              placeholder="Default value"
                              className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm bg-transparent"
                            />
                            <Button size="sm" onClick={addVariable} className="shrink-0">Add</Button>
                          </div>
                        </div>
                      )}

                      {showPreview && isBuilderTemplate(editing) ? (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-500 flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            Preview
                          </div>
                          <iframe
                            srcDoc={getPreviewHtml(editing)}
                            className="w-full bg-white"
                            style={{ height: 400 }}
                            title="Template preview"
                          />
                        </div>
                      ) : isBuilderTemplate(editing) ? (
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
                          <>
                            <Button variant="outline" size="sm" onClick={() => exportTemplate(editing)} className="gap-1">
                              <Download className="h-4 w-4" />
                              Export
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => remove(editing.id)} className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </>
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
            </>
          )}
        </div>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { Contact2, Plus, Search, Upload, Download, MoreHorizontal, Mail, Trash2, Pencil, X, Check, ChevronLeft, ChevronRight, Users, Merge as MergeIcon } from "lucide-react"
import type { Contact, ContactGroup } from "@/types"
import { toast } from "sonner"

export default function ContactsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const pageSize = 30

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [addEmail, setAddEmail] = useState("")
  const [addName, setAddName] = useState("")
  const [addCompany, setAddCompany] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addNotes, setAddNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [activity, setActivity] = useState<{ id: string; subject: string; from_address: string; from_name: string; direction: string; folder: string; created_at: string }[]>([])
  const [showActivity, setShowActivity] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(false)

  const [groups, setGroups] = useState<(ContactGroup & { contact_group_members?: { count: number } })[]>([])
  const [showGroups, setShowGroups] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupColor, setGroupColor] = useState("#3b82f6")

  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL(`/api/contacts`, window.location.origin)
      url.searchParams.set("page", String(page))
      url.searchParams.set("pageSize", String(pageSize))
      url.searchParams.set("workspaceId", workspaceId)
      if (debouncedQuery) url.searchParams.set("q", debouncedQuery)
      if (selectedGroupId) url.searchParams.set("groupId", selectedGroupId)

      const res = await fetch(url.toString())
      if (res.ok) {
        const json = await res.json()
        setContacts(json.data)
        setTotal(json.total)
      }
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery, selectedGroupId, workspaceId])

  const fetchGroups = useCallback(async () => {
    const res = await fetch(`/api/contact-groups?workspaceId=${encodeURIComponent(workspaceId)}`)
    if (res.ok) setGroups(await res.json())
  }, [workspaceId])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { fetchGroups() }, [fetchGroups])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const totalPages = Math.ceil(total / pageSize)

  const handleSave = async () => {
    if (!addEmail) return
    setSaving(true)
    try {
      const body = { email: addEmail, workspaceId, name: addName || null, company: addCompany || null, phone: addPhone || null, notes: addNotes || null }
      if (editContact) {
        await fetch(`/api/contacts/${editContact.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      } else {
        await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      }
      resetForm()
      fetchContacts()
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setShowAddDialog(false)
    setEditContact(null)
    setAddEmail("")
    setAddName("")
    setAddCompany("")
    setAddPhone("")
    setAddNotes("")
  }

  const fetchActivity = async (contactId: string) => {
    setLoadingActivity(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/activity`)
      if (res.ok) setActivity(await res.json())
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleEdit = (c: Contact) => {
    setEditContact(c)
    setAddEmail(c.email)
    setAddName(c.name || "")
    setAddCompany(c.company || "")
    setAddPhone(c.phone || "")
    setAddNotes(c.notes || "")
    setShowActivity(false)
    setActivity([])
    setShowAddDialog(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" })
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    fetchContacts()
  }

  const handleBulkDelete = async () => {
    await fetch("/api/contacts/batch", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), workspaceId }),
    })
    setSelectedIds(new Set())
    fetchContacts()
  }

  const handleMerge = async () => {
    const selected = contacts.filter(c => selectedIds.has(c.id))
    const byEmail: Record<string, typeof selected> = {}
    for (const c of selected) {
      const key = c.email.toLowerCase().trim()
      if (!byEmail[key]) byEmail[key] = []
      byEmail[key].push(c)
    }

    const groups = Object.values(byEmail).filter(g => g.length > 1)
    if (groups.length === 0) {
      toast.error("Select multiple contacts with the same email to merge")
      return
    }

    let merged = 0
    for (const group of groups) {
      const [primary, ...duplicates] = group.sort((a, b) => {
        const aScore = (a.name ? 1 : 0) + (a.company ? 1 : 0) + (a.phone ? 1 : 0) + (a.notes ? 1 : 0)
        const bScore = (b.name ? 1 : 0) + (b.company ? 1 : 0) + (b.phone ? 1 : 0) + (b.notes ? 1 : 0)
        return bScore - aScore
      })

      const res = await fetch("/api/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: primary.id, duplicateIds: duplicates.map(d => d.id), workspaceId }),
      })
      if (res.ok) merged += duplicates.length
    }

    setSelectedIds(new Set())
    fetchContacts()
    if (merged > 0) toast.success(`Merged ${merged} duplicate(s)`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("workspaceId", workspaceId)
      const res = await fetch("/api/contacts/import", { method: "POST", body: form })
      if (res.ok) fetchContacts()
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  const handleExport = () => {
    const url = new URL("/api/contacts/export", window.location.origin)
    url.searchParams.set("workspaceId", workspaceId)
    if (selectedGroupId) url.searchParams.set("groupId", selectedGroupId)
    window.open(url.toString(), "_blank")
  }

  const handleSaveGroup = async () => {
    if (!groupName) return
    await fetch("/api/contact-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, workspaceId, description: groupDescription || null, color: groupColor }),
    })
    setGroupName("")
    setGroupDescription("")
    setGroupColor("#3b82f6")
    setShowGroupDialog(false)
    fetchGroups()
  }

  const handleAddToGroup = async (groupId: string) => {
    await fetch(`/api/contact-groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: Array.from(selectedIds) }),
    })
    setSelectedIds(new Set())
    fetchGroups()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <PageHeader
        title="Contacts"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0) }}
                placeholder="Search contacts..."
                className="pl-8 h-8 w-48 text-sm"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowGroups(!showGroups)} aria-label="Manage groups" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Groups</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} aria-label="Export contacts" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <label className="cursor-pointer">
              <Button variant="ghost" size="sm" asChild aria-label="Import contacts" className="gap-1.5">
                <span><Upload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Import</span></span>
              </Button>
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
            <Button onClick={() => resetForm()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Groups bar */}
        {showGroups && (
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedGroupId(undefined)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!selectedGroupId ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
              >
                All
              </button>
              {groups.map(g => (
                <div key={g.id} className="flex items-center group/grp">
                  <button
                    onClick={() => setSelectedGroupId(g.id === selectedGroupId ? undefined : g.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${g.id === selectedGroupId ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.name}
                    <span className="text-[10px] opacity-60">{(g as any).contact_group_members?.count || 0}</span>
                  </button>
                  <button
                    onClick={async () => { await fetch(`/api/contact-groups/${g.id}`, { method: "DELETE" }); fetchGroups() }}
                    className="ml-0.5 p-0.5 rounded-full opacity-0 group-hover/grp:opacity-100 hover:bg-red-100 dark:hover:bg-red-900 transition-opacity"
                    aria-label={`Delete group ${g.name}`}
                  >
                    <X className="h-2.5 w-2.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setShowGroupDialog(true)} className="text-xs gap-1 h-7 px-2">
                <Plus className="h-3 w-3" /> New Group
              </Button>
            </div>
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-3 text-sm">
            <span className="text-blue-700 dark:text-blue-300 font-medium">{selectedIds.size} selected</span>
            <div className="flex items-center gap-1">
              <select
                onChange={(e) => { if (e.target.value) handleAddToGroup(e.target.value); e.target.value = "" }}
                className="text-xs border border-blue-200 dark:border-blue-800 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                defaultValue=""
                aria-label="Add to group"
              >
                <option value="" disabled>Add to group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700 text-xs gap-1 h-7">
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={handleMerge} className="text-xs gap-1 h-7">
              <MergeIcon className="h-3 w-3" /> Merge
            </Button>
          </div>
        )}

        {/* Contact list */}
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Contact2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {query ? "No contacts match your search" : "No contacts yet"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">
              {query ? "Try a different search term" : "Contacts will be auto-saved from emails you send and receive"}
            </p>
            {!query && (
              <Button onClick={() => { setEditContact(null); setAddEmail(""); setAddName(""); setAddCompany(""); setAddPhone(""); setAddNotes(""); setShowAddDialog(true) }} size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add your first contact
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {contacts.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group ${selectedIds.has(c.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  aria-label={`Select ${c.email}`}
                />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {(c.name || c.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {c.name || <span className="text-gray-400 italic">No name</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}{c.company ? ` · ${c.company}` : ""}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`/api/contacts/${c.id}/vcard`, "_blank")} aria-label={`Download vCard for ${c.email}`}>
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(c)} aria-label={`Edit ${c.email}`}>
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(c.id)} aria-label={`Delete ${c.email}`}>
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
          <span>{total} contact{total !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 w-7 p-0">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2">{page + 1} / {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7 w-7 p-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={resetForm}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{editContact ? "Edit Contact" : "Add Contact"}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <Input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="email@example.com" className="text-sm" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Full name" className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                  <Input value={addCompany} onChange={e => setAddCompany(e.target.value)} placeholder="Company" className="text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <Input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="Phone" className="text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  placeholder="Notes about this contact"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20"
                />
              </div>
              {editContact?.id && (
                <div>
                  <button
                    onClick={() => { setShowActivity(!showActivity); if (!showActivity && activity.length === 0) fetchActivity(editContact.id) }}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Mail className="h-3 w-3" />
                    {showActivity ? "Hide" : "Show"} email activity ({editContact.email})
                  </button>
                  {showActivity && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2">
                      {loadingActivity ? (
                        <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                      ) : activity.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No email history found</p>
                      ) : activity.map(e => (
                        <div key={e.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.direction === "inbound" ? "bg-green-400" : "bg-blue-400"}`} />
                          <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{e.subject || "(no subject)"}</span>
                          <span className="text-gray-400 shrink-0">{new Date(e.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !addEmail}>
                {saving ? "Saving..." : editContact ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Group dialog */}
      {showGroupDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowGroupDialog(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">New Group</h3>
            <div className="space-y-3">
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="text-sm" autoFocus />
              <Input value={groupDescription} onChange={e => setGroupDescription(e.target.value)} placeholder="Description (optional)" className="text-sm" />
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Color</label>
                <input type="color" value={groupColor} onChange={e => setGroupColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveGroup} disabled={!groupName}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

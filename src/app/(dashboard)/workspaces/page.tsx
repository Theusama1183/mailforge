"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { Plus, Trash2, Users, Mail, UserPlus, UserMinus, Settings2, Loader2, Clock, CheckCircle, XCircle, Send, MessageSquare, ExternalLink, AtSign, Check, Save } from "lucide-react"
import { toast } from "sonner"

interface Workspace {
  id: string; name: string; created_by: string; role: string; created_at: string
}

interface Member {
  id: string; user_id: string; role: string; created_at: string; users?: { email: string }
}

interface Invitation {
  id: string; email: string; status: string; created_at: string; message?: string
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [newName, setNewName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviteEmailIds, setInviteEmailIds] = useState<string[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [sending, setSending] = useState(false)
  const [workspaceEmails, setWorkspaceEmails] = useState<any[]>([])
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingEmailIds, setEditingEmailIds] = useState<string[]>([])
  const [savingAssign, setSavingAssign] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadWorkspaces() }, [])

  async function loadWorkspaces() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const res = await fetch("/api/workspaces")
    const data = await res.json()
    setWorkspaces(data || [])
    setLoading(false)

    if (data && data.length > 0 && !selected) {
      setSelected(data[0])
      loadMembers(data[0].id)
      loadInvitations(data[0].id)
      loadWorkspaceEmails(data[0].id)
    }
  }

  async function loadMembers(wsId: string) {
    const res = await fetch(`/api/workspaces/${wsId}/members`)
    const data = await res.json()
    setMembers(data || [])
  }

  async function loadInvitations(wsId: string) {
    const res = await fetch(`/api/workspaces/${wsId}/invitations`)
    const data = await res.json()
    setInvitations(Array.isArray(data) ? data : [])
  }

  async function loadWorkspaceEmails(wsId: string) {
    try {
      const res = await fetch(`/api/workspaces/${wsId}/emails`)
      if (!res.ok) return
      const data = await res.json()
      setWorkspaceEmails(data || [])
    } catch {
      setWorkspaceEmails([])
    }
  }

  async function selectWorkspace(ws: Workspace) {
    setSelected(ws)
    setInviteEmailIds([])
    loadMembers(ws.id)
    loadInvitations(ws.id)
    loadWorkspaceEmails(ws.id)
  }

  async function createWorkspace() {
    if (!newName.trim()) { toast.error("Workspace name is required"); return }
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed") }
      const ws = await res.json()
      setNewName(""); setShowCreate(false)
      toast.success("Workspace created")
      localStorage.setItem("mailforge_active_workspace", ws.id)
      document.cookie = `mailforge_active_workspace=${ws.id}; path=/; max-age=31536000; SameSite=Lax`
      router.push(`/${ws.id}/inbox`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace")
    }
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !selected) return
    setSending(true)
    try {
      const res = await fetch(`/api/workspaces/${selected.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          message: inviteMessage.trim() || undefined,
          emailIds: inviteEmailIds,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed") }
      const data = await res.json()
      setInviteEmail(""); setInviteMessage(""); setInviteEmailIds([])
      toast.success(data.email_sent ? "Invitation sent!" : "Invitation created (email not sent — configure SMTP)")
      loadInvitations(selected.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite")
    } finally {
      setSending(false)
    }
  }

  function toggleEmailSelection(emailId: string) {
    setInviteEmailIds(prev =>
      prev.includes(emailId) ? prev.filter(id => id !== emailId) : [...prev, emailId]
    )
  }

  async function cancelInvite(inviteId: string) {
    if (!selected) return
    try {
      const res = await fetch(`/api/workspaces/${selected.id}/invitations?invite_id=${inviteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to cancel")
      toast.success("Invitation cancelled")
      loadInvitations(selected.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  async function removeMember(memberId: string) {
    if (!selected) return
    try {
      const res = await fetch(`/api/workspaces/${selected.id}/members?member_id=${memberId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove")
      toast.success("Member removed")
      loadMembers(selected.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  async function deleteWorkspace(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      if (selected?.id === id) setSelected(null)
      toast.success("Workspace deleted")
      loadWorkspaces()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  async function saveAssignments(memberUserId: string) {
    if (!selected) return
    setSavingAssign(true)
    try {
      const res = await fetch(`/api/workspaces/${selected.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberUserId, emailIds: editingEmailIds }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Assignments updated")
      setEditingMemberId(null)
      loadWorkspaceEmails(selected.id)
    } catch {
      toast.error("Failed to update assignments")
    } finally {
      setSavingAssign(false)
    }
  }

  function goToWorkspace(ws: Workspace) {
    localStorage.setItem("mailforge_active_workspace", ws.id)
    document.cookie = `mailforge_active_workspace=${ws.id}; path=/; max-age=31536000; SameSite=Lax`
    router.push(`/${ws.id}/inbox`)
  }

  const pendingInvites = invitations.filter(i => i.status === "pending")

  return (
    <>
      <PageHeader title="Workspaces" description="Shared mailboxes for your team"
        actions={<Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" /> New Workspace
        </Button>} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {showCreate && (
            <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-900">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workspace name" className="flex-1" />
              <Button onClick={createWorkspace}>Create</Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left sidebar - workspace list */}
              <div className="md:col-span-4 space-y-2">
                {workspaces.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-10">No workspaces yet</p>
                )}
                {workspaces.map(ws => (
                  <div key={ws.id} className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selected?.id === ws.id
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                      : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}>
                    <div className="flex items-center justify-between" onClick={() => selectWorkspace(ws)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{ws.name}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{ws.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); goToWorkspace(ws) }}
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right panel - workspace details */}
              <div className="md:col-span-8 space-y-6">
                {selected ? (
                  <>
                    {/* Workspace header */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-900 border border-blue-100 dark:border-gray-800">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selected.name}</h2>
                        <p className="text-xs text-gray-500">
                          Created {new Date(selected.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => goToWorkspace(selected)}>
                          <ExternalLink className="h-4 w-4 mr-1" /> Open
                        </Button>
                        {selected.role === "admin" && (
                          <Button variant="destructive" size="sm" onClick={() => deleteWorkspace(selected.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Invite section */}
                    {selected.role === "admin" && (
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <Send className="h-4 w-4 text-blue-500" />
                          Invite Member
                        </h3>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="team@example.com"
                                className="pl-9"
                              />
                            </div>
                            <Button onClick={inviteMember} disabled={sending || !inviteEmail.trim()} className="gap-2">
                              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              Send Invite
                            </Button>
                          </div>
                          <Input
                            value={inviteMessage}
                            onChange={e => setInviteMessage(e.target.value)}
                            placeholder="Add a personal message (optional)"
                            className="text-sm"
                          />

                          {/* Email address assignment */}
                          {workspaceEmails.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                <AtSign className="h-3 w-3" />
                                Assign email addresses (optional)
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {workspaceEmails.map(ea => {
                                  const alreadyAssigned = ea.assigned_to && !inviteEmailIds.includes(ea.id)
                                  const selected = inviteEmailIds.includes(ea.id)
                                  return (
                                    <button
                                      key={ea.id}
                                      type="button"
                                      disabled={!!alreadyAssigned}
                                      onClick={() => toggleEmailSelection(ea.id)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        alreadyAssigned
                                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                          : selected
                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                                      }`}
                                    >
                                      {selected && <Check className="h-3 w-3" />}
                                      {alreadyAssigned && <Check className="h-3 w-3 text-gray-300" />}
                                      {ea.local_part}@{ea.domains?.domain}
                                    </button>
                                  )
                                })}
                              </div>
                              {inviteEmailIds.length > 0 && (
                                <p className="text-[10px] text-blue-500 mt-1">
                                  {inviteEmailIds.length} email(s) will be assigned upon acceptance
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pending invitations */}
                    {pendingInvites.length > 0 && (
                      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Pending Invitations ({pendingInvites.length})
                        </h3>
                        <div className="space-y-2">
                          {pendingInvites.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                  <Clock className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{inv.email}</p>
                                  <p className="text-[10px] text-gray-400">
                                    Sent {new Date(inv.created_at).toLocaleDateString()}
                                    {inv.message && ` · "${inv.message}"`}
                                  </p>
                                </div>
                              </div>
                              {selected.role === "admin" && (
                                <Button variant="ghost" size="sm" onClick={() => cancelInvite(inv.id)} className="text-amber-500">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Members section */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Members ({members.length})
                      </h3>

                      {members.length === 0 ? (
                        <p className="text-sm text-gray-400">No members yet</p>
                      ) : (
                        <div className="space-y-2">
                          {members.map(m => {
                            const memberEmails = workspaceEmails.filter(ea => ea.assigned_to === m.user_id)
                            const isEditing = editingMemberId === m.user_id
                            return (
                              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-white">
                                      {(m.users?.email || m.user_id).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {m.users?.email || m.user_id}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                        m.role === "admin"
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                      }`}>
                                        {m.role}
                                      </span>
                                      {!isEditing && memberEmails.length > 0 && (
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {memberEmails.map(ea => `${ea.local_part}@${ea.domains?.domain}`).join(", ")}
                                        </span>
                                      )}
                                    </div>
                                    {isEditing && (
                                      <div className="mt-2 space-y-1.5">
                                        {workspaceEmails.map(ea => {
                                          const isSel = editingEmailIds.includes(ea.id)
                                          return (
                                            <label key={ea.id} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                              <input
                                                type="checkbox"
                                                checked={isSel}
                                                onChange={() => setEditingEmailIds(prev => isSel ? prev.filter(id => id !== ea.id) : [...prev, ea.id])}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                              />
                                              {ea.local_part}@{ea.domains?.domain}
                                            </label>
                                          )
                                        })}
                                        <div className="flex gap-1.5 pt-1">
                                          <Button size="sm" onClick={() => saveAssignments(m.user_id)} disabled={savingAssign}>
                                            {savingAssign ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                            Save
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingMemberId(null)}>
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {selected.role === "admin" && (
                                    <Button variant="ghost" size="sm"
                                      onClick={() => {
                                        if (isEditing) { setEditingMemberId(null); return }
                                        setEditingMemberId(m.user_id)
                                        setEditingEmailIds(memberEmails.map(e => e.id))
                                      }}
                                      title="Assign email addresses">
                                      <AtSign className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  )}
                                  {selected.role === "admin" && m.role !== "admin" && (
                                    <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                                      <UserMinus className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    Select a workspace to manage
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

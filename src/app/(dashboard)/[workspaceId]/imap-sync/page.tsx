"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, Trash2, RefreshCw, Server, List, Clock, History } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"

interface ImapAccount {
  id: string
  name: string
  host: string
  port: number
  username: string
  use_tls: boolean
  sync_frequency: number
  created_at: string
}

interface SyncLog {
  id: string
  status: string
  messages_synced: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

interface FolderMapping {
  id: string
  remote_folder: string
  local_folder: string
  enabled: boolean
}

const LOCAL_FOLDER_OPTIONS = [
  { value: "inbox", label: "Inbox" },
  { value: "sent", label: "Sent" },
  { value: "drafts", label: "Drafts" },
  { value: "trash", label: "Trash" },
  { value: "spam", label: "Spam" },
  { value: "archive", label: "Archive" },
  { value: "starred", label: "Starred" },
]

const FREQ_OPTIONS = [
  { value: 0, label: "Manual only" },
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour" },
  { value: 360, label: "Every 6 hours" },
  { value: 1440, label: "Once daily" },
]

export default function ImapSettingsPage() {
  const [accounts, setAccounts] = useState<ImapAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("993")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [syncFreq, setSyncFreq] = useState(0)
  const [useTls, setUseTls] = useState(true)
  const [error, setError] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [syncLogs, setSyncLogs] = useState<Record<string, SyncLog[]>>({})
  const [folderMappings, setFolderMappings] = useState<Record<string, FolderMapping[]>>({})
  const [newRemoteFolder, setNewRemoteFolder] = useState("")
  const [newLocalFolder, setNewLocalFolder] = useState("inbox")
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceId as string

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    let query = supabase.from("imap_accounts").select("id, name, host, port, username, use_tls, sync_frequency, created_at").eq("user_id", user.id)
    if (workspaceId) query = query.eq("workspace_id", workspaceId)
    const { data } = await query.order("created_at", { ascending: false })
    setAccounts(data || [])
    setLoading(false)
  }

  async function loadSyncLogs(accountId: string) {
    const res = await fetch(`/api/imap/sync-logs/${accountId}`)
    const data = await res.json()
    setSyncLogs(prev => ({ ...prev, [accountId]: data || [] }))
  }

  async function loadFolderMappings(accountId: string) {
    const res = await fetch(`/api/imap/folder-mappings?account_id=${accountId}`)
    const data = await res.json()
    setFolderMappings(prev => ({ ...prev, [accountId]: data || [] }))
  }

  async function handleAdd() {
    setError("")
    if (!host || !username || !password) { setError("All fields required"); return }

    const res = await fetch("/api/imap/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, host, port: parseInt(port), username, password, use_tls: useTls, sync_frequency: syncFreq, workspaceId }),
    })

    if (!res.ok) { const d = await res.json(); setError(d.error); return }

    setName(""); setHost(""); setPort("993"); setUsername(""); setPassword(""); setUseTls(true); setSyncFreq(0)
    setShowForm(false)
    loadAccounts()

    const newAccount = await res.json()
    triggerSync(newAccount.id)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/imap/accounts/${id}`, { method: "DELETE" })
    loadAccounts()
  }

  async function triggerSync(id: string) {
    setSyncing(id)
    const res = await fetch(`/api/imap/sync/${id}`, { method: "POST" })
    const data = await res.json()
    setSyncing(null)
    if (data.synced !== undefined) {
      if (data.synced > 0) {
        toast.success(`${data.synced} email(s) synced`)
        router.push(`/${workspaceId}/inbox`)
      } else {
        toast.error("No emails found to sync. Check your mailbox or IMAP settings.")
      }
    } else {
      toast.error(data.error || "Sync failed")
    }
    if (expandedId === id) loadSyncLogs(id)
  }

  async function handleToggleExpand(accountId: string) {
    if (expandedId === accountId) {
      setExpandedId(null)
    } else {
      setExpandedId(accountId)
      await Promise.all([loadSyncLogs(accountId), loadFolderMappings(accountId)])
    }
  }

  async function handleAddFolderMapping(accountId: string) {
    if (!newRemoteFolder) return
    const res = await fetch("/api/imap/folder-mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: accountId, remote_folder: newRemoteFolder, local_folder: newLocalFolder }),
    })
    if (res.ok) {
      setNewRemoteFolder("")
      setNewLocalFolder("inbox")
      loadFolderMappings(accountId)
      toast.success("Folder mapping added")
    } else {
      const d = await res.json()
      toast.error(d.error || "Failed")
    }
  }

  async function handleDeleteFolderMapping(mappingId: string, accountId: string) {
    await fetch(`/api/imap/folder-mappings?id=${mappingId}`, { method: "DELETE" })
    loadFolderMappings(accountId)
  }

  async function handleUpdateFrequency(accountId: string, frequency: number) {
    await fetch(`/api/imap/accounts/${accountId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sync_frequency: frequency }),
    })
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, sync_frequency: frequency } : a))
    toast.success("Sync frequency updated")
  }

  return (
    <>
      <PageHeader title="IMAP Sync" description="Import emails from external mailboxes"
        actions={<Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {showForm && (
            <div className="mb-8 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Account name (e.g. Gmail)" />
              <div className="grid grid-cols-3 gap-3">
                <Input value={host} onChange={e => setHost(e.target.value)} placeholder="imap.gmail.com" className="col-span-2" />
                <Input value={port} onChange={e => setPort(e.target.value)} placeholder="993" />
              </div>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Email address" />
              <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="App password" />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sync Frequency</label>
                <Select value={syncFreq} onChange={e => setSyncFreq(Number(e.target.value))}>
                  {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={useTls} onChange={e => setUseTls(e.target.checked)} />
                Use TLS/SSL
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add & Sync
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.length === 0 && (
                <EmptyState
                  icon={RefreshCw}
                  title="No IMAP connections yet"
                  description="Connect an external email account to sync messages into MailForge"
                  action={{ label: "Add Connection", onClick: () => setShowForm(true) }}
                />
              )}
              {accounts.map(acc => (
                <div key={acc.id}>
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{acc.name || acc.host}</p>
                        <p className="text-xs text-gray-500">{acc.username}</p>
                        <p className="text-xs text-gray-400">{FREQ_OPTIONS.find(f => f.value === acc.sync_frequency)?.label || "Manual"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleExpand(acc.id)}>
                        <List className={`h-4 w-4 ${expandedId === acc.id ? "text-blue-500" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => triggerSync(acc.id)} disabled={syncing === acc.id}>
                        <RefreshCw className={`h-4 w-4 ${syncing === acc.id ? "animate-spin" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(acc.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {expandedId === acc.id && (
                    <div className="ml-6 mt-2 mb-4 space-y-4">
                      {/* Sync Frequency */}
                      <div className="flex items-center gap-2 text-sm p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Sync frequency:</span>
                        <Select value={acc.sync_frequency} onChange={e => handleUpdateFrequency(acc.id, Number(e.target.value))} className="text-sm w-auto">
                          {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Select>
                      </div>

                      {/* Folder Mappings */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                          <List className="h-3 w-3" />
                          Folder Mappings
                        </h4>
                        {(folderMappings[acc.id] || []).map(fm => (
                          <div key={fm.id} className="flex items-center justify-between text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded">
                            <span className="text-gray-700 dark:text-gray-300">{fm.remote_folder} → {fm.local_folder}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeleteFolderMapping(fm.id, acc.id)}>
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                          <Input value={newRemoteFolder}
                            onChange={e => setNewRemoteFolder(e.target.value)}
                            placeholder="IMAP folder (e.g. INBOX)" className="text-xs flex-1" />
                          <Select value={newLocalFolder} onChange={e => setNewLocalFolder(e.target.value)} className="text-xs w-auto">
                            {LOCAL_FOLDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </Select>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddFolderMapping(acc.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Sync Logs */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                          <History className="h-3 w-3" />
                          Sync History
                        </h4>
                        {(syncLogs[acc.id] || []).length === 0 && (
                          <p className="text-xs text-gray-400">No sync logs yet</p>
                        )}
                        {(syncLogs[acc.id] || []).map(log => (
                          <div key={log.id} className="flex items-center justify-between text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${log.status === "completed" ? "bg-emerald-500" : log.status === "failed" ? "bg-red-500" : "bg-yellow-500"}`} />
                              <span className="text-gray-600">{log.status}</span>
                              <span className="text-gray-400">{log.messages_synced} msg</span>
                            </div>
                            <span className="text-gray-400">{new Date(log.started_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, RefreshCw, Server, CheckCircle, XCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface ImapAccount {
  id: string
  name: string
  host: string
  port: number
  username: string
  use_tls: boolean
  created_at: string
}

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
  const [useTls, setUseTls] = useState(true)
  const [error, setError] = useState("")
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data } = await supabase.from("imap_accounts").select("id, name, host, port, username, use_tls, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
    setAccounts(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    setError("")
    setTestResult(null)
    if (!host || !username || !password) { setError("All fields required"); return }

    const res = await fetch("/api/imap/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, host, port: parseInt(port), username, password, use_tls: useTls }),
    })

    if (!res.ok) { const d = await res.json(); setError(d.error); return }

    setName(""); setHost(""); setPort("993"); setUsername(""); setPassword(""); setUseTls(true)
    setShowForm(false)
    loadAccounts()

    // Auto-sync after adding
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
      router.push("/inbox")
    }
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
                <p className="text-sm text-gray-400 text-center py-10">
                  No IMAP accounts configured. Add one to import emails from external mailboxes.
                </p>
              )}
              {accounts.map(acc => (
                <div key={acc.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{acc.name || acc.host}</p>
                      <p className="text-sm text-gray-500">{acc.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerSync(acc.id)}
                      disabled={syncing === acc.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing === acc.id ? "animate-spin" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(acc.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

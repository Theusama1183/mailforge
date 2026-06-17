"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { Plus, Trash2, Globe, Mail, Loader2, Server, Settings2, RefreshCw, Cloud, CheckCircle, XCircle, ArrowRight, LogIn, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

const SMTP_PROVIDERS = [
  { value: "gmail", label: "Gmail SMTP", host: "smtp.gmail.com", port: 587 },
  { value: "mailgun", label: "Mailgun API", host: "", port: 587 },
  { value: "custom", label: "Custom SMTP", host: "", port: 587 },
]

interface CfDomain {
  id: string; name: string; status: string
}
interface CfEmail {
  domain: string; zoneId: string; ruleId: string
  localPart: string; fullAddress: string
  action: string; actionValue: string
  enabled: boolean; isCatchAll: boolean
}

export default function SettingsPage() {
  const [step, setStep] = useState<"connect" | "import" | "ready">("connect")
  const [cfToken, setCfToken] = useState("")
  const [cfDomains, setCfDomains] = useState<CfDomain[]>([])
  const [cfEmails, setCfEmails] = useState<CfEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncingRoutes, setSyncingRoutes] = useState(false)
  const [domains, setDomains] = useState<any[]>([])
  const [emailAddresses, setEmailAddresses] = useState<any[]>([])
  const [newLocalPart, setNewLocalPart] = useState("")
  const [selectedDomainIndex, setSelectedDomainIndex] = useState(0)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params?.workspaceId
  const supabase = createClient()

  useEffect(() => { fetchLocalData() }, [workspaceId])

  const fetchLocalData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    // Fetch domains owned by user
    const [dRes] = await Promise.all([
      supabase.from("domains").select("*").eq("user_id", user.id),
    ])
    if (dRes.data) setDomains(dRes.data)

    // Fetch email addresses — filter by workspace_id if set, otherwise fall back to user-owned
    let eQuery = supabase
      .from("email_addresses")
      .select("*, domains!inner(domain, user_id)")
      .eq("domains.user_id", user.id)

    if (workspaceId) {
      eQuery = eQuery.eq("workspace_id", workspaceId)
    } else {
      eQuery = eQuery.is("workspace_id", null)
    }

    const eRes = await eQuery
    if (eRes.data) setEmailAddresses(eRes.data)
    if (dRes.data?.length) setStep("ready")
    setPageLoading(false)
  }

  const handleConnect = async () => {
    if (!cfToken) { toast.error("Enter your Cloudflare API token"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/cloudflare/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cfToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCfDomains(data.domains)
      setCfEmails(data.emailAddresses)
      setStep("import")
      toast.success(`Found ${data.domains.length} domain(s) with ${data.emailAddresses.length} route(s)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  const handleImportSelected = async () => {
    setImporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const res = await fetch("/api/import-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: cfDomains,
          emails: cfEmails,
          userId: user.id,
          cfToken,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        const failed = data.results?.filter((r: any) => r.status === "error") || []
        const msg = failed.map((r: any) => `${r.domain}: ${r.error}`).join(", ")
        throw new Error(data.message + (msg ? ` (${msg})` : ""))
      }

      toast.success("Imported successfully!")
      await fetchLocalData()
      setStep("ready")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  const handleAddEmail = async () => {
    if (!newLocalPart || domains.length === 0) { toast.error("Select a domain"); return }
    try {
      const domain = domains[selectedDomainIndex]
      const insertData: any = {
        domain_id: domain.id, local_part: newLocalPart,
      }
      // Associate email with current workspace
      if (workspaceId) {
        insertData.workspace_id = workspaceId
      }
      const { error } = await supabase.from("email_addresses").insert(insertData)
      if (error) throw error

      if (domain.cloudflare_token && domain.zone_id) {
        fetch("/api/email-routing/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domainId: domain.id, localPart: newLocalPart, domainName: domain.domain }),
        }).then(r => r.json()).then(data => {
          if (data.success) toast.success(`Cloudflare route created`)
        }).catch(() => {})
      }

      toast.success(`Created ${newLocalPart}@${domain.domain}`)
      setNewLocalPart("")
      fetchLocalData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (table === "email_addresses") {
      try {
        const res = await fetch(`/api/email-routing/route?id=${id}`, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete")
      }
    } else {
      await supabase.from(table).delete().eq("id", id)
    }
    fetchLocalData()
  }

  const handleSaveSmtp = async (domain: any) => {
    setSyncing(domain.id)
    try {
      const { error } = await supabase.from("domains").update({
        smtp_provider: domain.smtp_provider,
        smtp_host: domain.smtp_host,
        smtp_port: domain.smtp_port,
        smtp_username: domain.smtp_username,
        smtp_password: domain.smtp_password,
        mailgun_api_key: domain.smtp_provider === "mailgun" ? domain.mailgun_api_key : null,
      }).eq("id", domain.id)
      if (error) throw error
      toast.success("SMTP saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncRoutes = async () => {
    setSyncingRoutes(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: userDomains } = await supabase.from("domains").select("*").eq("user_id", user.id)
      if (!userDomains?.length) { toast.error("No domains configured"); return }

      let total = 0
      for (const d of userDomains) {
        if (!d.cloudflare_token || !d.zone_id) continue

        const { data: addrs } = await supabase.from("email_addresses").select("local_part").eq("domain_id", d.id)
        if (!addrs?.length) continue

        const res = await fetch("/api/import-domains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domains: [{ id: d.zone_id, name: d.domain }],
            emails: addrs.map((a: any) => ({
              domain: d.domain,
              localPart: a.local_part,
              isCatchAll: false,
            })),
            userId: user.id,
            cfToken: d.cloudflare_token,
          }),
        })
        const data = await res.json()
        if (data.success) {
          total += data.results?.[0]?.routes || 0
        }
      }

      if (total > 0) toast.success(`${total} routing rule(s) synced to Worker`)
      else toast.success("All routes already point to Worker")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setSyncingRoutes(false)
    }
  }

  const updateDomain = (id: string, field: string, value: any) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  const handleProviderChange = (domain: any, provider: string) => {
    const config = SMTP_PROVIDERS.find(p => p.value === provider)
    updateDomain(domain.id, "smtp_provider", provider)
    if (config) { updateDomain(domain.id, "smtp_host", config.host); updateDomain(domain.id, "smtp_port", config.port) }
  }

  if (pageLoading) return (
    <div className="flex items-center justify-center h-screen"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader title="Settings" description="Manage domains, SMTP, and email addresses" />

      <div className="p-6">
        {step === "connect" && (
          <div className="max-w-lg mx-auto mt-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Connect Cloudflare</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Enter your Cloudflare API token to auto-import domains and email routes
            </p>
            <div className="space-y-4 max-w-sm mx-auto">
              <Input
                value={cfToken}
                onChange={(e) => setCfToken(e.target.value)}
                placeholder="cfut_... (Cloudflare API token)"
                className="text-center"
              />
              <Button onClick={handleConnect} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Connect & Import
              </Button>
              <p className="text-xs text-gray-400">
                Token needs: Zones Read + Email Routing Read permissions
              </p>
            </div>
          </div>
        )}

        {step === "import" && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cloudflare Connected</h2>
                <p className="text-sm text-gray-500">{cfDomains.length} domain(s) · {cfEmails.filter(e => !e.isCatchAll).length} email route(s)</p>
              </div>
            </div>

            {cfDomains.map(d => {
              const domainEmails = cfEmails.filter(e => e.domain === d.name && !e.isCatchAll)
              const catchAll = cfEmails.find(e => e.domain === d.name && e.isCatchAll)
              return (
                <div key={d.id} className="mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{d.name}</span>
                    <span className="text-xs text-gray-400 capitalize">({d.status})</span>
                  </div>
                  {catchAll && (
                    <div className="text-xs text-gray-400 mb-2">
                      Catch-all: {catchAll.actionValue || "none"}
                    </div>
                  )}
                  <div className="space-y-1">
                    {domainEmails.map(e => (
                      <div key={e.ruleId} className="flex items-center justify-between text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">{e.fullAddress}</span>
                        <span className="text-xs text-gray-400">
                          {e.action === "worker" ? "→ Worker" : e.action === "forward" ? `→ ${e.actionValue}` : "→ Drop"}
                        </span>
                      </div>
                    ))}
                    {domainEmails.length === 0 && <p className="text-sm text-gray-400">No email routes</p>}
                  </div>
                </div>
              )
            })}

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep("connect")} variant="outline">Cancel</Button>
              <Button onClick={handleImportSelected} disabled={importing} className="gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Import to MailForge
              </Button>
            </div>
          </div>
        )}

        {step === "ready" && (
          <>
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
              <Cloud className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Cloudflare Connected</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{domains.length} domain(s) · {emailAddresses.length} email address(es)</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="link" size="sm" onClick={handleSyncRoutes} disabled={syncingRoutes} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  {syncingRoutes ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpDown className="h-3 w-3" />}
                  Sync Routes
                </Button>
                <Button variant="link" size="sm" onClick={() => { setStep("connect"); setCfToken("") }} className="text-xs text-emerald-600 dark:text-emerald-400">
                  Reconnect
                </Button>
              </div>
            </div>

            <section className="mb-8 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                Domains & SMTP
              </h3>
              {domains.map((d) => (
                <div key={d.id} className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.domain}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("domains", d.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-gray-400" />
                      SMTP Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Provider</label>
                        <Select value={d.smtp_provider || "gmail"} onChange={(e) => handleProviderChange(d, e.target.value)}>
                          {SMTP_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </Select>
                      </div>
                      {d.smtp_provider === "mailgun" ? (
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mailgun API Key</label>
                          <Input value={d.mailgun_api_key || ""} onChange={(e) => updateDomain(d.id, "mailgun_api_key", e.target.value)} type="password" placeholder="key-..." />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">SMTP Host</label>
                            <Input value={d.smtp_host || ""} onChange={(e) => updateDomain(d.id, "smtp_host", e.target.value)} placeholder="smtp.gmail.com" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Port</label>
                            <Input value={d.smtp_port || 587} onChange={(e) => updateDomain(d.id, "smtp_port", parseInt(e.target.value) || 587)} type="number" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Username</label>
                            <Input value={d.smtp_username || ""} onChange={(e) => updateDomain(d.id, "smtp_username", e.target.value)} placeholder="user@gmail.com" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Password / App Password</label>
                            <Input value={d.smtp_password || ""} onChange={(e) => updateDomain(d.id, "smtp_password", e.target.value)} type="password" placeholder="App password" />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      <Button size="sm" onClick={() => handleSaveSmtp(d)} disabled={syncing === d.id}>
                        {syncing === d.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}
                        Save SMTP
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="mb-8">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Create Email Address
              </h3>
              <div className="flex items-center gap-2 max-w-lg">
                <Input value={newLocalPart} onChange={(e) => setNewLocalPart(e.target.value)} placeholder="you" className="flex-1" />
                <span className="text-gray-400 text-sm">@</span>
                <Select value={selectedDomainIndex} onChange={(e) => setSelectedDomainIndex(Number(e.target.value))}>
                  {domains.map((d, i) => <option key={d.id} value={i}>{d.domain}</option>)}
                </Select>
                <Button onClick={handleAddEmail} size="sm"><Plus className="h-4 w-4 mr-1" /> Create</Button>
              </div>
            </section>

            <section>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Email Addresses</h3>
              <div className="space-y-2">
                {emailAddresses.map((ea) => (
                  <div key={ea.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ea.local_part}@{ea.domains?.domain}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("email_addresses", ea.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                {emailAddresses.length === 0 && <p className="text-sm text-gray-400">Import from Cloudflare to see your emails</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

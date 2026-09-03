"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import {
  Plus, Trash2, Globe, Mail, Loader2, Server, Settings2, RefreshCw, Cloud,
  CheckCircle, XCircle, LogIn, ArrowUpDown, PenLine, Check,
  User, Bell, Plane, Forward, Ban, Users, MailCheck, Lock, Key, Smartphone, Shield, ShieldOff, Network, Fingerprint,
} from "lucide-react"
import { toast } from "sonner"
import type { SettingsTab, VacationAutoreply, ForwardingRule, BlockedSender, TrustedSender } from "@/types"

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

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "vacation", label: "Vacation", icon: <Plane className="h-4 w-4" /> },
  { id: "forwarding", label: "Forwarding", icon: <Forward className="h-4 w-4" /> },
  { id: "blocks", label: "Blocks", icon: <Ban className="h-4 w-4" /> },
  { id: "domains", label: "Domains", icon: <Globe className="h-4 w-4" /> },
  { id: "signatures", label: "Signatures", icon: <PenLine className="h-4 w-4" /> },
  { id: "team", label: "Team", icon: <Users className="h-4 w-4" /> },
]

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params?.workspaceId
  const supabase = createClient()

  useEffect(() => { fetchLocalData() }, [workspaceId])

  const fetchLocalData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const [dRes, userRes] = await Promise.all([
      supabase.from("domains").select("*").eq("user_id", user.id),
      fetch("/api/user/profile").then(r => r.json()),
    ])
    if (dRes.data) setDomains(dRes.data)
    setUserData(userRes)

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
      toast.error(err instanceof Error ? err.message : err as string || "Connection failed")
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
      const insertData: any = { domain_id: domain.id, local_part: newLocalPart }
      if (workspaceId) insertData.workspace_id = workspaceId
      const { error } = await supabase.from("email_addresses").insert(insertData)
      if (error) throw error

      if (domain.cloudflare_token && domain.zone_id) {
        fetch("/api/email-routing/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domainId: domain.id, localPart: newLocalPart, domainName: domain.domain }),
        }).then(r => r.json()).then(data => {
          if (data.success) toast.success("Cloudflare route created")
        }).catch(() => {})
      }

      toast.success(`Created ${newLocalPart}@${domain.domain}`)
      setNewLocalPart("")
      fetchLocalData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  const handleDeleteEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/email-routing/route?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
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
            emails: addrs.map((a: any) => ({ domain: d.domain, localPart: a.local_part, isCatchAll: false })),
            userId: user.id,
            cfToken: d.cloudflare_token,
          }),
        })
        const data = await res.json()
        if (data.success) total += data.results?.[0]?.routes || 0
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

  if (step !== "ready") {
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
                <Input value={cfToken} onChange={(e) => setCfToken(e.target.value)} placeholder="cfut_... (Cloudflare API token)" className="text-center" />
                <Button onClick={handleConnect} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Connect & Import
                </Button>
                <p className="text-xs text-gray-400">Token needs: Zones Read + Email Routing Read permissions</p>
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
                    {catchAll && <div className="text-xs text-gray-400 mb-2">Catch-all: {catchAll.actionValue || "none"}</div>}
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader title="Settings" description="Manage your account, domains, and preferences" />

      <div className="flex items-center gap-3 mx-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
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
          <Button variant="link" size="sm" onClick={() => { setStep("connect"); setCfToken("") }} className="text-xs text-emerald-600 dark:text-emerald-400">Reconnect</Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-6">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "profile" && <ProfileSection userData={userData} onUpdate={setUserData} />}
        {activeTab === "security" && <SecuritySection workspaceId={workspaceId} />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "vacation" && <VacationSection />}
        {activeTab === "forwarding" && <ForwardingSection />}
        {activeTab === "blocks" && <BlocksSection />}
        {activeTab === "domains" && (
          <DomainsSection
            domains={domains}
            emailAddresses={emailAddresses}
            newLocalPart={newLocalPart}
            setNewLocalPart={setNewLocalPart}
            selectedDomainIndex={selectedDomainIndex}
            setSelectedDomainIndex={setSelectedDomainIndex}
            syncing={syncing}
            onAddEmail={handleAddEmail}
            onDeleteEmail={handleDeleteEmail}
            onSaveSmtp={handleSaveSmtp}
            onUpdateDomain={updateDomain}
            onProviderChange={handleProviderChange}
          />
        )}
        {activeTab === "signatures" && <SignaturesSection />}
        {activeTab === "team" && <TeamSection workspaceId={workspaceId} />}
      </div>
    </div>
  )
}

/* ───── Profile Section ───── */
function ProfileSection({ userData, onUpdate }: { userData: any; onUpdate: (d: any) => void }) {
  const supabase = createClient()
  const [name, setName] = useState(userData?.name || "")
  const [timezone, setTimezone] = useState(userData?.profile?.timezone || "UTC")
  const [language, setLanguage] = useState(userData?.profile?.language || "en")
  const [avatarUrl, setAvatarUrl] = useState(userData?.profile?.avatar_url || "")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, language, avatar_url: avatarUrl || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      onUpdate(data)
      toast.success("Profile saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const presignRes = await fetch("/api/user/avatar", { method: "POST" })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error)

      const uploadRes = await fetch(presignData.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadRes.ok) throw new Error("Upload failed")

      const publicUrl = presignData.url.split("?")[0]
      setAvatarUrl(publicUrl)
      toast.success("Avatar uploaded. Save profile to apply.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland"]
  const LANGUAGES = [{ value: "en", label: "English" }]

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" loading="lazy" className="w-full h-full object-cover" /> : (userData?.name?.[0] || userData?.email?.[0] || "U").toUpperCase()}
          </div>
          <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
            {uploading ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Plus className="h-3.5 w-3.5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData?.email}</p>
          <p className="text-xs text-gray-500">PNG or JPG, max 2MB</p>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Timezone</label>
        <Select value={timezone} onChange={e => setTimezone(e.target.value)}>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </Select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Language</label>
        <Select value={language} onChange={e => setLanguage(e.target.value)}>
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </Select>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save Profile
      </Button>
    </div>
  )
}

/* ───── Notifications Section ───── */
function NotificationsSection() {
  const [emailPrefs, setEmailPrefs] = useState({
    email_received: true,
    email_opened: false,
    email_clicked: false,
    email_bounced: true,
    email_failed: true,
  })
  const [saving, setSaving] = useState(false)

  const toggle = (key: string, value: boolean) => {
    setEmailPrefs(prev => ({ ...prev, [key]: value }))
  }

  const EVENT_LABELS: Record<string, string> = {
    email_received: "Email received",
    email_opened: "Email opened",
    email_clicked: "Link clicked",
    email_bounced: "Email bounced",
    email_failed: "Send failed",
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem("mailforge_notification_prefs", JSON.stringify(emailPrefs))
      toast.success("Notification preferences saved")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      {Object.keys(emailPrefs).map(key => (
        <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-sm text-gray-900 dark:text-gray-100">{EVENT_LABELS[key] || key}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailPrefs[key as keyof typeof emailPrefs]}
              onChange={e => toggle(key, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
            />
            <span className="text-xs text-gray-500">Email</span>
          </label>
        </div>
      ))}
      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save Preferences
      </Button>
    </div>
  )
}

/* ───── Vacation Section ───── */
function VacationSection() {
  const [vacation, setVacation] = useState<VacationAutoreply | null>(null)
  const [subject, setSubject] = useState("Auto-reply: Out of office")
  const [body, setBody] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/vacation-autoreply").then(r => r.json()).then(data => {
      if (data && data.id) {
        setVacation(data)
        setSubject(data.subject || "")
        setBody(data.body || "")
        setEnabled(data.enabled || false)
        setStartDate(data.start_date ? data.start_date.slice(0, 16) : "")
        setEndDate(data.end_date ? data.end_date.slice(0, 16) : "")
      } else {
        setBody("I am currently out of the office and will respond to your message as soon as possible.")
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/vacation-autoreply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject, body, enabled,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          end_date: endDate ? new Date(endDate).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setVacation(data)
      toast.success(enabled ? "Vacation auto-reply enabled" : "Vacation auto-reply disabled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await fetch("/api/vacation-autoreply", { method: "DELETE" })
    setVacation(null)
    setEnabled(false)
    toast.success("Vacation auto-reply removed")
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable auto-reply</span>
        </label>
      </div>

      {enabled && (
        <>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Message</label>
            <textarea
              value={body} onChange={e => setBody(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
              <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
              <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save
        </Button>
        {vacation && (
          <Button variant="outline" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

/* ───── Forwarding Section ───── */
function ForwardingSection() {
  const [rules, setRules] = useState<ForwardingRule[]>([])
  const [destination, setDestination] = useState("")
  const [keepCopy, setKeepCopy] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/forwarding").then(r => r.json()).then(data => {
      setRules(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!destination) { toast.error("Enter a destination email"); return }
    const res = await fetch("/api/forwarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, keep_copy: keepCopy }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setRules(prev => [data, ...prev])
    setDestination("")
    toast.success("Forwarding rule created")
  }

  const handleToggle = async (rule: ForwardingRule) => {
    const res = await fetch("/api/forwarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    })
    if (res.ok) {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/forwarding?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setRules(prev => prev.filter(r => r.id !== id))
      toast.success("Forwarding rule removed")
    }
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="forward-to@example.com" className="flex-1" />
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <input type="checkbox" checked={keepCopy} onChange={e => setKeepCopy(e.target.checked)} className="rounded border-gray-300" />
        Keep a copy in inbox
      </label>

      {rules.length === 0 && <p className="text-sm text-gray-400">No forwarding rules configured.</p>}
      {rules.map(rule => (
        <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button onClick={() => handleToggle(rule)} className={`w-8 h-5 rounded-full transition-colors ${rule.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${rule.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.destination}</p>
              {rule.keep_copy && <p className="text-xs text-gray-400">Keep copy</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ))}
    </div>
  )
}

/* ───── Blocks Section ───── */
function BlocksSection() {
  const [blocked, setBlocked] = useState<BlockedSender[]>([])
  const [trusted, setTrusted] = useState<TrustedSender[]>([])
  const [pattern, setPattern] = useState("")
  const [patternType, setPatternType] = useState<"email" | "domain">("email")
  const [blockTab, setBlockTab] = useState<"blocked" | "trusted">("blocked")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/blocked-senders").then(r => r.json()),
      fetch("/api/trusted-senders").then(r => r.json()),
    ]).then(([b, t]) => {
      setBlocked(Array.isArray(b) ? b : [])
      setTrusted(Array.isArray(t) ? t : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleAdd = async (type: "blocked" | "trusted") => {
    if (!pattern) { toast.error("Enter a pattern"); return }
    const endpoint = type === "blocked" ? "/api/blocked-senders" : "/api/trusted-senders"
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern, pattern_type: patternType }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    if (type === "blocked") setBlocked(prev => [data, ...prev])
    else setTrusted(prev => [data, ...prev])
    setPattern("")
    toast.success("Added")
  }

  const handleDelete = async (type: "blocked" | "trusted", id: string) => {
    const endpoint = type === "blocked" ? "/api/blocked-senders" : "/api/trusted-senders"
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      if (type === "blocked") setBlocked(prev => prev.filter(s => s.id !== id))
      else setTrusted(prev => prev.filter(s => s.id !== id))
      toast.success("Removed")
    }
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setBlockTab("blocked")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${blockTab === "blocked" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>Blocked</button>
        <button onClick={() => setBlockTab("trusted")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${blockTab === "trusted" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>Trusted</button>
      </div>

      <div className="flex items-center gap-2">
        <Input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="user@example.com or @example.com" className="flex-1" />
        <Select value={patternType} onChange={e => setPatternType(e.target.value as "email" | "domain")}>
          <option value="email">Email</option>
          <option value="domain">Domain</option>
        </Select>
        <Button size="sm" onClick={() => handleAdd(blockTab)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      {blockTab === "blocked" && (
        blocked.length === 0 ? <p className="text-sm text-gray-400">No blocked senders</p> : (
          <div className="space-y-2">
            {blocked.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-red-100 dark:border-red-900/30 dark:bg-red-950/20">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.pattern}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.pattern_type}{s.reason ? ` · ${s.reason}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete("blocked", s.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
              </div>
            ))}
          </div>
        )
      )}

      {blockTab === "trusted" && (
        trusted.length === 0 ? <p className="text-sm text-gray-400">No trusted senders</p> : (
          <div className="space-y-2">
            {trusted.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.pattern}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.pattern_type}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete("trusted", s.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

/* ───── Domains & SMTP Section ───── */
function DomainsSection({
  domains, emailAddresses, newLocalPart, setNewLocalPart,
  selectedDomainIndex, setSelectedDomainIndex, syncing,
  onAddEmail, onDeleteEmail, onSaveSmtp, onUpdateDomain, onProviderChange,
}: {
  domains: any[]; emailAddresses: any[]; newLocalPart: string; setNewLocalPart: (v: string) => void
  selectedDomainIndex: number; setSelectedDomainIndex: (v: number) => void; syncing: string | null
  onAddEmail: () => void; onDeleteEmail: (id: string) => void
  onSaveSmtp: (domain: any) => void; onUpdateDomain: (id: string, field: string, value: any) => void
  onProviderChange: (domain: any, provider: string) => void
}) {
  const [smtpTestResult, setSmtpTestResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [testingSmtp, setTestingSmtp] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({})
  const [catchAllConfig, setCatchAllConfig] = useState<Record<string, { enabled: boolean; target: string }>>({})
  const [aliasMap, setAliasMap] = useState<Record<string, any[]>>({})

  useEffect(() => {
    domains.forEach(d => {
      fetch(`/api/domains/${d.id}/catch-all`).then(r => r.json()).then(data => {
        setCatchAllConfig(prev => ({ ...prev, [d.id]: { enabled: data.enabled, target: data.catchAll?.email || "" } }))
      }).catch(() => {})
      fetch(`/api/email-aliases?domain_id=${d.id}`).then(r => r.json()).then(data => {
        if (Array.isArray(data)) setAliasMap(prev => ({ ...prev, [d.id]: data }))
      }).catch(() => {})
    })
  }, [domains])

  const handleTestSmtp = async (domain: any) => {
    setTestingSmtp(domain.id)
    setSmtpTestResult(null)
    try {
      const res = await fetch("/api/settings/smtp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: domain.smtp_host,
          port: domain.smtp_port || 587,
          username: domain.smtp_username,
          password: domain.smtp_password,
          secure: domain.smtp_port === 465,
        }),
      })
      const data = await res.json()
      setSmtpTestResult(data)
    } catch (err) {
      setSmtpTestResult({ success: false, message: "Connection failed" })
    } finally {
      setTestingSmtp(null)
    }
  }

  const handleVerify = async (domainId: string) => {
    setVerifying(domainId)
    try {
      const res = await fetch(`/api/domains/${domainId}/verify`, { method: "POST" })
      const data = await res.json()
      setVerifyResults(prev => ({ ...prev, [domainId]: data }))
      if (data.allPassed) toast.success("All DNS checks passed!")
    } catch (err) {
      toast.error("Verification failed")
    } finally {
      setVerifying(null)
    }
  }

  const handleSetCatchAll = async (domainId: string, enabled: boolean, target: string) => {
    const res = await fetch(`/api/domains/${domainId}/catch-all`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, emailAddress: target }),
    })
    if (res.ok) {
      setCatchAllConfig(prev => ({ ...prev, [domainId]: { enabled, target } }))
      toast.success(enabled ? "Catch-all enabled" : "Catch-all disabled")
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-500" />
          Domains & SMTP
        </h3>
        {domains.map((d) => {
          const vResult = verifyResults[d.id]
          const cc = catchAllConfig[d.id]
          return (
          <div key={d.id} className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.domain}</p>
                  {d.verified_at && <span className="text-[10px] text-emerald-500">Verified</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleVerify(d.id)} disabled={verifying === d.id}>
                  {verifying === d.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                  Verify
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete domain?")) supabaseDelete("domains", d.id) }}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>

            {vResult && (
              <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 space-y-1 text-xs">
                {Object.entries(vResult.checks || {}).map(([key, pass]) => (
                  <div key={key} className="flex items-center gap-2">
                    {pass ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    <span className="capitalize text-gray-700 dark:text-gray-300">{key}</span>
                    <span className="text-gray-400 ml-auto truncate max-w-[200px]">{vResult.results?.[key]}</span>
                  </div>
                ))}
                {!d.verified_at && vResult.verificationToken && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <p className="text-gray-500 mb-1">Add this TXT record to verify ownership:</p>
                    <code className="block bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs break-all font-mono">{vResult.verificationToken}</code>
                  </div>
                )}
                {vResult.allPassed && <p className="text-emerald-600 font-medium pt-1">All checks passed</p>}
              </div>
            )}

            {/* Catch-all Toggle */}
            {cc && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" checked={cc.enabled} onChange={(e) => {
                      if (!e.target.checked) handleSetCatchAll(d.id, false, "")
                    }} />
                    Catch-all
                  </label>
                  {cc.enabled && (
                    <Select value={cc.target} onChange={(e) => handleSetCatchAll(d.id, true, e.target.value)} className="text-sm">
                      <option value="">Select target...</option>
                      {emailAddresses.filter(ea => ea.domains?.domain === d.domain).map(ea => (
                        <option key={ea.id} value={ea.local_part + "@" + ea.domains?.domain}>
                          {ea.local_part}@{ea.domains?.domain}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-gray-400" />
                SMTP Configuration
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Provider</label>
                  <Select value={d.smtp_provider || "gmail"} onChange={(e) => onProviderChange(d, e.target.value)}>
                    {SMTP_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </Select>
                </div>
                {d.smtp_provider === "mailgun" ? (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mailgun API Key</label>
                    <Input value={d.mailgun_api_key || ""} onChange={(e) => onUpdateDomain(d.id, "mailgun_api_key", e.target.value)} type="password" placeholder="key-..." />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">SMTP Host</label>
                      <Input value={d.smtp_host || ""} onChange={(e) => onUpdateDomain(d.id, "smtp_host", e.target.value)} placeholder="smtp.gmail.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Port</label>
                      <Input value={d.smtp_port || 587} onChange={(e) => onUpdateDomain(d.id, "smtp_port", parseInt(e.target.value) || 587)} type="number" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Username</label>
                      <Input value={d.smtp_username || ""} onChange={(e) => onUpdateDomain(d.id, "smtp_username", e.target.value)} placeholder="user@gmail.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Password / App Password</label>
                      <Input value={d.smtp_password || ""} onChange={(e) => onUpdateDomain(d.id, "smtp_password", e.target.value)} type="password" placeholder="App password" />
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onSaveSmtp(d)} disabled={syncing === d.id}>
                  {syncing === d.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}
                  Save SMTP
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTestSmtp(d)} disabled={testingSmtp === d.id}>
                  {testingSmtp === d.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MailCheck className="h-4 w-4 mr-2" />}
                  Test
                </Button>
              </div>
              {smtpTestResult && (
                <div className={`mt-2 text-xs ${smtpTestResult.success ? "text-emerald-600" : "text-red-500"}`}>
                  {smtpTestResult.message}
                </div>
              )}
            </div>

            {/* Aliases for this domain */}
            {aliasMap[d.id]?.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Aliases</h4>
                <div className="space-y-1">
                  {aliasMap[d.id].map((alias: any) => (
                    <div key={alias.id} className="flex items-center justify-between text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-700 dark:text-gray-300">
                        {alias.email}
                        {alias.is_catch_all && <span className="ml-1 text-[10px] text-blue-500">(catch-all)</span>}
                        {alias.alias_for && <span className="ml-1 text-gray-400">→ {alias.alias_target?.email || "forwarded"}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )})}
      </section>

      <section>
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
          <Button onClick={onAddEmail} size="sm"><Plus className="h-4 w-4 mr-1" /> Create</Button>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Email Addresses</h3>
        <div className="space-y-2">
          {emailAddresses.map((ea) => (
            <div key={ea.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ea.local_part}@{ea.domains?.domain}</p>
                {ea.is_catch_all && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">Catch-all</span>}
                {ea.alias_for && <span className="text-[10px] text-gray-400">Alias</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDeleteEmail(ea.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
          {emailAddresses.length === 0 && <p className="text-sm text-gray-400">Import from Cloudflare to see your emails</p>}
        </div>
      </section>
    </div>
  )
}

/* ───── Signatures Section ───── */
function SignaturesSection() {
  const supabase = createClient()
  const [sigs, setSigs] = useState<{ id: string; name: string; content: string; is_default: boolean }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from("user_signatures").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).then(({ data }) => {
        setSigs(data || [])
        setLoading(false)
      })
    })
  }, [supabase])

  const handleSave = async () => {
    if (!content) return
    if (editId) {
      await fetch(`/api/signatures/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      })
    } else {
      await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      })
    }
    setShowForm(false)
    setEditId(null)
    setName("")
    setContent("")
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("user_signatures").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
      setSigs(data || [])
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/signatures/${id}`, { method: "DELETE" })
    setSigs(prev => prev.filter(s => s.id !== id))
  }

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/signatures/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    })
    setSigs(prev => prev.map(s => ({ ...s, is_default: s.id === id })))
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Email Signatures</h3>
        <Button size="sm" variant="outline" onClick={() => { setEditId(null); setName(""); setContent(""); setShowForm(!showForm) }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> {showForm ? "Cancel" : "Add"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Signature name (e.g. Professional)" className="text-sm" />
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="Signature HTML content..."
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-24"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleSave} disabled={!content}>{editId ? "Update" : "Save"}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : sigs.length === 0 ? (
        <p className="text-sm text-gray-400">No signatures yet.</p>
      ) : (
        <div className="space-y-2">
          {sigs.map(s => (
            <div key={s.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                  {s.is_default && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">Default</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate" dangerouslySetInnerHTML={{ __html: s.content }} />
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {!s.is_default && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetDefault(s.id)} aria-label="Set as default">
                    <Check className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(s.id); setName(s.name); setContent(s.content); setShowForm(true) }} aria-label="Edit signature">
                  <PenLine className="h-3.5 w-3.5 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id)} aria-label="Delete signature">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───── Security Section ───── */
function SecuritySection({ workspaceId }: { workspaceId?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<"sessions" | "mfa" | "app-passwords" | "ip-allowlist" | "pgp">("sessions")
  const [sessions, setSessions] = useState<any[]>([])
  const [appPasswords, setAppPasswords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPasswordName, setNewPasswordName] = useState("")
  const [newPasswordScopes, setNewPasswordScopes] = useState<string[]>(["smtp", "imap"])
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // MFA state
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [enrollQr, setEnrollQr] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(true)
  // IP allowlist state
  const [ipEntries, setIpEntries] = useState<any[]>([])
  const [ipLoading, setIpLoading] = useState(true)
  const [newCidr, setNewCidr] = useState("")
  const [newCidrDesc, setNewCidrDesc] = useState("")
  const [addingIp, setAddingIp] = useState(false)
  // PGP state
  const [pgpKeys, setPgpKeys] = useState<any[]>([])
  const [pgpLoading, setPgpLoading] = useState(true)
  const [showAddPgp, setShowAddPgp] = useState(false)
  const [pgpEmail, setPgpEmail] = useState("")
  const [pgpPublicKey, setPgpPublicKey] = useState("")
  const [addingPgp, setAddingPgp] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      fetch("/api/sessions").then(r => r.json()),
      fetch("/api/app-passwords").then(r => r.json()),
      supabase.auth.mfa.listFactors().catch(() => ({ data: null })),
      fetch("/api/ip-allowlists").then(r => r.json()),
      fetch("/api/pgp-keys").then(r => r.json()),
    ]).then(([s, ap, factorsRes, ip, pgp]) => {
      setSessions(Array.isArray(s) ? s : [])
      setAppPasswords(Array.isArray(ap) ? ap : [])
      if (factorsRes?.data?.all) setMfaFactors(factorsRes.data.all)
      setIpEntries(Array.isArray(ip) ? ip : [])
      setPgpKeys(Array.isArray(pgp) ? pgp : [])
      setLoading(false)
      setMfaLoading(false)
      setIpLoading(false)
      setPgpLoading(false)
    }).catch(() => { setLoading(false); setMfaLoading(false); setIpLoading(false); setPgpLoading(false) })
  }, [])

  const revokeSession = async (id: string) => {
    const res = await fetch(`/api/sessions?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success("Session revoked")
    }
  }

  const revokeAllSessions = async () => {
    const res = await fetch("/api/sessions", { method: "DELETE" })
    if (res.ok) {
      setSessions([])
      toast.success("All sessions revoked")
    }
  }

  const createAppPassword = async () => {
    if (!newPasswordName.trim()) return
    setCreating(true)
    const res = await fetch("/api/app-passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPasswordName, scopes: newPasswordScopes }),
    })
    const data = await res.json()
    if (res.ok) {
      setCreatedPassword(data.plain_password)
      setNewPasswordName("")
      setShowNewPassword(false)
      fetch("/api/app-passwords").then(r => r.json()).then(setAppPasswords)
    } else {
      toast.error(data.error || "Failed")
    }
    setCreating(false)
  }

  const revokeAppPassword = async (id: string) => {
    const res = await fetch(`/api/app-passwords?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setAppPasswords(prev => prev.filter(ap => ap.id !== id))
      toast.success("App password revoked")
    }
  }

  const toggleScope = (scope: string) => {
    setNewPasswordScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    )
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveSubTab("sessions")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "sessions" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>
          <Lock className="h-3.5 w-3.5 inline mr-1" />Sessions
        </button>
        <button onClick={() => setActiveSubTab("mfa")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "mfa" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>
          <Smartphone className="h-3.5 w-3.5 inline mr-1" />2FA
        </button>
        <button onClick={() => setActiveSubTab("app-passwords")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "app-passwords" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>
          <Key className="h-3.5 w-3.5 inline mr-1" />App Passwords
        </button>
        <button onClick={() => setActiveSubTab("ip-allowlist")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "ip-allowlist" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>
          <Network className="h-3.5 w-3.5 inline mr-1" />IP Allowlist
        </button>
        <button onClick={() => setActiveSubTab("pgp")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === "pgp" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>
          <Fingerprint className="h-3.5 w-3.5 inline mr-1" />PGP Encryption
        </button>
      </div>

      {activeSubTab === "sessions" && (
        <div className="space-y-2">
          {sessions.length > 0 && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={revokeAllSessions} className="text-xs text-red-500">
                Sign out all devices
              </Button>
            </div>
          )}
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{s.device_type || s.user_agent?.slice(0, 60) || "Unknown device"}</p>
                <p className="text-xs text-gray-400">
                  {s.ip_address || "Unknown IP"} · Last active {new Date(s.last_active_at).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => revokeSession(s.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-gray-400">No active sessions</p>}
        </div>
      )}

      {activeSubTab === "mfa" && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Two-factor authentication adds an extra layer of security by requiring a one-time code from your phone.
          </div>

          {mfaLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : mfaFactors.filter((f: any) => f.status === "verified").length > 0 ? (
            <div className="space-y-2">
              {mfaFactors.filter((f: any) => f.status === "verified").map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{f.friendly_name || "Authenticator App"}</p>
                      <p className="text-xs text-gray-400">Verified · {f.factor_type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    const supabase = createClient()
                    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id })
                    if (error) { toast.error(error.message); return }
                    setMfaFactors(prev => prev.filter((x: any) => x.id !== f.id))
                    toast.success("2FA factor removed")
                  }}>
                    <ShieldOff className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          ) : enrolling && enrollQr ? (
            <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Scan this QR code with your authenticator app:</p>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <img src={enrollQr} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-gray-500">Enter the 6-digit code from your app to verify:</p>
              <div className="flex gap-2">
                <input
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 px-3 py-2 text-center text-lg tracking-widest rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
                <Button size="sm" onClick={async () => {
                  if (!factorId || verifyCode.length !== 6) return
                  setVerifying(true)
                  const supabase = createClient()
                  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
                  if (challengeError) { toast.error(challengeError.message); setVerifying(false); return }
                  const { error: verifyError } = await supabase.auth.mfa.verify({
                    factorId,
                    challengeId: challengeData.id,
                    code: verifyCode,
                  })
                  if (verifyError) { toast.error(verifyError.message); setVerifying(false); return }
                  setMfaFactors(prev => [...prev, { id: factorId, status: "verified", factor_type: "totp", friendly_name: "Authenticator" }])
                  setEnrolling(false)
                  setEnrollQr(null)
                  setFactorId(null)
                  setVerifyCode("")
                  setVerifying(false)
                  toast.success("2FA enabled")
                }} disabled={verifying || verifyCode.length !== 6}>
                  {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">No two-factor authentication configured.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  setEnrolling(true)
                  const supabase = createClient()
                  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator" })
                  if (error) { toast.error(error.message); setEnrolling(false); return }
                  setFactorId(data.id)
                  setEnrollQr(data.totp.qr_code)
                }}>
                  <Smartphone className="h-3.5 w-3.5 mr-1" /> Authenticator App
                </Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  setEnrolling(true)
                  const supabase = createClient()
                  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "webauthn", friendlyName: "Passkey" })
                  if (error) { toast.error(error.message); setEnrolling(false); return }
                  // WebAuthn enrollment completes immediately after browser interaction
                  setMfaFactors(prev => [...prev, { id: data.id, status: "verified", factor_type: "webauthn", friendly_name: "Passkey" }])
                  setEnrolling(false)
                  toast.success("Passkey enrolled")
                }}>
                  <Shield className="h-3.5 w-3.5 mr-1" /> Passkey (Face ID / Touch ID)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "ip-allowlist" && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Restrict access to specific IP addresses or CIDR ranges. When enabled, only requests from these IPs can access your workspace.
          </div>

          {ipLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={newCidr}
                  onChange={e => setNewCidr(e.target.value)}
                  placeholder="e.g. 203.0.113.0/24"
                  className="flex-1 text-sm font-mono"
                />
                <Input
                  value={newCidrDesc}
                  onChange={e => setNewCidrDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-40 text-sm"
                />
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!newCidr.trim() || !workspaceId) return
                  setAddingIp(true)
                  const res = await fetch("/api/ip-allowlists", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workspace_id: workspaceId, cidr: newCidr.trim(), description: newCidrDesc.trim() || null }),
                  })
                  if (res.ok) {
                    const entry = await res.json()
                    setIpEntries(prev => [entry, ...prev])
                    setNewCidr("")
                    setNewCidrDesc("")
                    toast.success("IP added to allowlist")
                  } else {
                    const err = await res.json()
                    toast.error(err.error || "Failed")
                  }
                  setAddingIp(false)
                }} disabled={addingIp || !newCidr.trim()}>
                  {addingIp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add
                </Button>
              </div>

              {ipEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
                  <div>
                    <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{entry.cidr}</p>
                    <p className="text-xs text-gray-400">{entry.description || "No description"} · Workspace: {entry.workspace?.name || "N/A"}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    const res = await fetch(`/api/ip-allowlists?id=${entry.id}`, { method: "DELETE" })
                    if (res.ok) {
                      setIpEntries(prev => prev.filter(e => e.id !== entry.id))
                      toast.success("IP removed")
                    }
                  }}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
              {ipEntries.length === 0 && <p className="text-sm text-gray-400">No IP restrictions configured</p>}
            </>
          )}
        </div>
      )}

      {activeSubTab === "pgp" && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Upload PGP public keys to encrypt outgoing emails for specific recipients. The recipient must have the corresponding private key to decrypt.
          </div>

          {pgpLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setShowAddPgp(!showAddPgp); setPgpEmail(""); setPgpPublicKey("") }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add PGP Key
              </Button>

              {showAddPgp && (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                  <Input value={pgpEmail} onChange={e => setPgpEmail(e.target.value)} placeholder="Recipient email address" className="text-sm" />
                  <textarea
                    value={pgpPublicKey}
                    onChange={e => setPgpPublicKey(e.target.value)}
                    placeholder="Paste PGP public key (ASCII-armored)"
                    rows={6}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50 text-gray-900 placeholder:text-gray-400"
                  />
                  <Button size="sm" onClick={async () => {
                    if (!pgpEmail.trim() || !pgpPublicKey.trim()) return
                    setAddingPgp(true)
                    const res = await fetch("/api/pgp-keys", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email_address: pgpEmail.trim(), public_key: pgpPublicKey.trim() }),
                    })
                    if (res.ok) {
                      const key = await res.json()
                      setPgpKeys(prev => [key, ...prev])
                      setShowAddPgp(false)
                      setPgpEmail("")
                      setPgpPublicKey("")
                      toast.success("PGP key added")
                    } else {
                      const err = await res.json()
                      toast.error(err.error || "Failed")
                    }
                    setAddingPgp(false)
                  }} disabled={addingPgp || !pgpEmail.trim() || !pgpPublicKey.trim()}>
                    {addingPgp ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Add Key
                  </Button>
                </div>
              )}

              {pgpKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{key.email_address}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{key.fingerprint?.slice(0, 40)}...</p>
                    <p className="text-xs text-gray-400">{key.algorithm} · Added {new Date(key.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    const res = await fetch(`/api/pgp-keys?id=${key.id}`, { method: "DELETE" })
                    if (res.ok) {
                      setPgpKeys(prev => prev.filter(k => k.id !== key.id))
                      toast.success("PGP key removed")
                    }
                  }}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
              {pgpKeys.length === 0 && !showAddPgp && <p className="text-sm text-gray-400">No PGP keys configured</p>}
            </>
          )}
        </div>
      )}

      {activeSubTab === "app-passwords" && (
        <div className="space-y-3">
          <Button size="sm" variant="outline" onClick={() => { setShowNewPassword(!showNewPassword); setCreatedPassword(null) }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New password
          </Button>

          {showNewPassword && (
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
              <Input value={newPasswordName} onChange={e => setNewPasswordName(e.target.value)} placeholder="Name (e.g. My SMTP Client)" className="text-sm" />
              <div className="flex gap-3 text-xs text-gray-500">
                <label className="flex items-center gap-1"><input type="checkbox" checked={newPasswordScopes.includes("smtp")} onChange={() => toggleScope("smtp")} className="rounded" /> SMTP</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={newPasswordScopes.includes("imap")} onChange={() => toggleScope("imap")} className="rounded" /> IMAP</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={newPasswordScopes.includes("api")} onChange={() => toggleScope("api")} className="rounded" /> API</label>
              </div>
              <Button size="sm" onClick={createAppPassword} disabled={creating || !newPasswordName.trim()}>
                {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Generate
              </Button>
            </div>
          )}

          {createdPassword && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Save this password — it won&apos;t be shown again:</p>
              <code className="block bg-white dark:bg-gray-800 p-2 rounded text-xs font-mono break-all select-all">{createdPassword}</code>
            </div>
          )}

          {appPasswords.map(ap => (
            <div key={ap.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100">{ap.name}</p>
                <p className="text-xs text-gray-400">{ap.scopes?.join(", ") || "No scopes"} · Created {new Date(ap.created_at).toLocaleDateString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => revokeAppPassword(ap.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
          {appPasswords.length === 0 && !showNewPassword && <p className="text-sm text-gray-400">No app passwords</p>}
        </div>
      )}
    </div>
  )
}

/* ───── Team Section ───── */
function TeamSection({ workspaceId }: { workspaceId?: string }) {
  const [members, setMembers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teamTab, setTeamTab] = useState<"members" | "audit" | "activity">("members")
  const supabase = createClient()

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return }
    Promise.all([
      fetch("/api/activity-logs?" + new URLSearchParams({ workspace_id: workspaceId })).then(r => r.json()),
      fetch("/api/audit-logs?" + new URLSearchParams({ workspace_id: workspaceId, limit: "50" })).then(r => r.json()),
    ]).then(([activity, audit]) => {
      setActivityLogs(Array.isArray(activity) ? activity : [])
      setAuditLogs(audit?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))

    supabase.from("workspace_members").select("*, users!inner(id, email, name)").eq("workspace_id", workspaceId)
      .then(({ data }) => setMembers(data || []))
  }, [workspaceId, supabase])

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setTeamTab("members")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${teamTab === "members" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>Members</button>
        <button onClick={() => setTeamTab("audit")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${teamTab === "audit" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>Audit Log</button>
        <button onClick={() => setTeamTab("activity")} className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${teamTab === "activity" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}>Activity</button>
      </div>

      {teamTab === "members" && (
        <div className="space-y-2">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.users?.name || m.users?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{m.role}</p>
              </div>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm text-gray-400">No members</p>}
        </div>
      )}

      {teamTab === "audit" && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLogs.map((log: any) => (
            <div key={log.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-900 dark:text-gray-100">{log.action}</p>
              <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-sm text-gray-400">No audit logs</p>}
        </div>
      )}

      {teamTab === "activity" && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activityLogs.map((log: any) => (
            <div key={log.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{log.action.replace(/_/g, " ")}</p>
              <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
          {activityLogs.length === 0 && <p className="text-sm text-gray-400">No activity logs</p>}
        </div>
      )}
    </div>
  )
}

/* helpers */
async function supabaseDelete(table: string, id: string) {
  const supabase = createClient()
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) {
    toast.error(error.message)
    return
  }
  toast.success("Deleted")
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { BarChart3, Send, Database, Activity, HardDrive, ArrowUpRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface UsageData {
  usage: {
    emailsSent: number
    emailsReceived: number
    apiRequests: number
    storageBytes: number
  }
  limits: {
    emails_per_day: number
    storage_mb: number
    api_requests_per_minute: number
  }
  subscription: {
    status: string
    trialEndsAt: string | null
    periodEnd: string | null
  } | null
}

export default function UsagePage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/usage?workspaceId=${workspaceId}`)
        if (res.ok) setData(await res.json())
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId])

  const usage = data?.usage || { emailsSent: 0, emailsReceived: 0, apiRequests: 0, storageBytes: 0 }
  const limits = data?.limits || { emails_per_day: 100, storage_mb: 500, api_requests_per_minute: 60 }
  const sub = data?.subscription

  const emailsPercent = limits.emails_per_day > 0 ? Math.min((usage.emailsSent / limits.emails_per_day) * 100, 100) : 0
  const storageMbUsed = usage.storageBytes / (1024 * 1024)
  const storagePercent = limits.storage_mb > 0 ? Math.min((storageMbUsed / limits.storage_mb) * 100, 100) : 0
  const apiPercent = limits.api_requests_per_minute > 0 ? Math.min((usage.apiRequests / limits.api_requests_per_minute) * 100, 100) : 0

  const statusLabel = sub?.status === "active" ? "Active" : sub?.status === "trialing" ? "Trial" : sub?.status || "Free"
  const statusColor = sub?.status === "active" ? "text-green-600 bg-green-50 dark:bg-green-900/30" : sub?.status === "trialing" ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" : "text-gray-600 bg-gray-50 dark:bg-gray-900/30"

  return (
    <>
      <PageHeader
        title="Usage & Billing"
        description="Monitor your workspace usage and plan limits"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                  {statusLabel}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {sub?.trialEndsAt ? `Trial ends ${new Date(sub.trialEndsAt).toLocaleDateString()}` : ""}
                  {sub?.periodEnd ? `Current period ends ${new Date(sub.periodEnd).toLocaleDateString()}` : ""}
                  {!sub && "Free plan — no active subscription"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Send className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{emailsPercent.toFixed(0)}%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usage.emailsSent.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of {limits.emails_per_day.toLocaleString()} emails / day</p>
                  <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${emailsPercent}%` }} />
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                      <HardDrive className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{storagePercent.toFixed(0)}%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{storageMbUsed.toFixed(1)} MB</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of {limits.storage_mb.toLocaleString()} MB storage</p>
                  <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{apiPercent.toFixed(0)}%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usage.apiRequests.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of {limits.api_requests_per_minute.toLocaleString()} API req / min</p>
                  <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${apiPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Emails Received</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{usage.emailsReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Storage Used</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{storageMbUsed.toFixed(1)} MB</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">API Requests</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{usage.apiRequests.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    Upgrade
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Need more capacity? Upgrade your plan to unlock higher limits and premium features.
                  </p>
                  <a
                    href={`/${workspaceId}/settings?tab=billing`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    View Plans
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Mail, Eye, MousePointerClick, Inbox, Send, TrendingUp, Download, Calendar, Clock } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts"
import type { AnalyticsSummary, TimeSeriesPoint, PerEmailAnalytics } from "@/types"

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6"]

export default function AnalyticsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([])
  const [deviceData, setDeviceData] = useState<any[]>([])
  const [clientData, setClientData] = useState<any[]>([])
  const [countryData, setCountryData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [perEmailData, setPerEmailData] = useState<PerEmailAnalytics[]>([])
  const [perEmailTotal, setPerEmailTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [perEmailPage, setPerEmailPage] = useState(0)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [groupBy, setGroupBy] = useState("day")
  const perPage = 10

  const qs = useCallback((extra: string) => {
    const p = new URLSearchParams({ workspaceId, ...(startDate && { start_date: startDate }), ...(endDate && { end_date: endDate }) })
    return `?${p.toString()}${extra}`
  }, [workspaceId, startDate, endDate])

  async function loadSummary() {
    const res = await fetch(`/api/analytics/summary${qs("")}`)
    if (res.ok) setSummary(await res.json())
  }

  async function loadTimeSeries() {
    const res = await fetch(`/api/analytics/time-series${qs(`&group_by=${groupBy}`)}`)
    if (res.ok) {
      const json = await res.json()
      setTimeSeries(json.data || [])
    }
  }

  async function loadPerEmail(page: number) {
    const res = await fetch(`/api/analytics/per-email${qs(`&limit=${perPage}&offset=${page * perPage}`)}`)
    if (res.ok) {
      const json = await res.json()
      setPerEmailData(json.data || [])
      setPerEmailTotal(json.total || 0)
    }
  }

  async function loadDeviceClientBreakdown() {
    const emailRes = await fetch(`/api/analytics/per-email${qs("&limit=500")}`)
    if (!emailRes.ok) return
    const emailJson = await emailRes.json()
    const ids = (emailJson.data || []).map((e: PerEmailAnalytics) => e.email_id)
    if (!ids.length) return

    const res = await fetch("/api/analytics/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_ids: ids, ...(startDate && { start_date: startDate }), ...(endDate && { end_date: endDate }), workspaceId }),
    })
    if (!res.ok) return
    const json = await res.json()
    setDeviceData(json.devices || [])
    setClientData(json.clients || [])
    setCountryData(json.countries || [])
    setHeatmapData(json.hourly_heatmap || [])
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      setPerEmailPage(0)
      await Promise.all([loadSummary(), loadTimeSeries(), loadPerEmail(0), loadDeviceClientBreakdown()])
      setLoading(false)
    }
    loadAll()
  }, [workspaceId, startDate, endDate])

  useEffect(() => {
    loadTimeSeries()
  }, [groupBy])

  useEffect(() => {
    loadPerEmail(perEmailPage)
  }, [perEmailPage])

  const openRate = summary ? (summary.outbound > 0 ? (summary.unique_opens / summary.outbound) * 100 : 0) : 0
  const clickRate = summary ? (summary.outbound > 0 ? (summary.unique_clicks / summary.outbound) * 100 : 0) : 0
  const bounceRate = summary ? (summary.outbound > 0 ? (summary.total_bounces / summary.outbound) * 100 : 0) : 0

  const statCards = [
    { label: "Total Emails", value: summary?.total_emails || 0, icon: Mail, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: "Inbound", value: summary?.inbound || 0, icon: Inbox, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" },
    { label: "Outbound", value: summary?.outbound || 0, icon: Send, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
    { label: "Opens", value: summary?.total_opens || 0, icon: Eye, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
    { label: "Clicks", value: summary?.total_clicks || 0, icon: MousePointerClick, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/30" },
    { label: "Bounces", value: summary?.total_bounces || 0, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/30" },
  ]

  function handleExport() {
    const p = new URLSearchParams({ workspaceId, format: "csv", ...(startDate && { start_date: startDate }), ...(endDate && { end_date: endDate }) })
    window.open(`/api/analytics/export?${p.toString()}`, "_blank")
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Email engagement overview"
        actions={
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        }
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            />
          </div>
          <span className="text-xs text-gray-400">to</span>
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            />
          </div>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map(card => (
                  <div key={card.label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Open Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{openRate.toFixed(1)}%</p>
                  <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(openRate, 100)}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Click Rate</p>
                  <p className="text-3xl font-bold text-green-600">{clickRate.toFixed(1)}%</p>
                  <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(clickRate, 100)}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bounce Rate</p>
                  <p className="text-3xl font-bold text-red-600">{bounceRate.toFixed(1)}%</p>
                  <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(bounceRate, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#f3f4f6" }} />
                    <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} name="Sent" />
                    <Line type="monotone" dataKey="opens" stroke="#22c55e" strokeWidth={2} dot={false} name="Opens" />
                    <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="Clicks" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Device Breakdown</h3>
                  {deviceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={deviceData} dataKey="count" nameKey="device_type" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.payload.device_type} ${props.payload.percentage.toFixed(1)}%`}>
                          {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-gray-400 text-center py-10">No device data yet</p>}
                </div>
                <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Client Breakdown</h3>
                  {clientData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={clientData} dataKey="count" nameKey="email_client" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.payload.email_client} ${props.payload.percentage.toFixed(1)}%`}>
                          {clientData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-gray-400 text-center py-10">No client data yet</p>}
                </div>
              </div>

              {countryData.length > 0 && (
                <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Countries</h3>
                  <div className="space-y-2">
                    {countryData.slice(0, 10).map((c: any) => (
                      <div key={c.country} className="flex items-center gap-3">
                        <span className="w-8 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">{c.percentage.toFixed(1)}%</span>
                        <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(c.percentage, 100)}%` }} />
                        </div>
                        <span className="w-24 text-sm text-gray-900 dark:text-gray-100">{c.country}</span>
                        <span className="text-xs text-gray-400">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {heatmapData.length > 0 && (
                <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Hourly Engagement Heatmap</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-1 text-gray-500" />
                          {Array.from({ length: 24 }, (_, i) => (
                            <th key={i} className="p-1 text-center text-gray-500 font-medium">{i}h</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 7 }, (_, day) => (
                          <tr key={day}>
                            <td className="p-1 pr-2 text-gray-500 font-medium text-right">{dayLabels[day]}</td>
                            {Array.from({ length: 24 }, (_, hour) => {
                              const cell = heatmapData.find((d: any) => d.day_of_week === day && d.hour === hour)
                              const val = cell ? (cell.opens + cell.clicks) : 0
                              const max = Math.max(...heatmapData.map((d: any) => d.opens + d.clicks), 1)
                              const intensity = max > 0 ? val / max : 0
                              return (
                                <td key={hour} className="p-0.5">
                                  <div
                                    className="h-6 w-full rounded"
                                    style={{
                                      backgroundColor: intensity > 0 ? `rgba(99, 102, 241, ${0.1 + intensity * 0.7})` : "#f9fafb",
                                    }}
                                    title={`${dayLabels[day]} ${hour}:00 - ${val} events`}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Per-Email Analytics</h3>
                </div>
                {perEmailData.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Subject</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sent</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Opens</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Clicks</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Bounces</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Open Rate</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Click Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perEmailData.map(email => (
                            <tr key={email.email_id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                              <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-[250px] truncate">{email.subject || "(No subject)"}</td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(email.sent_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">{email.unique_opens}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">{email.unique_clicks}</td>
                              <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">{email.bounces}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-blue-600 font-medium">{email.open_rate.toFixed(1)}%</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-green-600 font-medium">{email.click_rate.toFixed(1)}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {perEmailTotal > perPage && (
                      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Showing {perEmailPage * perPage + 1}-{Math.min((perEmailPage + 1) * perPage, perEmailTotal)} of {perEmailTotal}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setPerEmailPage(p => Math.max(0, p - 1))} disabled={perEmailPage === 0} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">Previous</button>
                          <button onClick={() => setPerEmailPage(p => p + 1)} disabled={(perEmailPage + 1) * perPage >= perEmailTotal} className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">Next</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : <p className="text-sm text-gray-400 text-center py-10">No email data yet</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

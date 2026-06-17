"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Mail, Eye, MousePointerClick, Inbox, Send, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ total: 0, inbound: 0, outbound: 0, opens: 0, clicks: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: emails } = await supabase
        .from("emails")
        .select("direction, id")
        .eq("user_id", user.id)

      const { data: events } = await supabase
        .from("email_events")
        .select("event_type")
        .in("email_id", (emails || []).map(e => e.id))

      const inbound = (emails || []).filter(e => e.direction === "inbound").length
      const outbound = (emails || []).filter(e => e.direction === "outbound").length
      const opens = (events || []).filter(e => e.event_type === "open").length
      const clicks = (events || []).filter(e => e.event_type === "click").length

      setStats({ total: emails?.length || 0, inbound, outbound, opens, clicks })
      setLoading(false)
    }
    load()
  }, [supabase, router])

  const cards = [
    { label: "Total Emails", value: stats.total, icon: Mail, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: "Inbound", value: stats.inbound, icon: Inbox, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" },
    { label: "Outbound", value: stats.outbound, icon: Send, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
    { label: "Opens", value: stats.opens, icon: Eye, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
    { label: "Clicks", value: stats.clicks, icon: MousePointerClick, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/30" },
  ]

  return (
    <>
      <PageHeader title="Analytics" description="Email engagement overview" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {cards.map(card => (
                  <div key={card.label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Engagement Rates</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Open Rate</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {stats.outbound > 0 ? ((stats.opens / stats.outbound) * 100).toFixed(1) : "0"}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${stats.outbound > 0 ? (stats.opens / stats.outbound) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Click Rate</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {stats.outbound > 0 ? ((stats.clicks / stats.outbound) * 100).toFixed(1) : "0"}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stats.outbound > 0 ? (stats.clicks / stats.outbound) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const body = await req.json()
    const { email_ids, start_date, end_date, workspaceId } = body

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let eventQuery = supabase
      .from("email_events")
      .select("event_type, device_type, email_client, country, created_at")
      .in("email_id", email_ids || [])
      .eq("event_type", "open")

    if (start_date) eventQuery = eventQuery.gte("created_at", start_date)
    if (end_date) eventQuery = eventQuery.lte("created_at", end_date)

    const { data: events } = await eventQuery

    const deviceCount: Record<string, number> = {}
    const clientCount: Record<string, number> = {}
    const countryCount: Record<string, number> = {}
    const heatmap: Record<string, number> = {}

    for (const evt of events || []) {
      const device = evt.device_type || "Unknown"
      deviceCount[device] = (deviceCount[device] || 0) + 1

      const client = evt.email_client || "Unknown"
      clientCount[client] = (clientCount[client] || 0) + 1

      const country = evt.country || "Unknown"
      countryCount[country] = (countryCount[country] || 0) + 1

      const d = new Date(evt.created_at)
      const key = `${d.getDay()}_${d.getHours()}`
      heatmap[key] = (heatmap[key] || 0) + 1
    }

    const total = (events || []).length || 1

    const devices = Object.entries(deviceCount)
      .map(([device_type, count]) => ({ device_type, count, percentage: Math.round((count / total) * 10000) / 100 }))
      .sort((a, b) => b.count - a.count)

    const clients = Object.entries(clientCount)
      .map(([email_client, count]) => ({ email_client, count, percentage: Math.round((count / total) * 10000) / 100 }))
      .sort((a, b) => b.count - a.count)

    const countries = Object.entries(countryCount)
      .map(([country, count]) => ({ country, count, percentage: Math.round((count / total) * 10000) / 100 }))
      .sort((a, b) => b.count - a.count)

    const hourlyHeatmap = Object.entries(heatmap).map(([key, count]) => {
      const [day_of_week, hour] = key.split("_").map(Number)
      return { day_of_week, hour, opens: count, clicks: 0 }
    })

    return NextResponse.json({ devices, clients, countries, hourly_heatmap: hourlyHeatmap })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch breakdown" }, { status: 500 })
  }
}

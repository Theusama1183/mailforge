import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const groupBy = searchParams.get("group_by") || "day"

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const trunc = groupBy === "week" ? "week" : groupBy === "month" ? "month" : "day"

    let emailQuery = supabase
      .from("emails")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("direction", "outbound")

    if (workspaceId) emailQuery = emailQuery.eq("workspace_id", workspaceId)
    if (startDate) emailQuery = emailQuery.gte("created_at", startDate)
    if (endDate) emailQuery = emailQuery.lte("created_at", endDate)

    const { data: emails, error: emailErr } = await emailQuery
    if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })

    const emailIds = (emails || []).map(e => e.id)
    if (!emailIds.length) return NextResponse.json({ data: [] })

    let eventQuery = supabase
      .from("email_events")
      .select("event_type, created_at, email_id")
      .in("email_id", emailIds)
      .in("event_type", ["open", "click", "bounce", "unsubscribe"])

    if (startDate) eventQuery = eventQuery.gte("created_at", startDate)
    if (endDate) eventQuery = eventQuery.lte("created_at", endDate)

    const { data: events } = await eventQuery

    const dateMap = new Map<string, { sent: number; opens: number; clicks: number; bounces: number; unsubscribes: number; seenOpen: Set<string>; seenClick: Set<string> }>()

    function getKey(dateStr: string): string {
      const d = new Date(dateStr)
      if (trunc === "week") {
        const start = new Date(d)
        start.setDate(d.getDate() - d.getDay())
        return start.toISOString().slice(0, 10)
      } else if (trunc === "month") {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      }
      return d.toISOString().slice(0, 10)
    }

    for (const email of emails || []) {
      const key = getKey(email.created_at)
      if (!dateMap.has(key)) dateMap.set(key, { sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, seenOpen: new Set(), seenClick: new Set() })
      dateMap.get(key)!.sent++
    }

    for (const evt of events || []) {
      const key = getKey(evt.created_at)
      if (!dateMap.has(key)) continue
      const entry = dateMap.get(key)!
      if (evt.event_type === "open" && !entry.seenOpen.has(evt.email_id)) {
        entry.opens++
        entry.seenOpen.add(evt.email_id)
      } else if (evt.event_type === "click" && !entry.seenClick.has(evt.email_id)) {
        entry.clicks++
        entry.seenClick.add(evt.email_id)
      } else if (evt.event_type === "bounce") {
        entry.bounces++
      } else if (evt.event_type === "unsubscribe") {
        entry.unsubscribes++
      }
    }

    const data = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        sent: vals.sent,
        opens: vals.opens,
        clicks: vals.clicks,
        bounces: vals.bounces,
        unsubscribes: vals.unsubscribes,
      }))

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch time-series data" }, { status: 500 })
  }
}

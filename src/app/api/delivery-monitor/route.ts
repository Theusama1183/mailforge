import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RawEvent {
  event_type: string
  created_at: string
  email_id: string
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspace_id")
    const daysParam = searchParams.get("days")
    const days = daysParam ? Math.max(1, parseInt(daysParam, 10) || 7) : 7

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0)

    const { data: events, error } = await supabase
      .from("email_events")
      .select("event_type, created_at, email_id")
      .eq("workspace_id", workspaceId)
      .gte("created_at", since.toISOString())

    if (error) {
      const { data: emails, error: emailErr } = await supabase
        .from("emails")
        .select("id")
        .eq("workspace_id", workspaceId)
        .gte("created_at", since.toISOString())

      if (emailErr || !emails?.length) {
        return NextResponse.json(buildZeroResponse(days, since))
      }

      const emailIds = emails.map((e: { id: string }) => e.id)
      const { data: fallbackEvents } = await supabase
        .from("email_events")
        .select("event_type, created_at, email_id")
        .in("email_id", emailIds)
        .gte("created_at", since.toISOString())

      return NextResponse.json(buildResponse(fallbackEvents || [], days, since))
    }

    return NextResponse.json(buildResponse(events || [], days, since))
  } catch {
    const since = new Date()
    since.setDate(since.getDate() - 7)
    since.setHours(0, 0, 0)
    return NextResponse.json(buildZeroResponse(7, since))
  }
}

function buildResponse(events: RawEvent[], days: number, since: Date) {
  const totalSent = events.filter((e) => e.event_type === "sent").length
  const delivered = events.filter((e) => e.event_type === "delivered").length
  const opened = events.filter((e) => e.event_type === "opened").length
  const clicked = events.filter((e) => e.event_type === "clicked").length
  const bounced = events.filter((e) => e.event_type === "bounced").length
  const complained = events.filter((e) => e.event_type === "complained").length

  const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(2) : "0.00"
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : "0.00"

  return {
    total_sent: totalSent,
    delivered,
    opened,
    clicked,
    bounced,
    complained,
    daily_breakdown: buildDailyBreakdown(events, days, since),
    delivery_rate: deliveryRate,
    open_rate: openRate,
  }
}

function buildDailyBreakdown(events: RawEvent[], days: number, since: Date) {
  const map = new Map<string, { sent: number; delivered: number; opened: number }>()

  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, { sent: 0, delivered: 0, opened: 0 })
  }

  for (const evt of events) {
    const key = evt.created_at.slice(0, 10)
    const entry = map.get(key)
    if (!entry) continue
    if (evt.event_type === "sent") entry.sent++
    else if (evt.event_type === "delivered") entry.delivered++
    else if (evt.event_type === "opened") entry.opened++
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }))
}

function buildZeroResponse(days: number, since: Date) {
  return {
    total_sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    daily_breakdown: buildDailyBreakdown([], days, since),
    delivery_rate: "0.00",
    open_rate: "0.00",
  }
}

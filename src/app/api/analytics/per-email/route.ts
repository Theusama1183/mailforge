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
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let emailQuery = supabase
      .from("emails")
      .select("id, subject, to_addresses, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .eq("direction", "outbound")

    if (workspaceId) emailQuery = emailQuery.eq("workspace_id", workspaceId)
    if (startDate) emailQuery = emailQuery.gte("created_at", startDate)
    if (endDate) emailQuery = emailQuery.lte("created_at", endDate)

    const { data: emails, error: emailErr, count } = await emailQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })
    if (!emails?.length) return NextResponse.json({ data: [], total: 0 })

    const emailIds = emails.map(e => e.id)

    const { data: events } = await supabase
      .from("email_events")
      .select("email_id, event_type")
      .in("email_id", emailIds)

    const eventMap = new Map<string, { opens: Set<string>; clicks: Set<string>; bounces: number }>()
    for (const evt of events || []) {
      if (!eventMap.has(evt.email_id)) eventMap.set(evt.email_id, { opens: new Set(), clicks: new Set(), bounces: 0 })
      const entry = eventMap.get(evt.email_id)!
      if (evt.event_type === "open") entry.opens.add(evt.email_id)
      else if (evt.event_type === "click") entry.clicks.add(evt.email_id)
      else if (evt.event_type === "bounce") entry.bounces++
    }

    const data = emails.map(email => {
      const stats = eventMap.get(email.id)
      const opens = stats?.opens.size || 0
      const clicks = stats?.clicks.size || 0
      const totalRecipients = email.to_addresses?.length || 1
      return {
        email_id: email.id,
        subject: email.subject,
        to_addresses: email.to_addresses,
        sent_at: email.created_at,
        opens,
        clicks,
        unique_opens: opens,
        unique_clicks: clicks,
        bounces: stats?.bounces || 0,
        open_rate: Math.round((opens / totalRecipients) * 10000) / 100,
        click_rate: Math.round((clicks / totalRecipients) * 10000) / 100,
      }
    })

    return NextResponse.json({ data, total: count })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch per-email analytics" }, { status: 500 })
  }
}

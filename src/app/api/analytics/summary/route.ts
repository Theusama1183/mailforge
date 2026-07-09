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

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let emailQuery = supabase.from("emails").select("id, direction").eq("user_id", user.id)
    if (workspaceId) emailQuery = emailQuery.eq("workspace_id", workspaceId)
    if (startDate) emailQuery = emailQuery.gte("created_at", startDate)
    if (endDate) emailQuery = emailQuery.lte("created_at", endDate)

    const { data: emails, error: emailErr } = await emailQuery
    if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })

    const totalEmails = emails?.length || 0
    const inbound = emails?.filter(e => e.direction === "inbound").length || 0
    const outbound = emails?.filter(e => e.direction === "outbound").length || 0

    const emailIds = (emails || []).map(e => e.id)
    if (!emailIds.length) {
      return NextResponse.json({
        total_emails: 0, inbound: 0, outbound: 0,
        total_opens: 0, total_clicks: 0, total_bounces: 0, total_unsubscribes: 0,
        open_rate: 0, click_rate: 0, bounce_rate: 0,
        unique_opens: 0, unique_clicks: 0,
      })
    }

    let eventQuery = supabase.from("email_events").select("event_type, email_id").in("email_id", emailIds)
    if (startDate) eventQuery = eventQuery.gte("created_at", startDate)
    if (endDate) eventQuery = eventQuery.lte("created_at", endDate)

    const { data: events } = await eventQuery

    const totalOpens = events?.filter(e => e.event_type === "open").length || 0
    const totalClicks = events?.filter(e => e.event_type === "click").length || 0
    const totalBounces = events?.filter(e => e.event_type === "bounce").length || 0
    const totalUnsubscribes = events?.filter(e => e.event_type === "unsubscribe").length || 0

    const uniqueOpenEmails = new Set(events?.filter(e => e.event_type === "open").map(e => e.email_id)).size
    const uniqueClickEmails = new Set(events?.filter(e => e.event_type === "click").map(e => e.email_id)).size

    const openRate = outbound > 0 ? (uniqueOpenEmails / outbound) * 100 : 0
    const clickRate = outbound > 0 ? (uniqueClickEmails / outbound) * 100 : 0
    const bounceRate = outbound > 0 ? (totalBounces / outbound) * 100 : 0

    return NextResponse.json({
      total_emails: totalEmails,
      inbound,
      outbound,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      total_bounces: totalBounces,
      total_unsubscribes: totalUnsubscribes,
      open_rate: Math.round(openRate * 100) / 100,
      click_rate: Math.round(clickRate * 100) / 100,
      bounce_rate: Math.round(bounceRate * 100) / 100,
      unique_opens: uniqueOpenEmails,
      unique_clicks: uniqueClickEmails,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics summary" }, { status: 500 })
  }
}

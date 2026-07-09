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
    const format = searchParams.get("format") || "csv"

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let emailQuery = supabase
      .from("emails")
      .select("id, subject, to_addresses, from_address, from_name, direction, created_at")
      .eq("user_id", user.id)

    if (workspaceId) emailQuery = emailQuery.eq("workspace_id", workspaceId)
    if (startDate) emailQuery = emailQuery.gte("created_at", startDate)
    if (endDate) emailQuery = emailQuery.lte("created_at", endDate)

    const { data: emails, error: emailErr } = await emailQuery.order("created_at", { ascending: false })
    if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })

    const emailIds = (emails || []).map(e => e.id)
    const { data: events } = await supabase
      .from("email_events")
      .select("email_id, event_type, created_at")
      .in("email_id", emailIds)

    const eventCounts = new Map<string, { opens: number; clicks: number; bounces: number }>()
    for (const evt of events || []) {
      if (!eventCounts.has(evt.email_id)) eventCounts.set(evt.email_id, { opens: 0, clicks: 0, bounces: 0 })
      const entry = eventCounts.get(evt.email_id)!
      if (evt.event_type === "open") entry.opens++
      else if (evt.event_type === "click") entry.clicks++
      else if (evt.event_type === "bounce") entry.bounces++
    }

    const csvRows = [
      "Subject,To,From,From Name,Direction,Sent At,Opens,Clicks,Bounces",
    ]

    for (const email of emails || []) {
      const stats = eventCounts.get(email.id) || { opens: 0, clicks: 0, bounces: 0 }
      const to = (email.to_addresses || []).join("; ")
      const row = [
        `"${(email.subject || "").replace(/"/g, '""')}"`,
        `"${to.replace(/"/g, '""')}"`,
        `"${email.from_address || ""}"`,
        `"${(email.from_name || "").replace(/"/g, '""')}"`,
        email.direction,
        email.created_at,
        stats.opens,
        stats.clicks,
        stats.bounces,
      ]
      csvRows.push(row.join(","))
    }

    const csv = csvRows.join("\n")

    if (format === "csv") {
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: csvRows.slice(1) })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 })
  }
}

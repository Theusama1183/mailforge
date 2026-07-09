import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

const DEFAULT_EVENT_TYPES = ["email_received", "email_opened", "email_clicked", "email_bounced", "email_failed", "member_joined", "member_left"]

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const existing = data || []
    const allPrefs = DEFAULT_EVENT_TYPES.map(type => {
      const found = existing.find((p: any) => p.event_type === type)
      return found || { id: null, user_id: user.id, event_type: type, email_enabled: true, in_app_enabled: true }
    })

    return NextResponse.json(allPrefs)
  } catch {
    return NextResponse.json({ error: "Failed to fetch notification preferences" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.event_type || !DEFAULT_EVENT_TYPES.includes(body.event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", body.event_type)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from("notification_preferences")
        .update({
          email_enabled: body.email_enabled ?? true,
          in_app_enabled: body.in_app_enabled ?? true,
        })
        .eq("id", existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    } else {
      const { data, error } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: user.id,
          event_type: body.event_type,
          email_enabled: body.email_enabled ?? true,
          in_app_enabled: body.in_app_enabled ?? true,
        })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to update notification preference" }, { status: 500 })
  }
}

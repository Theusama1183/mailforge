import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("vacation_autoreply")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || null)
  } catch {
    return NextResponse.json({ error: "Failed to fetch vacation autoreply" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.subject !== undefined) fields.subject = body.subject
    if (body.body !== undefined) fields.body = body.body
    if (body.enabled !== undefined) fields.enabled = body.enabled
    if (body.start_date !== undefined) fields.start_date = body.start_date || null
    if (body.end_date !== undefined) fields.end_date = body.end_date || null
    if (body.email_address_id !== undefined) fields.email_address_id = body.email_address_id || null

    const { data: existing } = await supabase
      .from("vacation_autoreply")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from("vacation_autoreply")
        .update(fields)
        .eq("id", existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    } else {
      const { data, error } = await supabase
        .from("vacation_autoreply")
        .insert({ user_id: user.id, ...fields })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to update vacation autoreply" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase
      .from("vacation_autoreply")
      .delete()
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete vacation autoreply" }, { status: 500 })
  }
}

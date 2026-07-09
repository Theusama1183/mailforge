import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("forwarding_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed to fetch forwarding rules" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.destination) return NextResponse.json({ error: "Destination email is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("forwarding_rules")
      .insert({
        user_id: user.id,
        email_address_id: body.email_address_id || null,
        destination: body.destination,
        enabled: body.enabled ?? true,
        keep_copy: body.keep_copy ?? true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to create forwarding rule" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.destination !== undefined) updates.destination = body.destination
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.keep_copy !== undefined) updates.keep_copy = body.keep_copy
    if (body.email_address_id !== undefined) updates.email_address_id = body.email_address_id || null

    const { data, error } = await supabase
      .from("forwarding_rules")
      .update(updates)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to update forwarding rule" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })

    const { error } = await supabase
      .from("forwarding_rules")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete forwarding rule" }, { status: 500 })
  }
}

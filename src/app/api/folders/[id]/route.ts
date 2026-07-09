import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: existing, error: fetchError } = await supabase
      .from("email_folders")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: "Folder not found" }, { status: 404 })

    const body = await req.json()
    const allowed = ["name", "parent_id", "color", "icon", "sort_order"]
    const updates: Record<string, unknown> = {}

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("email_folders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Folder update error:", error)
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: existing, error: fetchError } = await supabase
      .from("email_folders")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: "Folder not found" }, { status: 404 })

    const { error } = await supabase
      .from("email_folders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Folder delete error:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}

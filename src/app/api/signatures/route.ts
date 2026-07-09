import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("user_signatures")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch signatures" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.content) return NextResponse.json({ error: "Content is required" }, { status: 400 })

    const { data: existing } = await supabase
      .from("user_signatures")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    const isDefault = body.is_default ?? (existing?.length === 0)

    if (isDefault) {
      await supabase.from("user_signatures").update({ is_default: false }).eq("user_id", user.id)
    }

    const { data, error } = await supabase
      .from("user_signatures")
      .insert({ user_id: user.id, name: body.name || "Default", content: body.content, is_default: isDefault })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to create signature" }, { status: 500 })
  }
}

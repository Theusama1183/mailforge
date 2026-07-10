import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")

    let query = supabase.from("marketplace_templates").select("*").order("downloads", { ascending: false })

    if (category) query = query.eq("category", category)
    if (featured === "true") query = query.eq("featured", true)
    if (search) query = query.ilike("name", `%${search}%`)

    const { data, error } = await query.limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch marketplace templates" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const widgetId = searchParams.get("id")
    if (!widgetId) return NextResponse.json({ error: "Missing widget id" }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase.from("form_widgets").select("*").eq("id", widgetId).eq("active", true).single()
    if (error || !data) return NextResponse.json({ error: "Widget not found" }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load widget" }, { status: 500 })
  }
}

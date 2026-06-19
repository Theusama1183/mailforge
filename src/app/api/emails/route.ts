import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const folder = searchParams.get("folder") || "inbox"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit)

    if (folder === "starred") {
      query = query.eq("starred", true)
    } else {
      query = query.eq("folder", folder)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ emails: data, count })
  } catch (error) {
    console.error("Emails fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

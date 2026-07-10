import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth

    if (!checkPermission("email:read", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error, count } = await supabase
      .from("emails")
      .select("*", { count: "exact" })
      .eq("workspace_id", auth.workspaceId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    })
  } catch (err) {
    console.error("API v1 emails error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

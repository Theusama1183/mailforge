import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("template:read", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const rl = await checkRateLimit(auth.workspaceId, "api")
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error, count } = await supabase
      .from("templates")
      .select("*", { count: "exact" })
      .eq("workspace_id", auth.workspaceId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ data, pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) } })
  } catch (err) {
    console.error("API v1 templates error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("template:write", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const rl = await checkRateLimit(auth.workspaceId, "api")
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
    }

    const { name, subject, body_html, body_text } = await req.json()
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase.from("templates").insert({
      workspace_id: auth.workspaceId,
      name, subject: subject || "", body_html: body_html || "", body_text: body_text || "",
    }).select().single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error("API v1 create template error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

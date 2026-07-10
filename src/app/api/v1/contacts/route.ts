import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("contact:read", auth.permissions)) {
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
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("workspace_id", auth.workspaceId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ data, pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) } })
  } catch (err) {
    console.error("API v1 contacts error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("contact:write", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const rl = await checkRateLimit(auth.workspaceId, "api")
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
    }

    const { email, name, company, notes, phone } = await req.json()
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase.from("contacts").insert({
      workspace_id: auth.workspaceId, email, name, company: company || null, notes: notes || null, phone: phone || null,
    }).select().single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error("API v1 create contact error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

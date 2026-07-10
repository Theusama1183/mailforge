import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("domain:read", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const rl = await checkRateLimit(auth.workspaceId, "api")
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .eq("workspace_id", auth.workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error("API v1 domains error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

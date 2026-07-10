import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  // Database check
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("workspaces").select("id", { count: "exact", head: true }).limit(1)
    if (error) throw error
    checks.database = "ok"
  } catch (e) {
    checks.database = "error"
    healthy = false
  }

  const status = healthy ? 200 : 503

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status }
  )
}

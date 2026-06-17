import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  // No-op: email was already sent immediately by /api/send
  return NextResponse.json({ success: true })
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

export async function GET(req: Request) {
  const url = new URL(req.url)
  const emailId = url.searchParams.get("email_id")

  if (emailId) {
    try {
      const supabase = createAdminClient()
      await supabase.from("email_events").insert({
        email_id: emailId,
        event_type: "open",
        user_agent: req.headers.get("user-agent") || null,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    } catch (err) {
      console.error("Track open error:", err)
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}

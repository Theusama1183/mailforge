import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseUserAgent } from "@/lib/user-agent"
import { lookupCountry } from "@/lib/geoip"

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

export async function GET(req: Request) {
  const url = new URL(req.url)
  const emailId = url.searchParams.get("email_id")

  if (emailId) {
    try {
      const supabase = createAdminClient()
      const ua = req.headers.get("user-agent") || null
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
      const { device_type, email_client } = parseUserAgent(ua)
      await supabase.from("email_events").insert({
        email_id: emailId,
        event_type: "open",
        user_agent: ua,
        ip_address: ip,
        country: await lookupCountry(ip),
        device_type,
        email_client,
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

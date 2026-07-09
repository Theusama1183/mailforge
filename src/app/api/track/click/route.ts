import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseUserAgent } from "@/lib/user-agent"
import { lookupCountry } from "@/lib/geoip"

const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"]

function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_SCHEMES.includes(parsed.protocol)
  } catch {
    return false
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const emailId = url.searchParams.get("email_id")
  const target = url.searchParams.get("url")

  if (emailId && target) {
    try {
      const supabase = createAdminClient()
      const ua = req.headers.get("user-agent") || null
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
      const { device_type, email_client } = parseUserAgent(ua)
      await supabase.from("email_events").insert({
        email_id: emailId,
        event_type: "click",
        link_url: target,
        user_agent: ua,
        ip_address: ip,
        country: await lookupCountry(ip),
        device_type,
        email_client,
      })
    } catch (err) {
      console.error("Track click error:", err)
    }
  }

  if (target && isValidRedirectUrl(target)) {
    return NextResponse.redirect(target)
  }

  return NextResponse.redirect(new URL(req.url).origin)
}

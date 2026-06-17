import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const emailId = url.searchParams.get("email_id")
  const target = url.searchParams.get("url")

  if (emailId && target) {
    try {
      const supabase = createAdminClient()
      await supabase.from("email_events").insert({
        email_id: emailId,
        event_type: "click",
        link_url: target,
        user_agent: req.headers.get("user-agent") || null,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    } catch (err) {
      console.error("Track click error:", err)
    }
  }

  return Response.redirect(target || "/")
}

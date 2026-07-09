import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { domain } = await req.json()
    if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "localhost:3000"}`

    // Check if SSO provider exists for this domain
    const admin = createAdminClient()
    const { data: providers } = await admin
      .from("sso_providers")
      .select("domain, label")
      .eq("domain", domain.toLowerCase())
      .eq("enabled", true)
      .limit(1)

    if (!providers?.length) {
      return NextResponse.json({ error: "No SSO provider configured for this domain" }, { status: 404 })
    }

    return NextResponse.json({
      domain: providers[0].domain,
      label: providers[0].label,
      redirectUrl: `${baseUrl}/auth/callback`,
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { domainId, localPart, domainName } = await req.json()
    if (!domainId || !localPart || !domainName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: domain } = await supabase
      .from("domains")
      .select("cloudflare_token, zone_id, user_id")
      .eq("id", domainId)
      .single()

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    if (domain.user_id !== user.id) {
      const { data: emailAddresses } = await supabase
        .from("email_addresses")
        .select("workspace_id")
        .eq("domain_id", domainId)
      const wsIds = [...new Set((emailAddresses || []).map((e: any) => e.workspace_id).filter(Boolean))]
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("user_id", user.id)
        .in("workspace_id", wsIds)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    if (!domain?.cloudflare_token) {
      return NextResponse.json({ error: "Cloudflare token not configured for domain" }, { status: 400 })
    }

    const zoneId = domain.zone_id || await resolveZoneId(domainName, domain.cloudflare_token)
    if (!zoneId) {
      return NextResponse.json({ error: "Could not resolve zone ID for domain" }, { status: 400 })
    }

    if (!domain.zone_id) {
      await supabase.from("domains").update({ zone_id: zoneId }).eq("id", domainId)
    }

    const fullAddress = `${localPart}@${domainName}`
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${domain.cloudflare_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `MailForge: ${fullAddress}`,
          matchers: [{ type: "literal", field: "to", value: fullAddress }],
          actions: [{ type: "worker", value: ["mailforge-email-worker"] }],
          enabled: true,
          priority: 50,
        }),
      }
    )

    const data = await res.json()
    if (!data.success) {
      return NextResponse.json({ error: `Cloudflare API: ${data.errors?.[0]?.message || "Unknown error"}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, ruleId: data.result?.id })
  } catch (error) {
    console.error("Route creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create route" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const emailId = searchParams.get("id")
    if (!emailId) {
      return NextResponse.json({ error: "Email address ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: emailAddr } = await supabase
      .from("email_addresses")
      .select("local_part, domains!inner(id, domain, cloudflare_token, zone_id, user_id)")
      .eq("id", emailId)
      .single()

    if (!emailAddr) {
      return NextResponse.json({ error: "Email address not found" }, { status: 404 })
    }

    const domain = emailAddr.domains as any
    if (domain.user_id !== user.id) {
      const { data: emailAddresses } = await supabase
        .from("email_addresses")
        .select("workspace_id")
        .eq("domain_id", domain.id)
      const wsIds = [...new Set((emailAddresses || []).map((e: any) => e.workspace_id).filter(Boolean))]
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("user_id", user.id)
        .in("workspace_id", wsIds)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    if (domain.cloudflare_token && domain.zone_id) {
      const fullAddress = `${emailAddr.local_part}@${domain.domain}`
      const rulesRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${domain.zone_id}/email/routing/rules`,
        {
          headers: {
            Authorization: `Bearer ${domain.cloudflare_token}`,
            "Content-Type": "application/json",
          },
        }
      )
      const rulesData = await rulesRes.json()
      if (rulesData.success) {
        const rule = rulesData.result?.find(
          (r: any) =>
            r.matchers?.some(
              (m: any) => m.type === "literal" && m.field === "to" && m.value === fullAddress
            )
        )
        if (rule) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${domain.zone_id}/email/routing/rules/${rule.id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${domain.cloudflare_token}` },
            }
          )
        }
      }
    }

    await supabase.from("email_addresses").delete().eq("id", emailId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 }
    )
  }
}

async function resolveZoneId(domain: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(domain)}`,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    )
    const data = await res.json()
    return data.result?.[0]?.id || null
  } catch {
    return null
  }
}

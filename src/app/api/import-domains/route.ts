import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

async function upsertCloudflareRule(zoneId: string, token: string, localPart: string, domainName: string) {
  const fullAddress = `${localPart}@${domainName}`

  // Fetch existing rules
  const rulesRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`,
    {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }
  )
  if (!rulesRes.ok) return { updated: false, reason: "Failed to fetch rules" }
  const rulesData = await rulesRes.json()
  if (!rulesData.success) return { updated: false, reason: "Cloudflare API error" }

  const existingRule = rulesData.result?.find(
    (r: any) =>
      r.matchers?.some(
        (m: any) => m.type === "literal" && m.field === "to" && m.value === fullAddress
      )
  )

  if (existingRule) {
    // Rule exists — update action to Worker if not already
    const currentAction = existingRule.actions?.[0]
    if (currentAction?.type === "worker" && currentAction.value?.[0] === "mailforge-email-worker") {
      return { updated: false, reason: "Already points to Worker" }
    }

    const updateRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${existingRule.id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existingRule,
          actions: [{ type: "worker", value: ["mailforge-email-worker"] }],
        }),
      }
    )
    const updateData = await updateRes.json()
    if (!updateData.success) return { updated: false, reason: updateData.errors?.[0]?.message || "Update failed" }
    return { updated: true, action: "updated" }
  }

  // No existing rule — create new
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `MailForge: ${fullAddress}`,
        matchers: [{ type: "literal", field: "to", value: fullAddress }],
        actions: [{ type: "worker", value: ["mailforge-email-worker"] }],
        enabled: true,
        priority: 50,
      }),
    }
  )
  const createData = await createRes.json()
  if (!createData.success) return { updated: false, reason: createData.errors?.[0]?.message || "Create failed" }
  return { updated: true, action: "created" }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = auth.user.id
    const { domains, emails, cfToken } = await req.json()

    const supabase = createAdminClient()
    const results: { domain: string; status: string; error?: string; routes?: number }[] = []

    for (const cfDomain of domains) {
      try {
        const { data: existing } = await supabase
          .from("domains")
          .select("id, user_id")
          .eq("domain", cfDomain.name)
          .maybeSingle()

        let domainId: string
        if (existing) {
          if (existing.user_id !== userId) {
            results.push({ domain: cfDomain.name, status: "skipped", error: "Owned by another user" })
            continue
          }
          domainId = existing.id
          const { error } = await supabase.from("domains").update({
            cloudflare_token: cfToken,
            zone_id: cfDomain.id,
          }).eq("id", domainId)
          if (error) throw error
        } else {
          const { data: inserted, error } = await supabase.from("domains").insert({
            user_id: userId,
            domain: cfDomain.name,
            cloudflare_token: cfToken,
            zone_id: cfDomain.id,
            smtp_provider: "gmail",
            smtp_host: "smtp.gmail.com",
            smtp_port: 587,
          }).select("id")
          if (error) throw error
          domainId = inserted![0].id
        }

        const domainEmails = emails.filter((e: any) => e.domain === cfDomain.name && !e.isCatchAll)
        let routeCount = 0
        for (const email of domainEmails) {
          await supabase.from("email_addresses").upsert({
            domain_id: domainId,
            local_part: email.localPart,
          }, { onConflict: "local_part,domain_id", ignoreDuplicates: true })

          // Update or create Cloudflare routing rule to point to Worker
          const result = await upsertCloudflareRule(cfDomain.id, cfToken, email.localPart, cfDomain.name)
          if (result.updated) routeCount++
        }

        results.push({ domain: cfDomain.name, status: "ok", routes: routeCount })
      } catch (err) {
        results.push({ domain: cfDomain.name, status: "error", error: err instanceof Error ? err.message : "Unknown" })
      }
    }

    const failed = results.filter(r => r.status === "error")
    if (failed.length > 0) {
      return NextResponse.json({
        success: false,
        message: `${failed.length} domain(s) failed`,
        results,
      })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: "Cloudflare API token required" }, { status: 400 })
    }

    const zonesRes = await fetch("https://api.cloudflare.com/client/v4/zones", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
    const zonesData = await zonesRes.json()
    if (!zonesData.success) {
      return NextResponse.json({ error: `Cloudflare: ${zonesData.errors?.[0]?.message || "Invalid token"}` }, { status: 400 })
    }

    const domains: any[] = []
    const emailAddresses: any[] = []

    for (const zone of zonesData.result) {
      const domainEntry = {
        id: zone.id,
        name: zone.name,
        status: zone.status,
      }
      domains.push(domainEntry)

      const rulesRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone.id}/email/routing/rules`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )
      if (!rulesRes.ok) continue

      const rulesData = await rulesRes.json()
      if (!rulesData.success) continue

      for (const rule of rulesData.result) {
        for (const matcher of rule.matchers) {
          if (matcher.type === "all") {
            emailAddresses.push({
              domain: zone.name,
              zoneId: zone.id,
              ruleId: rule.id,
              localPart: "*",
              fullAddress: `*@${zone.name}`,
              action: rule.actions?.[0]?.type || "forward",
              actionValue: rule.actions?.[0]?.value?.[0] || "",
              enabled: rule.enabled,
              isCatchAll: true,
            })
          } else if (matcher.type === "literal" && matcher.field === "to") {
            const [localPart, domain] = matcher.value.split("@")
            emailAddresses.push({
              domain: zone.name,
              zoneId: zone.id,
              ruleId: rule.id,
              localPart,
              fullAddress: matcher.value,
              action: rule.actions?.[0]?.type || "forward",
              actionValue: rule.actions?.[0]?.value?.[0] || "",
              enabled: rule.enabled,
              isCatchAll: false,
            })
          }
        }
      }
    }

    return NextResponse.json({ domains, emailAddresses })
  } catch (error) {
    console.error("Cloudflare import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch from Cloudflare" },
      { status: 500 }
    )
  }
}

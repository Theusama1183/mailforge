import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

const DNS_RECORDS: { type: string; name: string; description: string; priority?: number }[] = [
  { type: "MX", name: "", description: "MX", priority: 10 },
  { type: "TXT", name: "dkim._domainkey", description: "DKIM" },
  { type: "TXT", name: "", description: "SPF" },
  { type: "TXT", name: "_dmarc", description: "DMARC" },
]

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const domainNameParam = url.searchParams.get("domain")
    if (!domainNameParam) return NextResponse.json({ error: "domain is required" }, { status: 400 })
    const domainName: string = domainNameParam

    const { data: domain } = await supabase
      .from("domains")
      .select("*")
      .eq("domain", domainName)
      .eq("user_id", user.id)
      .single()

    if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 })

    const checks = DNS_RECORDS.map(record => ({
      ...record,
      domain: domainName,
      status: "unknown" as const,
      expected: getExpectedValue(record.type, record.name, domainName),
      found: null as string | null,
    }))

    return NextResponse.json({ domain: domainName, records: checks })
  } catch {
    return NextResponse.json({ error: "Failed to check domain health" }, { status: 500 })
  }
}

function getExpectedValue(type: string, name: string, domain: string): string {
  switch (type) {
    case "MX":
      return `mail.${domain} (priority 10)`
    case "TXT":
      if (name === "dkim._domainkey") return `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...`
      if (name === "") return `v=spf1 include:_spf.google.com ~all`
      if (name === "_dmarc") return `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`
      return ""
    default:
      return ""
  }
}

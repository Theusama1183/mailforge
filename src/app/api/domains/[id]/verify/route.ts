import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"
import { lookupTxtRecord } from "@/lib/dns"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { data: domain } = await supabase
      .from("email_domains")
      .select("*")
      .eq("id", id)
      .single()

    if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 })

    const admin = createAdminClient()
    const checks: Record<string, boolean> = {}
    const results: Record<string, string> = {}

    // Check MX record
    try {
      const mxRecords = await lookupTxtRecord(domain.domain, "MX")
      const hasValidMx = /\.mailforge\.app\.$/i.test(mxRecords?.text || "")
      checks.mx = hasValidMx
      results.mx = mxRecords?.text || "Not found"
    } catch {
      checks.mx = false
      results.mx = "Lookup failed"
    }

    // Check SPF record
    try {
      const spfRecords = await lookupTxtRecord(domain.domain, "TXT")
      const hasSpf = /v=spf1/i.test(spfRecords?.text || "")
      checks.spf = hasSpf
      results.spf = spfRecords?.text || "Not found"
    } catch {
      checks.spf = false
      results.spf = "Lookup failed"
    }

    // Check DKIM record
    const dkimSelector = process.env.DKIM_SELECTOR || "mailforge"
    try {
      const dkimRecords = await lookupTxtRecord(`${dkimSelector}._domainkey.${domain.domain}`, "TXT")
      const hasDkim = /v=DKIM1/i.test(dkimRecords?.text || "")
      checks.dkim = hasDkim
      results.dkim = dkimRecords?.text || "Not found"
    } catch {
      checks.dkim = false
      results.dkim = "Lookup failed"
    }

    // Check DMARC record
    try {
      const dmarcRecords = await lookupTxtRecord(`_dmarc.${domain.domain}`, "TXT")
      const hasDmarc = /v=DMARC1/i.test(dmarcRecords?.text || "")
      checks.dmarc = hasDmarc
      results.dmarc = dmarcRecords?.text || "Not found"
    } catch {
      checks.dmarc = false
      results.dmarc = "Lookup failed"
    }

    // Check domain ownership verification TXT
    const verificationToken = domain.verification_token || `${auth.user.id.slice(0, 8)}-mailforge-verify`
    let ownershipVerified = domain.verified_at !== null
    try {
      if (!ownershipVerified) {
        const txtRecords = await lookupTxtRecord(domain.domain, "TXT")
        if (txtRecords?.text?.includes(verificationToken)) {
          const now = new Date().toISOString()
          await admin.from("email_domains").update({
            verified_at: now,
          }).eq("id", id)
          ownershipVerified = true
          results.ownership = "Verified"
        } else {
          results.ownership = `Pending — add TXT record with value: ${verificationToken}`
        }
      } else {
        results.ownership = "Verified"
      }
    } catch {
      results.ownership = "Lookup failed"
    }

    // Update domain with verification results
    const allPassed = checks.mx && checks.spf && checks.dkim && checks.dmarc && ownershipVerified
    await admin.from("email_domains").update({
      mx_verified: checks.mx,
      spf_verified: checks.spf,
      dkim_verified: checks.dkim,
      dmarc_verified: checks.dmarc,
      verified_at: ownershipVerified ? (domain.verified_at || new Date().toISOString()) : domain.verified_at,
    }).eq("id", id)

    return NextResponse.json({
      checks,
      results,
      allPassed,
      verificationToken,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import crypto from "crypto"

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 })
    }

    if (otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 })
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rl = await checkRateLimit(`verify-otp:${email}:${ip}`, RATE_LIMITS.auth)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const admin = createAdminClient()

    const otpHash = hashOTP(otp)

    // Find the OTP record
    const { data: records, error: fetchError } = await admin
      .from("auth_otps")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(5)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    if (!records || records.length === 0) {
      return NextResponse.json({ error: "No valid OTP found. Request a new one." }, { status: 400 })
    }

    // Find matching OTP (not expired, not used, not exceeded attempts)
    const validRecord = records.find(r => {
      if (r.used) return false
      if (new Date(r.expires_at) < new Date()) return false
      if (r.attempts >= 5) return false
      if (r.otp_hash !== otpHash) return false
      return true
    })

    if (!validRecord) {
      // Increment attempts on the most recent record
      const latest = records[0]
      if (latest && latest.attempts < 5) {
        await admin.from("auth_otps").update({ attempts: latest.attempts + 1 }).eq("id", latest.id)
      }

      // Check if any record was expired
      const expired = records.find(r => new Date(r.expires_at) < new Date())
      if (expired) {
        return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 })
      }

      // Check attempts exhausted
      const maxed = records.find(r => r.attempts >= 5)
      if (maxed) {
        return NextResponse.json({ error: "Too many invalid attempts. Request a new OTP." }, { status: 429 })
      }

      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    // Mark OTP as used
    await admin.from("auth_otps").update({ used: true }).eq("id", validRecord.id)

    // Try to confirm the user's email
    let user = null
    if (validRecord.user_id) {
      try {
        const { data: userData } = await admin.auth.admin.updateUserById(validRecord.user_id, {
          email_confirm: true,
        })
        user = userData?.user
      } catch (err) {
        console.error("Failed to confirm user email:", err)
      }
    }

    return NextResponse.json({
      verified: true,
      user_id: validRecord.user_id,
    })
  } catch (error) {
    console.error("verify-otp error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

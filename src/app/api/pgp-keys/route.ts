import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import * as openpgp from "openpgp"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { data, error } = await supabase
      .from("pgp_keys")
      .select("*")
      .eq("user_id", auth.user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { email_address, public_key } = await req.json()
    if (!email_address || !public_key) {
      return NextResponse.json({ error: "email_address and public_key required" }, { status: 400 })
    }

    // Parse and validate the key
    let parsed
    try {
      parsed = await openpgp.readKey({ armoredKey: public_key })
    } catch {
      return NextResponse.json({ error: "Invalid PGP public key" }, { status: 400 })
    }

    const fingerprint = parsed.getFingerprint?.() || "unknown"
    const algo = parsed.getAlgorithmInfo?.()
    const algorithm = algo?.algorithm || "unknown"
    const expiration = await parsed.getExpirationTime()
    const expiresAt = expiration instanceof Date ? expiration.toISOString() : null

    const { data, error } = await supabase
      .from("pgp_keys")
      .insert({
        user_id: auth.user.id,
        email_address,
        public_key,
        fingerprint,
        algorithm,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A key for this email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    // Soft revoke
    const { error } = await supabase
      .from("pgp_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

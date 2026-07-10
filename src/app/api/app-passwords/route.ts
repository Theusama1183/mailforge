import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import crypto from "crypto"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { data, error } = await supabase
      .from("app_passwords")
      .select("id, name, scopes, last_used_at, created_at, expires_at")
      .is("revoked_at", null)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed to fetch app passwords" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { name, scopes } = await req.json()
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

    const plainPassword = crypto.randomBytes(16).toString("hex")
    const passwordHash = crypto.createHash("sha256").update(plainPassword).digest("hex")

    const { data, error } = await supabase
      .from("app_passwords")
      .insert({
        user_id: user.id,
        name,
        password_hash: passwordHash,
        scopes: scopes || ["smtp", "imap"],
      })
      .select("id, name, scopes, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ...data,
      plain_password: plainPassword,
      message: "Save this password — it won't be shown again",
    })
  } catch {
    return NextResponse.json({ error: "Failed to create app password" }, { status: 500 })
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

    const { error } = await supabase
      .from("app_passwords")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to revoke app password" }, { status: 500 })
  }
}

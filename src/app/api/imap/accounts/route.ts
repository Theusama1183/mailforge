import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import CryptoJS from "crypto-js"

function getEncryptionKey(): string {
  const key = process.env.IMAP_ENCRYPTION_KEY
  if (!key) {
    throw new Error("IMAP_ENCRYPTION_KEY environment variable is required for IMAP account encryption")
  }
  return key
}

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString()
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("imap_accounts")
      .select("id, name, host, port, username, use_tls, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch IMAP accounts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.host || !body.username || !body.password) {
      return NextResponse.json({ error: "Host, username, and password required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("imap_accounts")
      .insert({
        user_id: user.id,
        name: body.name || "",
        host: body.host,
        port: body.port || 993,
        username: body.username,
        password_encrypted: encrypt(body.password),
        use_tls: body.use_tls !== false,
      })
      .select("id, name, host, port, username, use_tls, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create IMAP account" }, { status: 500 })
  }
}

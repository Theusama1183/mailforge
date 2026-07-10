import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import crypto from "crypto"

function encrypt(text: string): string {
  const key = process.env.IMAP_ENCRYPTION_KEY
  if (!key) throw new Error("IMAP_ENCRYPTION_KEY is not set")
  const aesKey = crypto.createHash("sha256").update(key).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase, user } = auth
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    let query = supabase
      .from("imap_accounts")
      .select("id, name, host, port, username, use_tls, sync_frequency, created_at, updated_at")
      .eq("user_id", user.id)
    if (workspaceId) query = query.eq("workspace_id", workspaceId)
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch IMAP accounts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase, user } = auth

    const body = await req.json()
    if (!body.host || !body.username || !body.password) {
      return NextResponse.json({ error: "Host, username, and password required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("imap_accounts")
      .insert({
        user_id: user.id,
        workspace_id: body.workspaceId || null,
        name: body.name || "",
        host: body.host,
        port: body.port || 993,
        username: body.username,
        password_encrypted: encrypt(body.password),
        use_tls: body.use_tls !== false,
        sync_frequency: body.sync_frequency || 0,
      })
      .select("id, name, host, port, username, use_tls, sync_frequency, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create IMAP account"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

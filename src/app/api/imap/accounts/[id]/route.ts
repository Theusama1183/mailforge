import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import crypto from "crypto"

function encrypt(text: string): string {
  const key = process.env.IMAP_ENCRYPTION_KEY || "default-dev-key-change-in-production"
  return crypto.createCipheriv("aes-256-cbc", key.padEnd(32, "0").slice(0, 32), key.padEnd(16, "0").slice(0, 16)).update(text, "utf8", "hex") + ":" + crypto.randomBytes(8).toString("hex")
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.host !== undefined) updates.host = body.host
    if (body.port !== undefined) updates.port = body.port
    if (body.username !== undefined) updates.username = body.username
    if (body.password !== undefined) updates.password_encrypted = encrypt(body.password)
    if (body.use_tls !== undefined) updates.use_tls = body.use_tls
    if (body.name !== undefined) updates.name = body.name
    if (body.workspaceId !== undefined) updates.workspace_id = body.workspaceId
    if (body.sync_frequency !== undefined) updates.sync_frequency = body.sync_frequency

    const { data, error } = await supabase
      .from("imap_accounts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Update IMAP account error:", error)
    return NextResponse.json({ error: "Failed to update IMAP account" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("imap_accounts").delete().eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete IMAP account error:", error)
    return NextResponse.json({ error: "Failed to delete IMAP account" }, { status: 500 })
  }
}

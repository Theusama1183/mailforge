import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const admin = createAdminClient()

    const { data, error } = await admin
      .from("invitations")
      .select("*, workspaces!inner(name, created_by), inviter:users!invited_by(email)")
      .eq("token", token)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    if (data.status !== "pending") return NextResponse.json({ error: "Invitation already used" }, { status: 400 })
    if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: "Invitation expired" }, { status: 410 })

    return NextResponse.json({
      id: data.id,
      workspace_id: data.workspace_id,
      workspace_name: (data.workspaces as any)?.name,
      invited_by_email: (data.inviter as any)?.email,
      email: data.email,
      message: data.message,
      created_at: data.created_at,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { sendEmail, renderInviteEmail } from "@/lib/email"
import crypto from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

async function lookupUserByEmail(supabase: SupabaseClient, email: string) {
  const { data } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle()
  return data
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: membership } = await supabase
      .from("workspace_members").select("id").eq("workspace_id", id).eq("user_id", user.id).maybeSingle()
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data, error } = await supabase
      .from("invitations").select("*, users!inner(email) as inviter").eq("workspace_id", id).order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { email, message, emailIds } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const { data: membership } = await supabase
      .from("workspace_members").select("role").eq("workspace_id", id).eq("user_id", user.id).maybeSingle()
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only workspace admins can invite" }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from("invitations").select("id, status").eq("workspace_id", id).eq("email", email.toLowerCase()).in("status", ["pending"]).maybeSingle()
    if (existing) return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 409 })

    const userRecord = await lookupUserByEmail(supabase, email)
    if (userRecord) {
      const { data: alreadyMember } = await supabase
        .from("workspace_members").select("id").eq("workspace_id", id).eq("user_id", userRecord.id).maybeSingle()
      if (alreadyMember) return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 409 })
    }

    const token = crypto.randomBytes(32).toString("hex")

    const { data: invitation, error: invError } = await supabase
      .from("invitations").insert({
        workspace_id: id, invited_by: user.id, email: email.toLowerCase(),
        token, message: message || null, assigned_email_ids: Array.isArray(emailIds) ? emailIds : [],
      }).select().single()
    if (invError) return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })

    const { data: workspace } = await supabase
      .from("workspaces").select("name").eq("id", id).single()
    const inviterName = user.user_metadata?.name || user.email || "Someone"

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    await sendEmail({
      to: email,
      subject: `You're invited to ${workspace?.name || "a workspace"} on MailForge`,
      html: renderInviteEmail({ inviterName, workspaceName: workspace?.name || "a workspace", acceptUrl: `${BASE_URL}/invite/${token}`, message: message || undefined }),
    })

    return NextResponse.json({ ...invitation, email_sent: true })
  } catch {
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const inviteId = url.searchParams.get("invite_id")
    if (!inviteId) return NextResponse.json({ error: "invite_id required" }, { status: 400 })

    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: membership } = await supabase
      .from("workspace_members").select("role").eq("workspace_id", id).eq("user_id", user.id).maybeSingle()
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can cancel invitations" }, { status: 403 })
    }

    const { error } = await supabase.from("invitations").update({ status: "cancelled" }).eq("id", inviteId).eq("workspace_id", id)
    if (error) return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail, renderInviteEmail } from "@/lib/email"
import crypto from "crypto"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("invitations")
      .select("*, users!inner(email) as inviter")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { email, message, emailIds } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const admin = createAdminClient()

    // Check if user is admin of this workspace
    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only workspace admins can invite" }, { status: 403 })
    }

    // Check if already invited (pending)
    const { data: existing } = await admin
      .from("invitations")
      .select("id, status")
      .eq("workspace_id", id)
      .eq("email", email.toLowerCase())
      .in("status", ["pending"])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 409 })
    }

    // Check if user is already a member
    const { data: userRecord } = await admin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (userRecord) {
      const { data: alreadyMember } = await admin
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", id)
        .eq("user_id", userRecord.id)
        .maybeSingle()

      if (alreadyMember) {
        return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 409 })
      }
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex")

    // Create invitation
    const { data: invitation, error: invError } = await admin
      .from("invitations")
      .insert({
        workspace_id: id,
        invited_by: user.id,
        email: email.toLowerCase(),
        token,
        message: message || null,
        assigned_email_ids: Array.isArray(emailIds) ? emailIds : [],
      })
      .select()
      .single()

    if (invError) {
      console.error("Invitation creation error:", invError)
      return NextResponse.json({ error: invError.message }, { status: 500 })
    }

    // Get workspace name and inviter name for email
    const { data: workspace } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", id)
      .single()

    const inviterName = user.user_metadata?.name || user.email || "Someone"

    // Send invitation email
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const acceptUrl = `${BASE_URL}/invite/${token}`
    const emailSent = await sendEmail({
      to: email,
      subject: `You're invited to ${workspace?.name || "a workspace"} on MailForge`,
      html: renderInviteEmail({
        inviterName,
        workspaceName: workspace?.name || "a workspace",
        acceptUrl,
        message: message || undefined,
      }),
    })

    return NextResponse.json({
      ...invitation,
      email_sent: emailSent,
    })
  } catch (error) {
    console.error("Invite error:", error)
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


    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })


    const { user  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()
    const { error } = await admin
      .from("invitations")
      .update({ status: "cancelled" })
      .eq("id", inviteId)
      .eq("workspace_id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 })
  }
}

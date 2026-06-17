import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()

    // Fetch invitation
    const { data: invitation, error: invError } = await admin
      .from("invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle()

    if (invError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation already used" }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    // Verify the logged-in user's email matches the invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        error: "This invitation was sent to a different email address",
      }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invitation.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!existingMember) {
      // Add user as member
      const { error: memberError } = await admin
        .from("workspace_members")
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: "member",
        })

      if (memberError) {
        console.error("Failed to add member:", memberError)
        return NextResponse.json({ error: "Failed to add you to workspace" }, { status: 500 })
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await admin
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id)

    if (updateError) {
      console.error("Failed to update invitation:", updateError)
    }

    // Get workspace name
    const { data: workspace } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", invitation.workspace_id)
      .single()

    return NextResponse.json({
      success: true,
      workspace_id: invitation.workspace_id,
      workspace_name: workspace?.name,
    })
  } catch (error) {
    console.error("Accept error:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}

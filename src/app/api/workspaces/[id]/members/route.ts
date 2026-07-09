import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
    const admin = createAdminClient()

    const { data: membership } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data, error } = await admin
      .from("workspace_members")
      .select("id, user_id, role, created_at, users!inner(email)")
      .eq("workspace_id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
    const admin = createAdminClient()

    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 })
    }

    const { email, role } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const { data: invitedUser, error: lookupError } = await admin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (lookupError) {
      console.error("User lookup error:", lookupError)
      return NextResponse.json({ error: "Database error looking up user" }, { status: 500 })
    }

    if (!invitedUser) {
      return NextResponse.json({ error: "User not found. They need to register first." }, { status: 404 })
    }

    const { data: existingMember } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", id)
      .eq("user_id", invitedUser.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 409 })
    }

    const { data, error: insertError } = await admin
      .from("workspace_members")
      .insert({ workspace_id: id, user_id: invitedUser.id, role: role || "member" })
      .select()
      .single()

    if (insertError) {
      console.error("Member insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Invite member error:", error)
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const memberId = url.searchParams.get("member_id")
    if (!memberId) return NextResponse.json({ error: "member_id required" }, { status: 400 })

    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
    const admin = createAdminClient()

    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 })
    }

    const { error } = await admin.from("workspace_members").delete().eq("id", memberId).eq("workspace_id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, emailIds } = await req.json()
    if (!userId || !Array.isArray(emailIds)) {
      return NextResponse.json({ error: "userId and emailIds array required" }, { status: 400 })
    }

    // Verify admin
    const admin = createAdminClient()
    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can assign emails" }, { status: 403 })
    }

    // Snapshot current assignments for rollback
    const { data: wsEmails } = await admin
      .from("email_addresses")
      .select("id")
      .eq("workspace_id", id)
      .eq("assigned_to", userId)

    const previouslyAssigned = wsEmails?.map(e => e.id) || []

    // Unassign all emails from this user in this workspace
    if (previouslyAssigned.length > 0) {
      await admin
        .from("email_addresses")
        .update({ assigned_to: null })
        .in("id", previouslyAssigned)
    }

    // Assign the selected emails
    if (emailIds.length > 0) {
      const { error: assignError } = await admin
        .from("email_addresses")
        .update({ assigned_to: userId })
        .in("id", emailIds)
        .eq("workspace_id", id)

      if (assignError) {
        // Rollback: restore previous assignments
        if (previouslyAssigned.length > 0) {
          await admin
            .from("email_addresses")
            .update({ assigned_to: userId })
            .in("id", previouslyAssigned)
        }
        return NextResponse.json({ error: assignError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 })
  }
}

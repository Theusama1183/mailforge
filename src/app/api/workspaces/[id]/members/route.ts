import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import type { SupabaseClient } from "@supabase/supabase-js"

async function lookupUserByEmail(supabase: SupabaseClient, email: string) {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle()
  return data
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data, error } = await supabase
      .from("workspace_members")
      .select("id, user_id, role, created_at, users!inner(email)")
      .eq("workspace_id", id)
    if (error) return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: membership } = await supabase
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

    const invitedUser = await lookupUserByEmail(supabase, email)
    if (!invitedUser) {
      return NextResponse.json({ error: "User not found. They need to register first." }, { status: 404 })
    }

    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", id)
      .eq("user_id", invitedUser.id)
      .maybeSingle()
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 409 })
    }

    const { data, error: insertError } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: id, user_id: invitedUser.id, role: role || "member" })
      .select()
      .single()
    if (insertError) {
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
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

    const { user, supabase } = auth

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 })
    }

    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId).eq("workspace_id", id)
    if (error) return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { userId, emailIds } = await req.json()
    if (!userId || !Array.isArray(emailIds)) {
      return NextResponse.json({ error: "userId and emailIds array required" }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can assign emails" }, { status: 403 })
    }

    const { data: wsEmails } = await supabase
      .from("email_addresses")
      .select("id")
      .eq("workspace_id", id)
      .eq("assigned_to", userId)
    const previouslyAssigned = wsEmails?.map(e => e.id) || []

    if (previouslyAssigned.length > 0) {
      await supabase.from("email_addresses").update({ assigned_to: null }).in("id", previouslyAssigned)
    }

    if (emailIds.length > 0) {
      const { error: assignError } = await supabase
        .from("email_addresses")
        .update({ assigned_to: userId })
        .in("id", emailIds)
        .eq("workspace_id", id)
      if (assignError) {
        if (previouslyAssigned.length > 0) {
          await supabase.from("email_addresses").update({ assigned_to: userId }).in("id", previouslyAssigned)
        }
        return NextResponse.json({ error: "Failed to assign emails" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use admin client to fetch members with their email from public.users
    const admin = createAdminClient()
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { email, role } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    // Look up user by email in public.users (populated by auth trigger)
    const admin = createAdminClient()
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

    // Check if already a member
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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use admin client to bypass RLS
    const admin = createAdminClient()
    const { error } = await admin.from("workspace_members").delete().eq("id", memberId).eq("workspace_id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}

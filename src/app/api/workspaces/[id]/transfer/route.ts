import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    // Verify user is workspace owner
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, created_by, name")
      .eq("id", id)
      .single()

    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    if (workspace.created_by !== auth.user.id) {
      return NextResponse.json({ error: "Only the workspace owner can transfer ownership" }, { status: 403 })
    }

    const { newOwnerId } = await req.json()
    if (!newOwnerId) return NextResponse.json({ error: "newOwnerId required" }, { status: 400 })
    if (newOwnerId === auth.user.id) return NextResponse.json({ error: "Already the owner" }, { status: 400 })

    // Verify new owner is a workspace member
    const { data: member } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", id)
      .eq("user_id", newOwnerId)
      .single()

    if (!member) return NextResponse.json({ error: "Target user is not a workspace member" }, { status: 400 })
    if (member.role === "admin") return NextResponse.json({ error: "Target is already an admin" }, { status: 400 })

    const admin = createAdminClient()

    // Demote current owner to admin, promote new owner
    const { error: err1 } = await supabase
      .from("workspace_members")
      .update({ role: "admin" })
      .eq("workspace_id", id)
      .eq("user_id", auth.user.id)

    if (err1) return NextResponse.json({ error: err1.message }, { status: 500 })

    const { error: err2 } = await admin
      .from("workspace_members")
      .update({ role: "owner" })
      .eq("workspace_id", id)
      .eq("user_id", newOwnerId)

    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })

    // Update workspace created_by
    const { error: err3 } = await supabase
      .from("workspaces")
      .update({ created_by: newOwnerId })
      .eq("id", id)

    if (err3) return NextResponse.json({ error: err3.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

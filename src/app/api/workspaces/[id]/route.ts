import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

async function isWorkspaceAdmin(admin: ReturnType<typeof createAdminClient>, workspaceId: string, userId: string) {
  const { data } = await admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return data?.role === "admin"
}

async function isWorkspaceMember(admin: ReturnType<typeof createAdminClient>, workspaceId: string, userId: string) {
  const { data } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return !!data
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
    const admin = createAdminClient()

    const { data: workspace, error } = await admin
      .from("workspaces")
      .select("*, workspace_members(*, users!inner(email))")
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const member = await isWorkspaceMember(admin, id, user.id)
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    return NextResponse.json(workspace)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
    const admin = createAdminClient()

    const { data: workspace } = await admin
      .from("workspaces")
      .select("created_by")
      .eq("id", id)
      .single()

    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isCreator = workspace.created_by === user.id
    const isAdmin = await isWorkspaceAdmin(admin, id, user.id)
    if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { name } = await req.json()
    const { data, error } = await admin
      .from("workspaces")
      .update({ name })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
    const admin = createAdminClient()

    const { data: workspace } = await admin
      .from("workspaces")
      .select("created_by")
      .eq("id", id)
      .single()

    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isCreator = workspace.created_by === user.id
    const isAdmin = await isWorkspaceAdmin(admin, id, user.id)
    if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { error } = await admin.from("workspaces").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 })
  }
}

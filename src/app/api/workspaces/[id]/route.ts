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
      .select("created_by, name")
      .eq("id", id)
      .single()

    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isCreator = workspace.created_by === user.id
    const isAdmin = await isWorkspaceAdmin(admin, id, user.id)
    if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const url = new URL(req.url)
    const exportData = url.searchParams.get("export") === "true"

    if (exportData) {
      // Collect data for export
      const [emails, members, domains, campaigns, abTests] = await Promise.all([
        admin.from("email_addresses").select("*").eq("workspace_id", id),
        admin.from("workspace_members").select("*, users!inner(email)").eq("workspace_id", id),
        admin.from("email_domains").select("*").eq("workspace_id", id),
        admin.from("campaigns").select("*").eq("workspace_id", id),
        admin.from("ab_tests").select("*").eq("workspace_id", id),
      ])

      const data = {
        workspace: { name: workspace.name, id },
        exportedAt: new Date().toISOString(),
        emails: emails.data || [],
        members: members.data || [],
        domains: domains.data || [],
        campaigns: campaigns.data || [],
        abTests: abTests.data || [],
      }

      // Store export in a new table or return as JSON
      return NextResponse.json(data)
    }

    const { error } = await admin.from("workspaces").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 })
  }
}

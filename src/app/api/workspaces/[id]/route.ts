import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import type { SupabaseClient } from "@supabase/supabase-js"

async function isWorkspaceAdmin(supabase: SupabaseClient, workspaceId: string, userId: string) {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return data?.role === "admin"
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("*, workspace_members(*, users!inner(email))")
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(workspace)
  } catch {
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("created_by")
      .eq("id", id)
      .single()

    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isCreator = workspace.created_by === user.id
    const isAdmin = await isWorkspaceAdmin(supabase, id, user.id)
    if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { name } = await req.json()
    const { data, error } = await supabase
      .from("workspaces")
      .update({ name })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("created_by, name")
      .eq("id", id)
      .single()

    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isCreator = workspace.created_by === user.id
    const isAdmin = await isWorkspaceAdmin(supabase, id, user.id)
    if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const url = new URL(req.url)
    const exportData = url.searchParams.get("export") === "true"

    if (exportData) {
      const [emails, members, domains, campaigns, abTests] = await Promise.all([
        supabase.from("email_addresses").select("*").eq("workspace_id", id),
        supabase.from("workspace_members").select("*, users!inner(email)").eq("workspace_id", id),
        supabase.from("email_domains").select("*").eq("workspace_id", id),
        supabase.from("campaigns").select("*").eq("workspace_id", id),
        supabase.from("ab_tests").select("*").eq("workspace_id", id),
      ])

      return NextResponse.json({
        workspace: { name: workspace.name, id },
        exportedAt: new Date().toISOString(),
        emails: emails.data || [],
        members: members.data || [],
        domains: domains.data || [],
        campaigns: campaigns.data || [],
        abTests: abTests.data || [],
      })
    }

    const { error } = await supabase.from("workspaces").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 })
  }
}

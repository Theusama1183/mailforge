import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

async function getGroupWithMembers(supabase: any, id: string, userId: string) {
  return supabase
    .from("contact_groups")
    .select("id, user_id, workspace_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single()
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const { data: group, error: groupError } = await getGroupWithMembers(supabase, id, user.id)
    if (groupError || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

    if (group.workspace_id && !(await verifyWorkspaceOrOwnership(supabase, user.id, group.workspace_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "0")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")
    const offset = page * pageSize
    const includeContacts = searchParams.get("includeContacts") === "true"

    let query = supabase
      .from("contact_group_members")
      .select("*, contacts(*)", { count: "exact" })
      .eq("group_id", id)

    if (includeContacts) {
      const { data, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data || [])
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, total: count })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { contactIds } = await req.json()
    if (!contactIds?.length) return NextResponse.json({ error: "contactIds required" }, { status: 400 })

    const { data: group, error: groupError } = await getGroupWithMembers(supabase, id, user.id)
    if (groupError || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

    if (group.workspace_id && !(await verifyWorkspaceOrOwnership(supabase, user.id, group.workspace_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", user.id)
      .in("id", contactIds)

    const validIds = contacts?.map(c => c.id) || []
    if (validIds.length === 0) return NextResponse.json({ error: "No valid contacts found" }, { status: 400 })

    const rows = validIds.map((contactId: string) => ({ group_id: id, contact_id: contactId }))
    const { error } = await supabase.from("contact_group_members").upsert(rows, { onConflict: "contact_id,group_id" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, added: validIds.length })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { contactIds } = await req.json()
    if (!contactIds?.length) return NextResponse.json({ error: "contactIds required" }, { status: 400 })

    const { data: group, error: groupError } = await getGroupWithMembers(supabase, id, user.id)
    if (groupError || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

    if (group.workspace_id && !(await verifyWorkspaceOrOwnership(supabase, user.id, group.workspace_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("contact_group_members")
      .delete()
      .eq("group_id", id)
      .in("contact_id", contactIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, removed: contactIds.length })
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove members" }, { status: 500 })
  }
}

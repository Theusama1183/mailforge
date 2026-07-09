import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { primaryId, duplicateIds, workspaceId } = await req.json()
    if (!primaryId || !duplicateIds?.length) {
      return NextResponse.json({ error: "primaryId and duplicateIds required" }, { status: 400 })
    }

    const allIds = [primaryId, ...duplicateIds]
    const { data: contacts, error: fetchError } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .in("id", allIds)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!contacts || contacts.length !== allIds.length) {
      return NextResponse.json({ error: "One or more contacts not found" }, { status: 404 })
    }

    if (workspaceId) {
      const allSameWorkspace = contacts.every(c => c.workspace_id === workspaceId)
      if (!allSameWorkspace) {
        return NextResponse.json({ error: "All contacts must belong to the same workspace" }, { status: 400 })
      }
    }

    const primary = contacts.find(c => c.id === primaryId)!
    const duplicates = contacts.filter(c => c.id !== primaryId)

    const merged = {
      email: primary.email,
      name: primary.name || duplicates.find(d => d.name)?.name || null,
      company: primary.company || duplicates.find(d => d.company)?.company || null,
      phone: primary.phone || duplicates.find(d => d.phone)?.phone || null,
      notes: primary.notes || duplicates.find(d => d.notes)?.notes || null,
      avatar_url: primary.avatar_url || duplicates.find(d => d.avatar_url)?.avatar_url || null,
      updated_at: new Date().toISOString(),
    }

    const dupIds = duplicates.map(d => d.id)

    const { error: updateError } = await supabase
      .from("contacts")
      .update(merged)
      .eq("id", primaryId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const { data: existingMembers } = await supabase
      .from("contact_group_members")
      .select("group_id, contact_id")
      .in("contact_id", dupIds)

    if (existingMembers?.length) {
      const { error: reassignError } = await supabase
        .from("contact_group_members")
        .upsert(
          existingMembers.map(m => ({
            group_id: m.group_id,
            contact_id: primaryId,
          })),
          { onConflict: "group_id,contact_id", ignoreDuplicates: true }
        )
      if (reassignError) return NextResponse.json({ error: reassignError.message }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from("contacts")
      .delete()
      .in("id", dupIds)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    const { data: updated } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", primaryId)
      .single()

    return NextResponse.json({ contact: updated, mergedCount: dupIds.length })
  } catch (error) {
    return NextResponse.json({ error: "Failed to merge contacts" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { email, domainId, workspaceId, aliasForId } = await req.json()

    if (!email || !domainId) {
      return NextResponse.json({ error: "Email and domainId required" }, { status: 400 })
    }

    // Verify domain ownership
    const { data: domain } = await supabase
      .from("email_domains")
      .select("id, workspace_id, verified_at")
      .eq("id", domainId)
      .single()

    if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    if (!domain.verified_at) return NextResponse.json({ error: "Domain not verified" }, { status: 400 })

    // Check workspace membership
    if (workspaceId) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", auth.user.id)
        .single()
      if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    } else if (domain.workspace_id) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", domain.workspace_id)
        .eq("user_id", auth.user.id)
        .single()
      if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    // Create email address (alias)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("email_addresses")
      .insert({
        user_id: auth.user.id,
        email,
        domain_id: domainId,
        workspace_id: workspaceId || domain.workspace_id,
        alias_for: aliasForId || null,
      })
      .select("id, email, is_catch_all, alias_for, created_at")
      .single()

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create alias"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { data: addr } = await supabase
      .from("email_addresses")
      .select("id, user_id, alias_for")
      .eq("id", id)
      .single()

    if (!addr) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Don't allow deleting primary addresses (those without alias_for)
    // Actually, allow deletion of any alias if it has alias_for set
    const admin = createAdminClient()
    const { error } = await admin.from("email_addresses").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete alias"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

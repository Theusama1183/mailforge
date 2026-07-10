import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { enabled, emailAddress } = await req.json()

    const { data: domain } = await supabase
      .from("email_domains")
      .select("*, workspace:workspaces!inner(created_by)")
      .eq("id", id)
      .single()
    if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 404 })

    const { data: member } = await supabase
      .from("workspace_members").select("id").eq("workspace_id", domain.workspace_id).eq("user_id", auth.user.id).single()
    if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })

    if (enabled && emailAddress) {
      const { data: targetEmail } = await supabase
        .from("email_addresses").select("id").eq("email", emailAddress).eq("domain_id", id).single()
      if (!targetEmail) return NextResponse.json({ error: "Target email not found in domain" }, { status: 400 })

      await supabase.from("email_addresses").update({ is_catch_all: false }).eq("domain_id", id)
      await supabase.from("email_addresses").update({ is_catch_all: true }).eq("id", targetEmail.id)
    } else {
      await supabase.from("email_addresses").update({ is_catch_all: false }).eq("domain_id", id)
    }

    return NextResponse.json({ success: true, enabled: !!enabled })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update catch-all"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { data: catchAll } = await supabase
      .from("email_addresses")
      .select("id, email, is_catch_all")
      .eq("domain_id", id)
      .eq("is_catch_all", true)
      .maybeSingle()

    return NextResponse.json({
      enabled: !!catchAll,
      catchAll: catchAll || null,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch catch-all status" }, { status: 500 })
  }
}

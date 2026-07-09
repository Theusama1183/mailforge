import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const url = new URL(req.url)
    const workspaceId = url.searchParams.get("workspace_id")

    let query = supabase.from("sso_providers").select("*").order("domain")
    if (workspaceId) query = query.eq("workspace_id", workspaceId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { workspace_id, domain, provider, label, metadata_url, entity_id, sso_url, certificate } = await req.json()
    if (!workspace_id || !domain) return NextResponse.json({ error: "workspace_id and domain required" }, { status: 400 })

    const { data, error } = await supabase
      .from("sso_providers")
      .insert({
        workspace_id,
        domain: domain.toLowerCase(),
        provider: provider || "saml",
        label: label || null,
        metadata_url: metadata_url || null,
        entity_id: entity_id || null,
        sso_url: sso_url || null,
        certificate: certificate || null,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "SSO provider for this domain already exists" }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { data, error } = await supabase
      .from("sso_providers")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
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

    const { error } = await supabase.from("sso_providers").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

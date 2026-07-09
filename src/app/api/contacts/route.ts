import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")?.trim()
    const groupId = searchParams.get("groupId")
    const workspaceId = searchParams.get("workspaceId")

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const page = parseInt(searchParams.get("page") || "0")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")
    const offset = page * pageSize

    let db = supabase.from("contacts").select("*", { count: "exact" }).eq("user_id", user.id)

    if (workspaceId) db = db.eq("workspace_id", workspaceId)

    if (query) {
      db = db.or(`email.ilike.%${query}%,name.ilike.%${query}%,company.ilike.%${query}%`)
    }

    if (groupId) {
      const { data: memberIds } = await supabase
        .from("contact_group_members")
        .select("contact_id")
        .eq("group_id", groupId)
      const ids = memberIds?.map(m => m.contact_id) || []
      db = db.in("id", ids.length ? ids : [""])
    }

    const { data, error, count } = await db
      .order("name", { ascending: true, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, total: count })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.email) return NextResponse.json({ error: "Email is required" }, { status: 400 })
    if (!body.workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, body.workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("contacts")
      .upsert({
        user_id: user.id,
        workspace_id: body.workspaceId,
        email: body.email.toLowerCase().trim(),
        name: body.name || null,
        notes: body.notes || null,
        company: body.company || null,
        phone: body.phone || null,
        avatar_url: body.avatar_url || null,
      }, { onConflict: "user_id,workspace_id,email", ignoreDuplicates: false })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}

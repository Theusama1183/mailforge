import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("contact:read", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase.from("contacts").select("*").eq("id", id).eq("workspace_id", auth.workspaceId).single()
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("API v1 get contact error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("contact:write", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await req.json()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase.from("contacts").update(body).eq("id", id).eq("workspace_id", auth.workspaceId).select().single()
    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("API v1 update contact error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("contact:delete", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error } = await supabase.from("contacts").delete().eq("id", id).eq("workspace_id", auth.workspaceId)
    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("API v1 delete contact error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("email:read", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase.from("emails").select("*").eq("id", id).eq("workspace_id", auth.workspaceId).single()
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("API v1 get email error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth
    if (!checkPermission("email:delete", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error } = await supabase.from("emails").delete().eq("id", id).eq("workspace_id", auth.workspaceId)
    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("API v1 delete email error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 })

    let query = supabase
      .from("email_addresses")
      .select("id, local_part, domain_id, assigned_to, domains(domain)")
      .eq("workspace_id", id)

    if (membership.role !== "admin") {
      query = query.eq("assigned_to", user.id)
    }

    const { data: emails, error } = await query
    if (error) {
      console.error("Failed to fetch workspace emails:", error)
      return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
    }

    return NextResponse.json(emails || [])
  } catch (err) {
    console.error("Failed to fetch workspace emails:", err)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}

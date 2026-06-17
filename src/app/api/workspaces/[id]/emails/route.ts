import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()

    // Verify user is a member of this workspace
    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    // Fetch workspace email addresses with domain names
    // Admins see all; members only see their assigned
    let query = admin
      .from("email_addresses")
      .select("id, local_part, domain_id, assigned_to, domains!inner(domain)")
      .eq("workspace_id", id)

    if (membership.role !== "admin") {
      query = query.eq("assigned_to", user.id)
    }

    const { data: emails, error } = await query

    if (error) {
      console.error("Fetch workspace emails error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(emails || [])
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}

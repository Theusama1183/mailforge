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
    const groupId = searchParams.get("groupId")
    const workspaceId = searchParams.get("workspaceId")

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let db = supabase.from("contacts").select("*").eq("user_id", user.id)

    if (workspaceId) db = db.eq("workspace_id", workspaceId)

    if (groupId) {
      const { data: memberIds } = await supabase
        .from("contact_group_members")
        .select("contact_id")
        .eq("group_id", groupId)
      const ids = memberIds?.map(m => m.contact_id) || []
      db = db.in("id", ids.length ? ids : [""])
    }

    const { data, error } = await db.order("name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const header = "email,name,company,phone,notes"
    const rows = data.map(c => {
      const escape = (v: string | null) => {
        const s = v || ""
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
      }
      return [escape(c.email), escape(c.name), escape(c.company), escape(c.phone), escape(c.notes)].join(",")
    })
    const csv = [header, ...rows].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export contacts" }, { status: 500 })
  }
}

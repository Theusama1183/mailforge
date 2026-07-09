import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { ids, workspaceId } = await req.json()
    if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 })
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .in("id", ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contacts" }, { status: 500 })
  }
}

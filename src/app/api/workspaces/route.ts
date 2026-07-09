import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, workspaces(*)")
      .eq("user_id", user.id)

    const workspaces = memberships?.map(m => ({ ...(m.workspaces as any), role: m.role })) || []
    return NextResponse.json(workspaces)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch workspaces"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    // Use admin client to bypass RLS for workspace creation
    // The service role key avoids the "violates row-level security policy" error
    const admin = createAdminClient()

    const { data: workspace, error: wsError } = await admin
      .from("workspaces")
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (wsError) {
      console.error("Workspace creation error:", wsError)
      return NextResponse.json({
        error: wsError.message.includes("schema cache")
          ? "Could not find the table 'public.workspaces' in the schema cache"
          : wsError.message,
      }, { status: 500 })
    }

    const { error: memberError } = await admin.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "admin",
    })

    if (memberError) {
      console.error("Member creation error:", memberError)
      await admin.from("workspaces").delete().eq("id", workspace.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create workspace"
    console.error("Workspace POST error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("emails").delete().eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 })
  }
}

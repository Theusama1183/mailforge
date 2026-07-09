import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    const { id } = await params

    const { data: test } = await supabase
      .from("ab_tests")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { error } = await supabase.from("ab_tests").update({ status: "completed" }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to complete test" }, { status: 500 })
  }
}

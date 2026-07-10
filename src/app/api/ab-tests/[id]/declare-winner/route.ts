import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    const { id } = await params

    const body = await req.json()
    const { winning_variant_id } = body

    if (!winning_variant_id) {
      return NextResponse.json({ error: "winning_variant_id is required" }, { status: 400 })
    }

    const { data: test } = await supabase
      .from("ab_tests")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: variant } = await supabase
      .from("ab_test_variants")
      .select("id")
      .eq("id", winning_variant_id)
      .eq("ab_test_id", id)
      .single()

    if (!variant) return NextResponse.json({ error: "Variant not part of this test" }, { status: 400 })

    await supabase.from("ab_tests").update({
      status: "completed",
      winning_variant_id,
    }).eq("id", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to declare winner" }, { status: 500 })
  }
}

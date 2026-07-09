import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: email } = await supabase
      .from("emails")
      .select("id, delivery_status, direction")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 })
    if (email.delivery_status === "sent" || email.delivery_status === "delivered") {
      return NextResponse.json({ error: "Email already sent" }, { status: 400 })
    }

    const { error } = await supabase.from("emails").delete().eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 })
  }
}

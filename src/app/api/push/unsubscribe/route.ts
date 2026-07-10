import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const { error } = await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", user.id)

    if (error) {
      console.error("Failed to remove push subscription:", error)
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Push unsubscribe error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

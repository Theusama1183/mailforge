import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const { subscription } = await req.json()

    if (!subscription) {
      return NextResponse.json({ error: "Missing subscription" }, { status: 400 })
    }

    const subscriptionJson = typeof subscription === "string" ? subscription : JSON.stringify(subscription)

    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: user.id,
        token: subscriptionJson,
        platform: "web",
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("Failed to save push subscription:", error)
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Push subscribe error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

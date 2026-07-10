import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const { token, platform } = await req.json()
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { error: upsertError } = await supabase
      .from("push_tokens").upsert({
        user_id: user.id, token, platform: platform || "ios", updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,token", ignoreDuplicates: false })

    if (upsertError) return NextResponse.json({ error: "Failed to save token" }, { status: 500 })

    return NextResponse.json({ registered: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    await supabase.from("push_tokens").delete().eq("user_id", user.id).eq("token", token)
    return NextResponse.json({ removed: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { token, platform } = await req.json()
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    // Upsert push token
    const { error: upsertError } = await admin
      .from("push_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          platform: platform || "ios",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token", ignoreDuplicates: false }
      )

    if (upsertError) {
      console.error("Failed to save push token:", upsertError)
      return NextResponse.json({ error: "Failed to save token" }, { status: 500 })
    }

    return NextResponse.json({ registered: true })
  } catch (error) {
    console.error("Push register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()
    await admin.from("push_tokens").delete().eq("user_id", user.id).eq("token", token)

    return NextResponse.json({ removed: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

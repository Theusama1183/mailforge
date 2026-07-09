import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

    const admin = createAdminClient()

    // Verify token
    const { data: resetToken } = await admin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single()

    if (!resetToken) return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Update password via Supabase admin API
    const { error: updateError } = await admin.auth.admin.updateUserById(resetToken.user_id, {
      password,
    })

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Mark token as used
    await admin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", resetToken.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset password"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

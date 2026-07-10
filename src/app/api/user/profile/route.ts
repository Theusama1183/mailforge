import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

function getAdminClient() {
  return createAdminClient()
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user: authUser, supabase } = auth

    const admin = getAdminClient()
    const { data: userData, error: userErr } = await admin
      .from("users").select("id, email, name, created_at").eq("id", authUser.id).single()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", authUser.id).maybeSingle()
    return NextResponse.json({ ...userData, profile: profile || null })
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user: authUser, supabase } = auth

    const body = await req.json()
    const admin = getAdminClient()
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name.trim()

    if (body.timezone !== undefined || body.language !== undefined || body.avatar_url !== undefined) {
      const profileFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (body.timezone !== undefined) profileFields.timezone = body.timezone
      if (body.language !== undefined) profileFields.language = body.language
      if (body.avatar_url !== undefined) profileFields.avatar_url = body.avatar_url

      const { data: existing } = await supabase.from("user_profiles").select("id").eq("user_id", authUser.id).maybeSingle()
      if (existing) {
        await supabase.from("user_profiles").update(profileFields).eq("user_id", authUser.id)
      } else {
        await supabase.from("user_profiles").insert({ user_id: authUser.id, ...profileFields })
      }
    }

    let userData = null
    if (updates.name) {
      const { data } = await admin.from("users").update(updates).eq("id", authUser.id).select("id, email, name, created_at").single()
      userData = data
    } else {
      const { data } = await admin.from("users").select("id, email, name, created_at").eq("id", authUser.id).single()
      userData = data
    }

    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", authUser.id).maybeSingle()
    return NextResponse.json({ ...userData, profile: profile || null })
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

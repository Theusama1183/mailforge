import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const auth = await getAuthUser()

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user: authUser  } = auth
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()
    const { data: user, error } = await admin
      .from("users")
      .select("id, email, name, created_at")
      .eq("id", authUser.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user: authUser  } = auth
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name } = await req.json()
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("users")
      .update({ name: name.trim() })
      .eq("id", authUser.id)
      .select("id, email, name, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

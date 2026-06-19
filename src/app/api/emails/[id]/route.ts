import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

const ALLOWED_FIELDS = ["subject", "body_html", "body_text", "starred", "read", "archived", "folder", "mailbox"] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Field whitelisting: only allow specific fields to be updated
    const sanitizedBody: Partial<Record<AllowedField, unknown>> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.includes(key as AllowedField)) {
        sanitizedBody[key as AllowedField] = body[key]
      }
    }

    if (Object.keys(sanitizedBody).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { error } = await supabase
      .from("emails")
      .update(sanitizedBody)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })
    if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    const { data, error } = await supabase
      .from("email_label_assignments")
      .select("email_labels(*)")
      .eq("email_id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const labels = data?.map((a: any) => a.email_labels).filter(Boolean) || []
    return NextResponse.json(labels)
  } catch (error) {
    console.error("Labels fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })
    if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    const { labelIds } = await req.json() as { labelIds: string[] }

    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return NextResponse.json({ error: "labelIds must be a non-empty array" }, { status: 400 })
    }

    const assignments = labelIds.map((label_id: string) => ({ email_id: id, label_id }))
    const { data, error } = await supabase
      .from("email_label_assignments")
      .insert(assignments)
      .select("email_labels(*)")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const labels = data?.map((a: any) => a.email_labels).filter(Boolean) || []
    return NextResponse.json(labels)
  } catch (error) {
    console.error("Labels assign error:", error)
    return NextResponse.json({ error: "Failed to assign labels" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })
    if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 })

    const { labelIds } = await req.json() as { labelIds: string[] }

    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return NextResponse.json({ error: "labelIds must be a non-empty array" }, { status: 400 })
    }

    const { error } = await supabase
      .from("email_label_assignments")
      .delete()
      .eq("email_id", id)
      .in("label_id", labelIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Labels unassign error:", error)
    return NextResponse.json({ error: "Failed to unassign labels" }, { status: 500 })
  }
}

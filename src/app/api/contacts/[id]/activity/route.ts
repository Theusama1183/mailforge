import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("email")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const email = contact.email.toLowerCase().trim()

    const [sentResult, receivedResult] = await Promise.all([
      supabase
        .from("emails")
        .select("id, subject, from_address, from_name, to_addresses, direction, folder, created_at, read, starred")
        .eq("user_id", user.id)
        .eq("from_address", email)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("emails")
        .select("id, subject, from_address, from_name, to_addresses, direction, folder, created_at, read, starred")
        .eq("user_id", user.id)
        .filter("to_addresses", "cs", [email])
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    if (sentResult.error || receivedResult.error) {
      return NextResponse.json({ error: (sentResult.error || receivedResult.error)?.message }, { status: 500 })
    }

    const seen = new Set<string>()
    const merged = [...(sentResult.data || []), ...(receivedResult.data || [])]
      .filter(e => {
        if (seen.has(e.id)) return false
        seen.add(e.id)
        return true
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(merged)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contact activity" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const url = new URL(req.url)
    const accountId = url.searchParams.get("account_id")
    if (!accountId) return NextResponse.json({ error: "account_id required" }, { status: 400 })

    const { data, error } = await supabase
      .from("imap_folder_mappings")
      .select("*")
      .eq("account_id", accountId)
      .order("remote_folder", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed to fetch folder mappings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const body = await req.json()
    if (!body.account_id || !body.remote_folder || !body.local_folder) {
      return NextResponse.json({ error: "account_id, remote_folder, local_folder required" }, { status: 400 })
    }

    const { data: account } = await supabase
      .from("imap_accounts")
      .select("id")
      .eq("id", body.account_id)
      .eq("user_id", user.id)
      .single()

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

    const { data, error } = await supabase
      .from("imap_folder_mappings")
      .upsert({
        account_id: body.account_id,
        remote_folder: body.remote_folder,
        local_folder: body.local_folder,
        enabled: body.enabled ?? true,
      }, { onConflict: "account_id, remote_folder" })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to create folder mapping" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { data: mapping } = await supabase
      .from("imap_folder_mappings")
      .select("imap_accounts!inner(user_id)")
      .eq("id", id)
      .single()

    if (!mapping) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { error } = await supabase.from("imap_folder_mappings").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete folder mapping" }, { status: 500 })
  }
}

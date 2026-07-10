import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get("workspace_id")
    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50")), 100)
    const offset = (page - 1) * limit

    const { data: archives, error, count } = await supabase
      .from("email_archives")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspace_id)
      .order("archived_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ archives, total: count })
  } catch (error) {
    console.error("Email archive fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch archives" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspace_id, email_ids } = await req.json()
    if (!workspace_id || !Array.isArray(email_ids) || email_ids.length === 0) {
      return NextResponse.json({ error: "workspace_id and email_ids are required" }, { status: 400 })
    }

    const { data: emails, error: fetchError } = await supabase
      .from("emails")
      .select("*")
      .in("id", email_ids)
      .eq("user_id", user.id)

    if (fetchError) throw fetchError
    if (!emails || emails.length === 0) {
      return NextResponse.json({ error: "No emails found" }, { status: 404 })
    }

    const archives = emails.map((email) => ({
      workspace_id,
      original_email_id: email.id,
      archive_data: email,
    }))

    const { error: insertError } = await supabase
      .from("email_archives")
      .insert(archives)

    if (insertError) throw insertError

    const { error: deleteError } = await supabase
      .from("emails")
      .delete()
      .in("id", email_ids)
      .eq("user_id", user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ archived: email_ids.length })
  } catch (error) {
    console.error("Email archive error:", error)
    return NextResponse.json({ error: "Failed to archive emails" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get("workspace_id")
    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const olderThanDays = parseInt(searchParams.get("older_than_days") || "365")
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - olderThanDays)

    const { count, error } = await supabase
      .from("email_archives")
      .delete({ count: "exact" })
      .eq("workspace_id", workspace_id)
      .lt("archived_at", cutoff.toISOString())

    if (error) throw error

    return NextResponse.json({ deleted: count })
  } catch (error) {
    console.error("Email archive purge error:", error)
    return NextResponse.json({ error: "Failed to purge archives" }, { status: 500 })
  }
}

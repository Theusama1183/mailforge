import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const ALLOWED_BULK_FIELDS = ["starred", "read", "folder"] as const
type AllowedBulkField = typeof ALLOWED_BULK_FIELDS[number]

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = checkRateLimit(`get:${user.id}`, RATE_LIMITS.emails)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const { searchParams } = new URL(req.url)
    const folder = searchParams.get("folder") || "inbox"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const address = searchParams.get("address")

    let query = supabase
      .from("emails")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (folder === "starred") {
      query = query.eq("starred", true)
    } else {
      query = query.eq("folder", folder)
    }

    if (address && address !== "all") {
      query = query.eq("mailbox_address", address)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ emails: data, count, limit, offset })
  } catch (error) {
    console.error("Emails fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { ids, updates } = body as { ids: string[]; updates: Partial<Record<AllowedBulkField, unknown>> }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 })
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Maximum 100 emails per bulk operation" }, { status: 400 })
    }

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = checkRateLimit(`bulk-patch:${user.id}`, RATE_LIMITS.bulk)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const sanitizedUpdates: Partial<Record<AllowedBulkField, unknown>> = {}
    for (const key of Object.keys(updates || {})) {
      if (ALLOWED_BULK_FIELDS.includes(key as AllowedBulkField)) {
        sanitizedUpdates[key as AllowedBulkField] = updates![key as AllowedBulkField]
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid update fields" }, { status: 400 })
    }

    const { error } = await supabase
      .from("emails")
      .update(sanitizedUpdates)
      .in("id", ids)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error) {
    console.error("Bulk update error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { ids } = body as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 })
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Maximum 100 emails per bulk operation" }, { status: 400 })
    }

    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = checkRateLimit(`bulk-delete:${user.id}`, RATE_LIMITS.bulk)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const { error } = await supabase
      .from("emails")
      .update({ folder: "trash" })
      .in("id", ids)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspace_id")
    const status = searchParams.get("status")
    const jobType = searchParams.get("job_type")
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let countQuery = supabase
      .from("background_jobs")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)

    let dataQuery = supabase
      .from("background_jobs")
      .select("*")
      .eq("workspace_id", workspaceId)

    if (status) {
      countQuery = countQuery.eq("status", status)
      dataQuery = dataQuery.eq("status", status)
    }

    if (jobType) {
      countQuery = countQuery.eq("job_type", jobType)
      dataQuery = dataQuery.eq("job_type", jobType)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const { data: jobs, error } = await dataQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ jobs, total: count })
  } catch (error) {
    console.error("Background jobs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch background jobs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { workspace_id, job_type, payload, priority, scheduled_at } = body

    if (!workspace_id || !job_type) {
      return NextResponse.json(
        { error: "workspace_id and job_type are required" },
        { status: 400 },
      )
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("background_jobs")
      .insert({
        workspace_id,
        job_type,
        payload: payload ?? {},
        priority: priority ?? 0,
        scheduled_at: scheduled_at ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Background job creation error:", error)
    return NextResponse.json({ error: "Failed to create background job" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, status, progress, result, error: jobError } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 },
      )
    }

    const { data: job } = await supabase
      .from("background_jobs")
      .select("workspace_id")
      .eq("id", id)
      .single()

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", job.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (progress !== undefined) updates.progress = progress
    if (result !== undefined) updates.result = result
    if (jobError !== undefined) updates.error = jobError

    if (status === "running") {
      updates.started_at = new Date().toISOString()
    }

    if (status === "completed" || status === "failed") {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("background_jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Background job update error:", error)
    return NextResponse.json({ error: "Failed to update background job" }, { status: 500 })
  }
}

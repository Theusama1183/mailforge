import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"
import type { ABTest, ABTestVariant } from "@/types"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let query = supabase.from("ab_tests").select("*, ab_test_variants(*)").eq("user_id", user.id)
    if (workspaceId) query = query.eq("workspace_id", workspaceId)

    const { data, error } = await query.order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const mapped = (data ?? []).map(normalizeTest)
    return NextResponse.json({ data: mapped })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch A/B tests" }, { status: 500 })
  }
}

function normalizeTest(raw: Record<string, unknown>): ABTest {
  const { ab_test_variants, ...rest } = raw
  return {
    ...rest,
    variants: (ab_test_variants ?? []) as ABTestVariant[],
  } as unknown as ABTest
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const body = await req.json()
    const { workspaceId, name, variants } = body

    if (!name || !variants?.length) {
      return NextResponse.json({ error: "name and variants are required" }, { status: 400 })
    }
    if (variants.length !== 2) {
      return NextResponse.json({ error: "Exactly 2 variants (A/B) required" }, { status: 400 })
    }
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: test, error: testErr } = await supabase
      .from("ab_tests")
      .insert({ workspace_id: workspaceId, user_id: user.id, name })
      .select()
      .single()

    if (testErr) return NextResponse.json({ error: testErr.message }, { status: 500 })

    const variantRows = variants.map((v: any, i: number) => ({
      ab_test_id: test.id,
      label: i === 0 ? "A" : "B",
      subject: v.subject,
      body_html: v.body_html || null,
      body_text: v.body_text || null,
    }))

    const { data: createdVariants, error: varErr } = await supabase
      .from("ab_test_variants")
      .insert(variantRows)
      .select()

    if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 })

    const normalized = normalizeTest({ ...test, ab_test_variants: createdVariants })
    return NextResponse.json(normalized)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create A/B test" }, { status: 500 })
  }
}

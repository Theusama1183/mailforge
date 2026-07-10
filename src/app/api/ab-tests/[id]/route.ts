import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"
import type { ABTest, ABTestVariant } from "@/types"

function normalizeTest(raw: Record<string, unknown>): ABTest {
  const { ab_test_variants, ...rest } = raw
  return {
    ...rest,
    variants: (ab_test_variants ?? []) as ABTestVariant[],
  } as unknown as ABTest
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    const { id } = await params

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    if (workspaceId && !(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("ab_tests")
      .select("*, ab_test_variants(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(normalizeTest(data as unknown as Record<string, unknown>))
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch A/B test" }, { status: 500 })
  }
}

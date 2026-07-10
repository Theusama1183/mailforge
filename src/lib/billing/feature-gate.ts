import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type FeatureCheck = "custom_templates" | "ab_testing" | "imap_sync" | "priority_support"

const FEATURE_LIMITS: Record<FeatureCheck, string> = {
  custom_templates: "custom_templates",
  ab_testing: "ab_testing",
  imap_sync: "imap_sync",
  priority_support: "priority_support",
}

export async function checkFeatureAccess(workspaceId: string, feature: FeatureCheck): Promise<{ allowed: boolean; plan?: string; limit?: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_tier_id")
      .eq("workspace_id", workspaceId)
      .in("status", ["active", "trialing"])
      .single()

    if (!sub) {
      return { allowed: false, plan: "free" }
    }

    const { data: plan } = await supabase
      .from("plan_tiers")
      .select(FEATURE_LIMITS[feature])
      .eq("id", sub.plan_tier_id)
      .single()

    const planRecord = plan as Record<string, unknown> | null

    if (!planRecord || !planRecord[FEATURE_LIMITS[feature]]) {
      return { allowed: false, plan: "free" }
    }

    return { allowed: true, plan: planRecord[FEATURE_LIMITS[feature]] as string }
  } catch {
    return { allowed: false }
  }
}

export function withFeatureGate(feature: FeatureCheck) {
  return async (req: Request) => {
    const url = new URL(req.url)
    const workspaceId = url.pathname.split("/")[1]

    const { allowed } = await checkFeatureAccess(workspaceId, feature)
    if (!allowed) {
      return NextResponse.json(
        { error: "This feature requires an upgraded plan", upgradeUrl: `/${workspaceId}/settings?tab=billing` },
        { status: 403 }
      )
    }
    return null
  }
}

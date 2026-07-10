import { NextRequest, NextResponse } from "next/server"
import { getPaddleClient } from "@/lib/billing/paddle"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const { planCode, billingInterval = "monthly", workspaceId, returnUrl } = await req.json()

    if (!planCode || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields: planCode, workspaceId" }, { status: 400 })
    }

    if (planCode === "free" || planCode === "enterprise") {
      return NextResponse.json({ error: "Free and Enterprise plans cannot be purchased via checkout" }, { status: 400 })
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const paddle = getPaddleClient()
    const admin = createAdminClient()

    const { data: plan } = await admin
      .from("plan_tiers")
      .select("id, paddle_price_id_monthly, paddle_price_id_yearly, name, price_monthly, price_yearly")
      .eq("code", planCode)
      .single()

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const priceId = billingInterval === "yearly" ? plan.paddle_price_id_yearly : plan.paddle_price_id_monthly

    if (!priceId) {
      return NextResponse.json(
        { error: "Paddle price not configured. Set the price ID in plan_tiers table or PADDLE env vars." },
        { status: 500 }
      )
    }

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single()

    let paddleCustomerId: string | null = null

    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("paddle_customer_id")
      .eq("workspace_id", workspaceId)
      .not("paddle_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSub?.paddle_customer_id) {
      paddleCustomerId = existingSub.paddle_customer_id
    } else {
      const customers = paddle.customers.list({ email: user.email ? [user.email] : undefined })
      const existingCustomers = []
      for await (const c of customers) {
        existingCustomers.push(c)
      }

      if (existingCustomers.length > 0) {
        paddleCustomerId = existingCustomers[0].id
      } else {
        const newCustomer = await paddle.customers.create({
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
          customData: { userId: user.id },
        })
        paddleCustomerId = newCustomer.id
      }
    }

    const transaction = await paddle.transactions.create({
      customerId: paddleCustomerId,
      items: [{ priceId, quantity: 1 }],
      customData: {
        workspace_id: workspaceId,
        plan_code: planCode,
        billing_interval: billingInterval,
        user_id: user.id,
      },
      checkout: {
        url: returnUrl || null,
      },
    })

    return NextResponse.json({
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url || null,
      customerId: paddleCustomerId,
    })
  } catch (error) {
    console.error("Failed to create checkout:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    )
  }
}

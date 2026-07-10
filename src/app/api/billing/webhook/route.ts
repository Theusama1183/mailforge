import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPaddleClient, getWebhookSecret } from "@/lib/billing/paddle"
import { EventName } from "@paddle/paddle-node-sdk"

const SUBSCRIPTION_EVENTS = new Set([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionCanceled,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
  EventName.SubscriptionTrialing,
])

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("paddle-signature") || ""
    const secretKey = getWebhookSecret()
    const rawBody = await req.text()

    const paddle = getPaddleClient()

    let eventData
    try {
      eventData = await paddle.webhooks.unmarshal(rawBody, secretKey, signature)
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const eventType = eventData.eventType as string
    const eventPayload = eventData.data as unknown as Record<string, unknown>

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (SUBSCRIPTION_EVENTS.has(eventType as EventName)) {
      const sub = eventPayload as Record<string, unknown>
      const paddleSubId = sub.id as string
      const customData = (sub.customData || {}) as Record<string, unknown>
      const items = sub.items as Array<Record<string, unknown>> | undefined
      const firstItem = items?.[0]
      const firstPriceCustomData = firstItem?.price ? (firstItem.price as Record<string, unknown>).customData as Record<string, unknown> : undefined
      const workspaceId = (customData.workspace_id || firstPriceCustomData?.workspace_id) as string | undefined

      const status = sub.status as string
      const billingPeriod = sub.currentBillingPeriod as Record<string, string> | undefined
      const currentPeriodStart = billingPeriod?.startsAt as string | undefined
      const currentPeriodEnd = billingPeriod?.endsAt as string | undefined
      const canceledAt = sub.canceledAt as string | null | undefined

      let planTierId: string | null = null
      if (items?.[0]) {
        const price = items[0].price as Record<string, unknown> | undefined
        if (price) {
          const priceId = price.id as string
          const { data: planMatch } = await supabase
            .from("plan_tiers")
            .select("id")
            .or(`paddle_price_id_monthly.eq.${priceId},paddle_price_id_yearly.eq.${priceId}`)
            .maybeSingle()
          if (planMatch) {
            planTierId = planMatch.id
          }
        }
      }

      const billingCycle = sub.billingCycle as Record<string, string> | undefined
      const billingInterval = billingCycle?.interval === "year" ? "yearly" : "monthly"
      const mappedStatus = statusMap(status)
      const customerId = (sub.customerId as string | undefined) || undefined

      if (workspaceId && planTierId) {
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("paddle_subscription_id", paddleSubId)
          .maybeSingle()

        if (existingSub) {
          await supabase
            .from("subscriptions")
            .update({
              status: mappedStatus,
              current_period_start: currentPeriodStart ? new Date(currentPeriodStart).toISOString() : undefined,
              current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : undefined,
              canceled_at: canceledAt ? new Date(canceledAt).toISOString() : undefined,
              updated_at: new Date().toISOString(),
              paddle_customer_id: customerId || undefined,
            })
            .eq("id", existingSub.id)
        } else {
          await supabase.from("subscriptions").insert({
            workspace_id: workspaceId,
            plan_tier_id: planTierId,
            paddle_subscription_id: paddleSubId,
            paddle_customer_id: customerId || null,
            status: mappedStatus,
            billing_interval: billingInterval,
            current_period_start: currentPeriodStart ? new Date(currentPeriodStart).toISOString() : new Date().toISOString(),
            current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      }
    }

    if (eventType === EventName.TransactionCompleted) {
      const transaction = eventPayload as Record<string, unknown>
      const customData = (transaction.customData || {}) as Record<string, unknown>
      const workspaceId = customData.workspace_id as string | undefined
      const planCode = customData.plan_code as string | undefined
      const billingInterval = customData.billing_interval as string | undefined
      const paddleSubId = transaction.subscriptionId as string | undefined
      const paddleCustomerId = transaction.customerId as string | undefined
      const invoiceNumber = transaction.invoiceNumber as string | undefined
      const currencyCode = transaction.currencyCode as string | "USD"
      const details = transaction.details as Record<string, unknown> | undefined
      const totals = details?.totals as Record<string, unknown> | undefined
      const amount = totals?.total as string | undefined

      if (workspaceId && paddleSubId) {
        if (planCode) {
          const { data: plan } = await supabase
            .from("plan_tiers")
            .select("id")
            .eq("code", planCode)
            .maybeSingle()

          if (plan) {
            const { data: existingSub } = await supabase
              .from("subscriptions")
              .select("id")
              .eq("paddle_subscription_id", paddleSubId)
              .maybeSingle()

            if (!existingSub) {
              await supabase.from("subscriptions").insert({
                workspace_id: workspaceId,
                plan_tier_id: plan.id,
                paddle_subscription_id: paddleSubId,
                paddle_customer_id: paddleCustomerId || null,
                paddle_transaction_id: transaction.id as string,
                status: "active",
                billing_interval: billingInterval || "monthly",
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
            } else {
              await supabase
                .from("subscriptions")
                .update({
                  status: "active",
                  paddle_customer_id: paddleCustomerId || undefined,
                  paddle_transaction_id: transaction.id as string,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingSub.id)
            }
          }
        }

        await supabase.from("invoices").insert({
          workspace_id: workspaceId,
          paddle_transaction_id: transaction.id as string,
          paddle_invoice_id: invoiceNumber || null,
          amount: amount ? Math.round(parseFloat(amount)) : 0,
          currency: currencyCode?.toLowerCase() || "usd",
          status: "paid",
          billing_reason: "subscription_create",
          paid_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing failed:", error)
    return NextResponse.json({ received: true })
  }
}

function statusMap(paddleStatus: string): string {
  const map: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    paused: "past_due",
    canceled: "canceled",
    expired: "expired",
  }
  return map[paddleStatus] || "active"
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authenticateApiKey, checkPermission } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if (auth instanceof NextResponse) return auth

    if (!checkPermission("email:send", auth.permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { to, subject, bodyHtml, bodyText, fromAddress } = await req.json()

    if (!to || !subject || !fromAddress) {
      return NextResponse.json({ error: "Missing required fields: to, subject, fromAddress" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Queue the email
    const { data, error } = await supabase.from("email_queue").insert({
      workspace_id: auth.workspaceId,
      email_data: { to, subject, bodyHtml, bodyText, fromAddress },
      status: "pending",
    }).select().single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      messageId: data.id,
      status: "queued",
    })
  } catch (err) {
    console.error("API v1 send error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

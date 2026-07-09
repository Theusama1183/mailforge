import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await checkRateLimit(`thread:${user.id}`, RATE_LIMITS.emails)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("message_id, in_reply_to, references")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (emailError || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    const references = email.references || []
    const anchor = references.length > 0
      ? references[0]
      : email.in_reply_to || email.message_id

    if (!anchor) {
      return NextResponse.json({ thread: [id], emails: [] })
    }

    const { data: threadEmails, error: threadError } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .or(`references.cs.{${anchor}},in_reply_to.eq.${anchor},message_id.eq.${anchor}`)
      .order("created_at", { ascending: true })

    if (threadError) throw threadError

    return NextResponse.json({
      thread: threadEmails?.map((e) => e.id) || [],
      emails: threadEmails || [],
    })
  } catch (error) {
    console.error("Thread fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 })
  }
}

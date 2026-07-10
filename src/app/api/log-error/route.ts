import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, name, stack, context, url } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "CLIENT_ERROR",
        userId: user?.id || "anonymous",
        url: url || "unknown",
        name: name || "Error",
        message,
        stack,
        context: context || {},
      })
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error in log-error endpoint:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

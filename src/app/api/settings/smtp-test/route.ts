import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.host || !body.port || !body.username) {
      return NextResponse.json({ error: "Host, port, and username are required" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: body.host,
      port: parseInt(body.port),
      secure: body.secure ?? body.port === 465,
      auth: { user: body.username, pass: body.password || "" },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    })

    try {
      await transporter.verify()
      return NextResponse.json({ success: true, message: "SMTP connection verified successfully" })
    } catch (err) {
      return NextResponse.json(
        { success: false, message: err instanceof Error ? err.message : "SMTP connection failed" },
        { status: 200 }
      )
    }
  } catch {
    return NextResponse.json({ success: false, message: "Failed to test SMTP" }, { status: 200 })
  }
}

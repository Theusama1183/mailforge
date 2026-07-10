import { NextResponse } from "next/server"
import { checkSpam } from "@/lib/spam-check"

export async function POST(req: Request) {
  try {
    const { html, text, subject } = await req.json()
    const result = checkSpam(html || "", text || "", subject || "")
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to check spam score" }, { status: 500 })
  }
}

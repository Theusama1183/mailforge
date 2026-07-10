import { NextResponse } from "next/server"
import { validateAllLinks } from "@/lib/email-validation"

export async function POST(req: Request) {
  try {
    const { html } = await req.json()
    if (typeof html !== "string") {
      return NextResponse.json({ error: "html is required" }, { status: 400 })
    }

    const result = validateAllLinks(html)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to validate links" }, { status: 500 })
  }
}

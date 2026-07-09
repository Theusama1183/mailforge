import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

function escapeVcard(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function foldLine(line: string): string {
  const maxLen = 75
  if (line.length <= maxLen) return line
  let result = line.slice(0, maxLen)
  for (let i = maxLen; i < line.length; i += maxLen - 1) {
    result += "\r\n " + line.slice(i, i + maxLen - 1)
  }
  return result
}

function buildVcard(contact: { name: string | null; email: string; phone: string | null; company: string | null; notes: string | null }): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"]
  if (contact.name) {
    const parts = contact.name.split(/\s+/)
    const given = parts[0] || ""
    const family = parts.slice(1).join(" ") || ""
    lines.push(`N:${escapeVcard(family)};${escapeVcard(given)};;;`)
    lines.push(`FN:${escapeVcard(contact.name)}`)
  } else {
    lines.push(`FN:${escapeVcard(contact.email)}`)
  }
  lines.push(`EMAIL:${contact.email}`)
  if (contact.phone) lines.push(`TEL:${escapeVcard(contact.phone)}`)
  if (contact.company) lines.push(`ORG:${escapeVcard(contact.company)}`)
  if (contact.notes) lines.push(`NOTE:${escapeVcard(contact.notes)}`)
  lines.push("END:VCARD")
  return lines.map(foldLine).join("\r\n") + "\r\n"
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("name, email, phone, company, notes")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const vcard = buildVcard(contact)
    const filename = `${(contact.name || contact.email).replace(/[^a-zA-Z0-9]/g, "_")}.vcf`

    return new NextResponse(vcard, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export vCard" }, { status: 500 })
  }
}

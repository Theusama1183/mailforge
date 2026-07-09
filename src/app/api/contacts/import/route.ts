import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { verifyWorkspaceOrOwnership } from "@/lib/workspace-utils"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const workspaceId = formData.get("workspaceId") as string | null
    if (!file) return NextResponse.json({ error: "CSV file required" }, { status: 400 })
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })

    if (!(await verifyWorkspaceOrOwnership(supabase, user.id, workspaceId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const text = await file.text()
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return NextResponse.json({ error: "CSV must have a header row and at least one contact" }, { status: 400 })

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
    const emailIdx = headers.indexOf("email")
    const nameIdx = headers.indexOf("name")
    const companyIdx = headers.indexOf("company")
    const phoneIdx = headers.indexOf("phone")
    const notesIdx = headers.indexOf("notes")

    if (emailIdx === -1) return NextResponse.json({ error: "CSV must have an 'email' column" }, { status: 400 })

    function parseCsvLine(line: string): string[] {
      const cols: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (ch === "," && !inQuotes) {
          cols.push(current.trim())
          current = ""
        } else {
          current += ch
        }
      }
      cols.push(current.trim())
      return cols
    }

    const contacts = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      const email = cols[emailIdx]?.toLowerCase()
      if (!email || !email.includes("@")) {
        errors.push(`Row ${i + 1}: invalid email "${email || ""}"`)
        continue
      }
      contacts.push({
        user_id: user.id,
        workspace_id: workspaceId,
        email,
        name: nameIdx >= 0 ? cols[nameIdx] || null : null,
        company: companyIdx >= 0 ? cols[companyIdx] || null : null,
        phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
        notes: notesIdx >= 0 ? cols[notesIdx] || null : null,
      })
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid contacts found in CSV", imported: 0, errors }, { status: 400 })
    }

    const { error } = await supabase.from("contacts").upsert(contacts, { onConflict: "user_id,workspace_id,email", ignoreDuplicates: false })

    if (error) return NextResponse.json({ error: error.message, imported: 0, errors }, { status: 500 })
    return NextResponse.json({ imported: contacts.length, errors: errors.length ? errors : undefined })
  } catch (error) {
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 })
  }
}

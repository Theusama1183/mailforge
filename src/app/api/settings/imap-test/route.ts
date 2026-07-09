import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

async function testImapConnection(host: string, port: number, username: string, password: string, useTls: boolean): Promise<{ success: boolean; message: string; folders?: string[] }> {
  return new Promise(async (resolve) => {
    const { ImapFlow } = await import("imapflow")
    const client = new ImapFlow({
      host,
      port,
      secure: useTls,
      auth: { user: username, pass: password },
      logger: false,
      connectionTimeout: 10000,
    })

    client.connect()
      .then(async () => {
        const list = await client.list()
        const folders = list.map((l: any) => l.path)
        await client.logout()
        resolve({ success: true, message: "IMAP connection verified", folders })
      })
      .catch((err: Error) => {
        resolve({ success: false, message: err.message })
      })
  })
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.host || !body.username) {
      return NextResponse.json({ error: "Host, username are required" }, { status: 400 })
    }

    const result = await testImapConnection(
      body.host,
      parseInt(body.port || "993"),
      body.username,
      body.password || "",
      body.useTls ?? true
    )

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to test IMAP" }, { status: 500 })
  }
}

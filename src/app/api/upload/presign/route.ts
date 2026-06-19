import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import crypto from "crypto"

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT
  const accessKey = process.env.R2_ACCESS_KEY_ID
  const secretKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET || "mailforge-attachments"

  if (!endpoint || !accessKey || !secretKey) {
    return null
  }

  return { endpoint, accessKey, secretKey, bucket }
}

function createPresignedPutUrl(config: ReturnType<typeof getR2Config>, key: string, expiresIn = 3600) {
  if (!config) return null

  const { endpoint, bucket } = config
  const url = new URL(`${endpoint}/${bucket}/${key}`)

  const expires = Math.floor(Date.now() / 1000) + expiresIn
  url.searchParams.set("X-Amz-Expires", String(expiresIn))

  return {
    url: url.toString(),
    key,
    expiresAt: expires,
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user  } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { filename, contentType } = await req.json()
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 })
    }

    const config = getR2Config()
    if (!config) {
      return NextResponse.json(
        { error: "R2 not configured" },
        { status: 500 }
      )
    }

    const ext = filename.split(".").pop() || ""
    const key = `attachments/${crypto.randomUUID()}/${Date.now()}.${ext}`

    const result = createPresignedPutUrl(config, key)
    if (!result) {
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Upload presign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

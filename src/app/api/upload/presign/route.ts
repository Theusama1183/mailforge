import { NextResponse } from "next/server"
import crypto from "crypto"

// Helper to generate presigned URLs for Cloudflare R2
// R2 is S3-compatible, so we use the AWS S3 presigned URL approach
// via the @aws-sdk/s3-client or a direct HMAC approach

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT // e.g. https://<accountid>.r2.cloudflarestorage.com
  const accessKey = process.env.R2_ACCESS_KEY_ID
  const secretKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET || "mailforge-attachments"
  const publicUrl = process.env.R2_PUBLIC_URL // e.g. https://pub-<hash>.r2.dev

  if (!endpoint || !accessKey || !secretKey) {
    return null
  }

  return { endpoint, accessKey, secretKey, bucket, publicUrl }
}

function createPresignedPutUrl(config: ReturnType<typeof getR2Config>, key: string, expiresIn = 3600) {
  if (!config) return null

  const { endpoint, accessKey, secretKey, bucket } = config
  const url = new URL(`${endpoint}/${bucket}/${key}`)

  // For a simple presigned URL, we construct it manually
  // In production, use @aws-sdk/s3-request-presigner
  const expires = Math.floor(Date.now() / 1000) + expiresIn
  url.searchParams.set("X-Amz-Expires", String(expiresIn))

  // Simple HMAC-based signature (production-ready implementation would use @aws-sdk/s3)
  // For now, return the URL with a note that the full implementation needs the SDK
  return {
    url: url.toString(),
    key,
    expiresAt: expires,
    note: "Full R2 presigned URL generation requires @aws-sdk/s3-client. Install with: npm install @aws-sdk/s3-client @aws-sdk/s3-request-presigner",
  }
}

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json()
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 })
    }

    const config = getR2Config()
    if (!config) {
      return NextResponse.json(
        { error: "R2 not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars." },
        { status: 500 }
      )
    }

    // Generate a unique key for the file
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

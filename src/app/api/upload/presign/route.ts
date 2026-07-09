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

function hmacSha256(key: Buffer | string, message: string): Buffer {
  return crypto.createHmac("sha256", key).update(message).digest()
}

function sha256(message: string): string {
  return crypto.createHash("sha256").update(message).digest("hex")
}

function getSignatureKey(key: string, dateStamp: string, region: string): Buffer {
  const kDate = hmacSha256(`AWS4${key}`, dateStamp)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, "s3")
  return hmacSha256(kService, "aws4_request")
}

function createPresignedPutUrl(
  config: ReturnType<typeof getR2Config>,
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  if (!config) return null

  const { endpoint, accessKey, secretKey, bucket } = config
  const region = "auto"
  const service = "s3"
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "")
  const dateTime = now.toISOString().slice(0, 19).replace(/[:-]/g, "") + "Z"

  const url = new URL(`${endpoint}/${bucket}/${key}`)
  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${dateStamp}/${region}/${service}/aws4_request`,
    "X-Amz-Date": dateTime,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  }

  if (contentType) {
    params["x-amz-content-sha256"] = "UNSIGNED-PAYLOAD"
  }

  const sortedKeys = Object.keys(params).sort()
  const canonicalQuery = sortedKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&")

  const signedHeaders = "host"
  const payloadHash = "UNSIGNED-PAYLOAD"
  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    canonicalQuery,
    `host:${new URL(endpoint).host}`,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n")

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateTime,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n")

  const signingKey = getSignatureKey(secretKey, dateStamp, region)
  const signature = hmacSha256(signingKey, stringToSign).toString("hex")

  params["X-Amz-Signature"] = signature

  const finalKeys = Object.keys(params).sort()
  const finalQuery = finalKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&")
  const finalUrl = `${endpoint}/${bucket}/${key}?${finalQuery}`

  return {
    url: finalUrl,
    key,
    expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user } = auth
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

    const result = createPresignedPutUrl(config, key, contentType || "")
    if (!result) {
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Upload presign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

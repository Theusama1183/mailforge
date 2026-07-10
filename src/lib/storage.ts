import { createClient } from "@/lib/supabase/server"

export type StorageBucket = "attachments" | "avatars" | "logos" | "exports"

export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File | Blob,
  userId: string,
): Promise<{ url: string; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  })

  if (error) {
    return { url: "", error: error.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return { url: publicUrl }
}

export async function deleteFile(
  bucket: StorageBucket,
  path: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    return { error: error.message }
  }

  return {}
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${url}/storage/v1/object/public/${bucket}/${path}`
}

export function getCdnUrl(bucket: StorageBucket, path: string): string {
  return getPublicUrl(bucket, path)
}

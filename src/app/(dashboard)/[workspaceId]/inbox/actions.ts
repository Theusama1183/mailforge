"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Toggle the starred state of an email.
 */
export async function toggleStarEmail(emailId: string, starred: boolean, workspaceId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("emails")
    .update({ starred })
    .eq("id", emailId)
    .eq("user_id", user.id)

  if (error) throw error
  if (workspaceId) revalidatePath(`/${workspaceId}/inbox`)
}

/**
 * Mark an email as read.
 */
export async function markEmailRead(emailId: string, workspaceId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("emails")
    .update({ read: true })
    .eq("id", emailId)
    .eq("user_id", user.id)

  if (error) throw error
  if (workspaceId) revalidatePath(`/${workspaceId}/inbox`)
}

/**
 * Archive an email (move to archive folder).
 */
export async function archiveEmail(emailId: string, workspaceId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("emails")
    .update({ folder: "archive" })
    .eq("id", emailId)
    .eq("user_id", user.id)

  if (error) throw error
  if (workspaceId) revalidatePath(`/${workspaceId}/inbox`)
}

/**
 * Move an email to trash.
 */
export async function trashEmail(emailId: string, workspaceId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("emails")
    .update({ folder: "trash" })
    .eq("id", emailId)
    .eq("user_id", user.id)

  if (error) throw error
  if (workspaceId) revalidatePath(`/${workspaceId}/inbox`)
}

import type { SupabaseClient } from "@supabase/supabase-js"

export async function verifyWorkspaceMembership(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null | undefined,
): Promise<boolean> {
  if (!workspaceId) return false

  const { data } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()

  return !!data
}

export async function verifyWorkspaceOrOwnership(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null | undefined,
): Promise<boolean> {
  if (!workspaceId) return true
  return verifyWorkspaceMembership(supabase, userId, workspaceId)
}

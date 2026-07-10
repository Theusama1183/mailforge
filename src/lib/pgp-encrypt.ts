import * as openpgp from "openpgp"
import type { SupabaseClient } from "@supabase/supabase-js"

async function isKeyUsable(key: openpgp.Key): Promise<boolean> {
  try {
    const expiration = await key.getExpirationTime()
    if (expiration && expiration < new Date()) return false
    const algo = key.getAlgorithmInfo()
    if (String(algo.algorithm) === "rsa" && (algo.bits && algo.bits < 2048)) return false
    return true
  } catch {
    return false
  }
}

export async function encryptForRecipients(
  html: string,
  to: string[],
  supabase: SupabaseClient
): Promise<{ encrypted: boolean; body: string }> {
  const { data: keys } = await supabase
    .from("pgp_keys")
    .select("public_key, email_address")
    .in("email_address", to.map(e => e.toLowerCase()))
    .is("revoked_at", null)

  if (!keys || keys.length === 0) return { encrypted: false, body: html }

  const validKeys: openpgp.Key[] = []
  for (const k of keys) {
    try {
      const key = await openpgp.readKey({ armoredKey: k.public_key })
      if (await isKeyUsable(key)) validKeys.push(key)
    } catch {
      // skip unreadable keys
    }
  }

  if (validKeys.length === 0) return { encrypted: false, body: html }

  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: html }),
    encryptionKeys: validKeys,
    format: "armored",
  })

  return {
    encrypted: true,
    body: `-----BEGIN PGP MESSAGE-----\n\n${encrypted}\n-----END PGP MESSAGE-----`,
  }
}

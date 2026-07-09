import { createAdminClient } from "@/lib/supabase/admin"
import * as openpgp from "openpgp"

export async function encryptForRecipients(html: string, to: string[]): Promise<{ encrypted: boolean; body: string }> {
  try {
    const admin = createAdminClient()
    const { data: keys } = await admin
      .from("pgp_keys")
      .select("public_key, email_address")
      .in("email_address", to.map(e => e.toLowerCase()))
      .is("revoked_at", null)

    if (!keys || keys.length === 0) return { encrypted: false, body: html }

    const publicKeys = await Promise.all(
      keys.map(k => openpgp.readKey({ armoredKey: k.public_key }).catch(() => null))
    )
    const validKeys = publicKeys.filter(Boolean) as openpgp.Key[]

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
  } catch {
    return { encrypted: false, body: html }
  }
}

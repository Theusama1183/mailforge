import dns from "dns/promises"

export async function resolveTxtRecord(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(domain)
    return records.map(r => r.join(""))
  } catch {
    return []
  }
}

export async function resolveMxRecord(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(domain)
    return records.map(r => `${r.priority} ${r.exchange}`)
  } catch {
    return []
  }
}

export async function lookupTxtRecord(domain: string, type: "MX" | "TXT") {
  try {
    if (type === "MX") {
      const records = await resolveMxRecord(domain)
      return records.length > 0 ? { text: records.join("\n") } : null
    }
    const records = await resolveTxtRecord(domain)
    return records.length > 0 ? { text: records.join("\n") } : null
  } catch {
    return null
  }
}

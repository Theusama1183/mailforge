interface CloudflareDNSRecord {
  type: "MX" | "TXT" | "CNAME"
  name: string
  content: string
  priority?: number
  ttl?: number
}

export async function getCloudflareZone(token: string, domain: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  const data = await res.json()
  return data.success ? data.result[0] : null
}

export async function addDNSRecord(
  token: string,
  zoneId: string,
  record: CloudflareDNSRecord
) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    }
  )
  return res.json()
}

export async function getDNSRecords(token: string, zoneId: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  return res.json()
}

export async function enableEmailRouting(token: string, zoneId: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/enable`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )
  return res.json()
}

export async function setupEmailDNS(token: string, zoneId: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/dns`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )
  return res.json()
}

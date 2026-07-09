let geoip: any = null

async function getGeoIP() {
  if (!geoip) {
    geoip = await import("geoip-lite").then(m => m.default || m)
  }
  return geoip
}

export async function lookupCountry(ip: string | null): Promise<string | null> {
  if (!ip) return null
  const cleanIp = ip.split(",")[0]?.trim()
  if (!cleanIp || cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp.startsWith("10.") || cleanIp.startsWith("192.168.") || cleanIp.startsWith("172.")) return null
  try {
    const g = await getGeoIP()
    const geo = g.lookup(cleanIp)
    return geo?.country || null
  } catch {
    return null
  }
}

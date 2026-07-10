"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Smartphone, Shield, Loader2 } from "lucide-react"

export default function MfaChallengePage() {
  const router = useRouter()
  const supabase = createClient()
  const [factors, setFactors] = useState<any[]>([])
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error: err }) => {
      if (err || !data) { router.push("/login"); return }
      const verified = data.all.filter((f: any) => f.status === "verified")
      if (verified.length === 0) { router.push("/login"); return }
      setFactors(verified)
      setFactorId(verified[0].id)
      setLoading(false)
    })
  }, [router, supabase])

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return
    setVerifying(true)
    setError(null)
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) { setError(challengeError.message); setVerifying(false); return }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    })
    if (verifyError) { setError(verifyError.message); setVerifying(false); return }

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: crypto.randomUUID(),
        deviceType: /mobile|tablet/i.test(navigator.userAgent) ? "mobile" : "desktop",
      }),
    }).catch(() => {})

    router.push("/workspaces")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-black/20 p-8 flex flex-col items-center border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg shadow-blue-500/20">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-semibold mb-1 text-gray-900 dark:text-gray-100">Two-factor auth</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 text-center">
          Enter the code from your authenticator app
        </p>

        {error && (
          <div className="w-full px-3 py-2 mb-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Smartphone className="h-4 w-4" />
            {factors[0]?.friendly_name || "Authenticator App"}
          </div>

          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoFocus
            className="w-48 px-4 py-3 text-center text-2xl tracking-[0.5em] rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50/50 dark:bg-gray-800/50 font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />

          <button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            className="w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white font-medium py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/10"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>

          <button
            onClick={() => { supabase.auth.signOut(); router.push("/login") }}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}

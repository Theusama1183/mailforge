"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, ShieldCheck, RefreshCw, Clock, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

function OTPContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const router = useRouter()
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(300)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) router.push("/login")
  }, [email, router])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value.replace(/[^0-9]/g, "")
    setOtp(newOtp)
    setError(null)

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus()
    }

    if (newOtp.every((d) => d) && index === 3) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (pasted.length === 4) {
      const newOtp = pasted.split("")
      setOtp(newOtp)
      if (newOtp.every((d) => d)) {
        handleVerify(pasted)
      }
    }
  }

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join("")
    if (!otpCode || otpCode.length !== 4) {
      setError("Please enter the full 4-digit code")
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Verification failed")

      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle()
        if (!prefs?.onboarding_complete) {
          router.push("/onboarding")
        } else {
          router.push("/workspaces")
        }
      } else {
        router.push("/login")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResendCooldown(30)
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setOtp(["", "", "", ""])
      setTimeLeft(300)
      inputsRef.current[0]?.focus()
    } catch {
      setError("Failed to resend code")
    }
  }

  const maskedEmail = email.replace(/(.{3})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length))
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/5 p-8 flex flex-col items-center border border-blue-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg shadow-blue-500/20">
          <Mail className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-2xl font-semibold mb-1 text-gray-900">Verification Code</h2>
        <p className="text-gray-500 text-sm mb-8 text-center">
          Enter the 4-digit code sent to<br />
          <span className="font-medium text-gray-700">{maskedEmail}</span>
        </p>

        {error && (
          <div className="w-full px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e.key)}
              className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none ${
                digit
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-gray-50/50 text-gray-900"
              }`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          <Clock className={`w-4 h-4 ${timeLeft === 0 ? "text-red-500" : "text-gray-400"}`} />
          <span className={`text-sm ${timeLeft === 0 ? "text-red-500 font-medium" : "text-gray-500"}`}>
            {timeLeft === 0 ? "Code expired" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
          </span>
        </div>

        <button
          onClick={() => handleVerify()}
          disabled={loading || otp.some((d) => !d)}
          className="w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white font-medium py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/10 mb-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </button>

        <button
          onClick={() => router.push("/login")}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </button>
      </div>
    </div>
  )
}

export default function OTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OTPContent />
    </Suspense>
  )
}

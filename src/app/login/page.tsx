"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogIn, Mail, Lock, Eye, EyeOff, ExternalLink } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === "register") {
        if (!agreedToTerms) { setError("Please accept the Terms of Service and Privacy Policy"); setLoading(false); return }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Send OTP for email verification
        const otpRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        if (otpRes.ok) {
          router.push(`/otp?email=${encodeURIComponent(email)}`)
        } else {
          router.push("/onboarding")
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        // Check if email is confirmed
        const user = data.user
        if (user && !user.email_confirmed_at) {
          // Send OTP and redirect to verification
          await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
          router.push(`/otp?email=${encodeURIComponent(email)}`)
          setLoading(false)
          return
        }

        // Check if user has completed onboarding
        const userId = data.user?.id
        if (userId) {
          const { data: prefs, error: prefsError } = await supabase
            .from("user_preferences")
            .select("onboarding_complete")
            .eq("user_id", userId)
            .maybeSingle()
          // If table doesn't exist yet (prefsError) or onboarding not done, redirect to onboarding
          if (prefsError || !prefs?.onboarding_complete) {
            router.push("/onboarding")
          } else {
            router.push("/workspaces")
          }
        } else {
          router.push("/workspaces")
        }
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/5 p-8 flex flex-col items-center border border-blue-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg shadow-blue-500/20">
          <LogIn className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-semibold mb-1 text-gray-900">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-gray-500 text-sm mb-8 text-center">
          {mode === "login"
            ? "Sign in to your MailForge account"
            : "Start managing your emails"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
              {error}
            </div>
          )}

          {mode === "register" && (
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
              />
              <span className="text-xs text-gray-500 group-hover:text-gray-700 leading-relaxed">
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5">
                  Terms of Service <ExternalLink className="h-2.5 w-2.5" />
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5">
                  Privacy Policy <ExternalLink className="h-2.5 w-2.5" />
                </a>.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "register" && !agreedToTerms)}
            className="w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white font-medium py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/10 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating..."}
              </span>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}

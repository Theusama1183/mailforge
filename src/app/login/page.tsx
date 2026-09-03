"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogIn, Mail, Lock, Eye, EyeOff, ExternalLink } from "lucide-react"

function recordSession() {
  fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: crypto.randomUUID(),
      deviceType: /mobile|tablet/i.test(navigator.userAgent) ? "mobile" : "desktop",
    }),
  }).catch(() => {})
}

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
        // Use our own signup API (bypasses Supabase's built-in confirmation email)
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (!signupRes.ok) {
          const err = await signupRes.json()
          throw new Error(err.error || "Failed to create account")
        }
        // Sign in to create a session (user was created with email_confirm:true)
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        await supabase.auth.getSession()
        // Send OTP for email verification
        const otpRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        if (otpRes.ok) {
          router.push(`/otp?email=${encodeURIComponent(email)}`)
        } else {
          // OTP send failed (likely SMTP not configured) — let user in without verification
          router.push("/onboarding")
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        try { recordSession() } catch {}

        // Ensure the SSR auth cookies are flushed before navigating.
        // Without this, the middleware may see a null session right after
        // signInWithPassword and redirect back to /login.
        await supabase.auth.getSession()

        // Check if MFA is required
        const { data: factors } = await supabase.auth.mfa.listFactors().catch(() => ({ data: null }))
        if (factors?.all?.some((f: any) => f.status === "verified")) {
          router.push("/mfa-challenge")
          setLoading(false)
          return
        }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-black/20 p-8 flex flex-col items-center border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg shadow-blue-500/20">
          <LogIn className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 text-center">
          {mode === "login"
            ? "Sign in to your MailForge account"
            : "Start managing your emails"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50/50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50/50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === "login" && (
            <div className="text-right -mt-1">
              <a href="/forgot-password" className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                Forgot password?
              </a>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {mode === "register" && (
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 leading-relaxed">
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-0.5">
                  Terms of Service <ExternalLink className="h-2.5 w-2.5" />
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-0.5">
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

        <div className="relative my-5 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white/80 dark:bg-gray-900/80 px-2 text-gray-400 dark:text-gray-500">or continue with</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })
              if (error) setError(error.message)
            }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback` } })
              if (error) setError(error.message)
            }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#1B1F23" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
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

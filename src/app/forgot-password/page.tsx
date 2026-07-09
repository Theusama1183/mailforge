"use client"

import { useState } from "react"
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed")
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                If an account exists for {email}, you&apos;ll receive a password reset link shortly.
              </p>
              <Link href="/login" className="text-sm text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">Forgot password?</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Enter your email and we&apos;ll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white font-medium py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/10"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn, Loader2, CheckCircle, XCircle, Clock, ArrowRight, Mail, Users, Shield } from "lucide-react"
import { toast } from "sonner"

interface InviteData {
  id: string
  workspace_id: string
  workspace_name: string
  invited_by_email: string
  email: string
  message?: string
  created_at: string
}

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const token = params?.token
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        // Check auth state
        const { data: { user: u } } = await supabase.auth.getUser()
        setUser(u)

        // Fetch invitation
        const res = await fetch(`/api/invitations/${token}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Invitation not found")
        }
        const data = await res.json()
        setInvite(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invitation")
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token, supabase.auth])

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to accept")

      toast.success(`Welcome to ${data.workspace_name}!`)
      // Set active workspace
      localStorage.setItem("mailforge_active_workspace", data.workspace_id)
      document.cookie = `mailforge_active_workspace=${data.workspace_id}; path=/; max-age=31536000; SameSite=Lax`
      router.push(`/${data.workspace_id}/inbox`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite")
    } finally {
      setAccepting(false)
    }
  }

  async function handleSignup() {
    if (!email || !password) { toast.error("Fill in all fields"); return }
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast.success("Account created! You can now accept the invitation.")
      // Reload to get updated user
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin() {
    if (!email || !password) { toast.error("Fill in all fields"); return }
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // Reload to get updated user
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed")
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Invitation Invalid</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  if (!invite) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Invitation Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/5 p-8 border border-blue-100 dark:border-gray-800">
          {/* Logo */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg shadow-blue-500/20 mx-auto">
            <LogIn className="w-7 h-7 text-white" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              You're Invited
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Join <span className="font-semibold text-blue-600 dark:text-blue-400">{invite.workspace_name}</span> on MailForge
            </p>
          </div>

          {/* Invite Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{invite.workspace_name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Invited by <strong>{invite.invited_by_email}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Sent {new Date(invite.created_at).toLocaleDateString()}
              </span>
            </div>
            {invite.message && (
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{invite.message}"
                </p>
              </div>
            )}
          </div>

          {/* Action Area */}
          {user ? (
            <>
              {user.email?.toLowerCase() === invite.email.toLowerCase() ? (
                <Button onClick={handleAccept} disabled={accepting} className="w-full gap-2 h-12 text-base">
                  {accepting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {accepting ? "Accepting..." : "Accept Invitation"}
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                    You're logged in as <strong>{user.email}</strong>, but this invitation was sent to <strong>{invite.email}</strong>.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
                      Go to Dashboard
                    </Button>
                    <Button onClick={async () => {
                      await supabase.auth.signOut()
                      setUser(null)
                    }} className="flex-1">
                      Switch Account
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              {!showLogin ? (
                <div className="space-y-3">
                  <Button onClick={handleAccept} className="w-full gap-2 h-12 text-base" disabled>
                    <CheckCircle className="h-5 w-5" />
                    Accept Invitation
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    You need an account to accept.{" "}
                    <button onClick={() => setShowLogin(true)} className="text-blue-500 hover:underline">
                      Sign up or log in
                    </button>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder={invite.email} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleLogin} disabled={authLoading} variant="outline" className="flex-1">
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Log In
                    </Button>
                    <Button onClick={handleSignup} disabled={authLoading} className="flex-1">
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Sign Up & Accept
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    After signing up, you'll be able to accept the invitation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

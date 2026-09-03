"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn, Zap, Route, CreditCard, Users, User, ArrowRight, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

export default function OnboardingPage() {
  const [mode, setMode] = useState<"individual" | "organization" | null>(null)
  const [workspaceName, setWorkspaceName] = useState("")
  const [step, setStep] = useState<"welcome" | "workspace">("welcome")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if onboarding is already complete
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      // Check preferences
      supabase
        .from("user_preferences")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.onboarding_complete) {
            router.push("/inbox")
          }
        })
    })
  }, [router, supabase])

  async function handleComplete() {
    if (!workspaceName.trim()) {
      toast.error("Please enter a workspace name")
      return
    }
    if (!mode) {
      toast.error("Please select how you'll be using MailForge")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create workspace
      const wsRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      })
      if (!wsRes.ok) {
        const err = await wsRes.json()
        // Detect table-not-found errors and give a clear message
        if (err.error?.includes("Could not find the table")) {
          throw new Error(
            "Database setup incomplete. Please run the migration script:\n\n" +
            "  SUPABASE_DB_PASSWORD='your-db-password' node scripts/apply-migration.js\n\n" +
            "See the project README or Supabase Dashboard SQL editor for details."
          )
        }
        throw new Error(err.error || "Failed to create workspace")
      }
      const workspace = await wsRes.json()

      // Update preferences
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        default_workspace_id: workspace.id,
        onboarding_complete: true,
        accepted_terms_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Set active workspace in context
      localStorage.setItem("mailforge_active_workspace", workspace.id)
      document.cookie = `mailforge_active_workspace=${workspace.id}; path=/; max-age=31536000; SameSite=Lax`

      toast.success("Welcome to MailForge!")
      router.push(`/${workspace.id}/inbox`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
            <LogIn className="w-6 h-6 text-white" />
          </div>
        </div>

        {step === "welcome" && (
          <>
            {/* Headline */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                Welcome to MailForge
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                The unified email platform for your domain. Manage everything from one place.
              </p>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Unified access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Create and manage unlimited email addresses on your domain through one powerful dashboard.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-3">
                  <Route className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Smart routing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Automatic email routing through Cloudflare so your mail always reaches the right inbox.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Free to use</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  No subscriptions. Use it as much as you want.
                </p>
              </div>
            </div>

            {/* Usage Selection */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-6">
                How will you be using MailForge?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <button
                  onClick={() => { setMode("individual"); setStep("workspace") }}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    mode === "individual"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Individual</p>
                      <p className="text-xs text-gray-500">Build side projects, explore features</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setMode("organization"); setStep("workspace") }}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    mode === "organization"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Organization</p>
                      <p className="text-xs text-gray-500">Collaborate with your team</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {step === "workspace" && (
          <>
            <div className="max-w-lg mx-auto">
              {/* Mode indicator */}
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setStep("welcome")} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  &larr; Back
                </button>
                <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                <span className="text-sm text-gray-400 capitalize">
                  {mode === "individual" ? "Individual" : "Organization"}
                </span>
                <Check className="h-3.5 w-3.5 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Name your workspace
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                This will be your workspace name. You can change it later.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Workspace name
                  </label>
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={mode === "individual" ? "My Projects" : "My Company"}
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={loading || !workspaceName.trim()}
                  className="w-full gap-2 h-12 text-base"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                  {loading ? "Setting up..." : "Continue to MailForge"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

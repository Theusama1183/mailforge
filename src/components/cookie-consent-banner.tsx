"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const consent = localStorage.getItem("mailforge_cookie_consent")
    if (consent === null) {
      setVisible(true)
    }
  }, [])

  const accept = async () => {
    localStorage.setItem("mailforge_cookie_consent", "accepted")
    setVisible(false)
    // Record consent in user preferences if logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        tracking_consent: true,
        cookie_consent_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
    }
  }

  const decline = () => {
    localStorage.setItem("mailforge_cookie_consent", "declined")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We use cookies and tracking pixels to deliver emails and improve your experience.
            By continuing, you agree to our{" "}
            <a href="/privacy" className="text-blue-500 hover:text-blue-600 underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Decline
          </button>
          <button onClick={decline} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

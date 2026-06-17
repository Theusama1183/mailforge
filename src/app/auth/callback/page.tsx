"use client"

import { useEffect } from "react"

export const dynamic = "force-dynamic"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push("/inbox")
      } else {
        router.push("/login")
      }
    }
    handleAuth()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  )
}

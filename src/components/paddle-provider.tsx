"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    Paddle: {
      Initialize: (config: { token: string }) => void
      Environment: {
        set: (env: string) => void
      }
      Checkout: {
        open: (options: {
          transactionId?: string
          items?: { priceId: string; quantity: number }[]
          settings?: Record<string, unknown>
        }) => void
      }
    }
  }
}

export function PaddleProvider() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT

    if (!clientToken) {
      console.warn("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set — Paddle checkout disabled")
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => {
      if (env === "sandbox") {
        window.Paddle.Environment.set("sandbox")
      }
      window.Paddle.Initialize({ token: clientToken })
    }
    document.head.appendChild(script)
  }, [])

  return null
}

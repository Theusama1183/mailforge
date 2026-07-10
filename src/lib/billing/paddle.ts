import { Paddle as PaddleSDK, Environment } from "@paddle/paddle-node-sdk"

let paddleInstance: PaddleSDK | null = null

export function getPaddleClient(): PaddleSDK {
  if (!paddleInstance) {
    const apiKey = process.env.PADDLE_API_KEY
    if (!apiKey) {
      throw new Error("PADDLE_API_KEY environment variable is not set")
    }
    paddleInstance = new PaddleSDK(apiKey, {
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
          ? Environment.sandbox
          : Environment.production,
    })
  }
  return paddleInstance
}

export function getPaddleEnvironment(): "sandbox" | "production" {
  return process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
    ? "production"
    : "sandbox"
}

export function getWebhookSecret(): string {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("PADDLE_WEBHOOK_SECRET environment variable is not set")
  }
  return secret
}

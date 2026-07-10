"use client"

import { useRef, useCallback } from "react"

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipingLeft?: (progress: number) => void
  onSwipingRight?: (progress: number) => void
}

const SWIPE_THRESHOLD = 80

export function useSwipe(handlers: SwipeHandlers) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipeProgressRef = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    swipeProgressRef.current = 0
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y

      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault()
        swipeProgressRef.current = dx
        const progress = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1)

        if (dx < 0) {
          handlers.onSwipingLeft?.(progress)
        } else {
          handlers.onSwipingRight?.(progress)
        }
      }
    },
    [handlers]
  )

  const onTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = swipeProgressRef.current

      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        if (dx < 0) {
          handlers.onSwipeLeft?.()
        } else {
          handlers.onSwipeRight?.()
        }
      }

      touchStartRef.current = null
      swipeProgressRef.current = 0
    },
    [handlers]
  )

  return { onTouchStart, onTouchMove, onTouchEnd }
}

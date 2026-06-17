"use client"

import { useEffect } from "react"

interface KeyboardShortcutMap {
  /** Map of key identifier to callback. Return true to indicate the shortcut was handled. */
  [key: string]: () => void
}

/**
 * Registers global keyboard shortcuts. Automatically skips when the user
 * is focused on an input, textarea, or contenteditable element.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key
      const shortcut = shortcuts[key]
      if (shortcut) {
        e.preventDefault()
        shortcut()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [shortcuts])
}

"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
})

export function useTheme() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = "theme"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolved] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try { localStorage.setItem(STORAGE_KEY, newTheme) } catch {}
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme
    applyThemeClass(resolved)
    if (newTheme !== "system") setResolved(newTheme)
  }, [])

  useEffect(() => {
    const stored = getStoredTheme()
    const resolved = stored === "system" ? getSystemTheme() : stored
    setThemeState(stored)
    setResolved(resolved)
    applyThemeClass(resolved)
    setMounted(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        const sys = getSystemTheme()
        setResolved(sys)
        applyThemeClass(sys)
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem("theme")||"system";if(!["light","dark","system"].includes(t))t="system";var r="system"===t?matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":t;document.documentElement.classList.remove("light","dark"),document.documentElement.classList.add(r),document.documentElement.style.colorScheme=r}catch(e){}`,
        }}
      />
      {children}
    </ThemeContext.Provider>
  )
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && ["light", "dark", "system"].includes(stored)) return stored as Theme
  } catch {}
  return "system"
}

function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

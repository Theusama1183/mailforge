import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { WorkspaceProvider } from "@/components/workspace-provider"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MailForge - Your Domain Email",
  description: "Create and manage email addresses on your own domain",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <WorkspaceProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
            >
              Skip to content
            </a>
            {children}
            <CookieConsentBanner />
          </WorkspaceProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}

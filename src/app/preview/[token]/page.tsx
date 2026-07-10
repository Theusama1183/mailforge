"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Eye, Lock, ExternalLink } from "lucide-react"

export default function PreviewPage() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ template_name: string; subject: string; body_html: string; body_text: string } | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [password, setPassword] = useState("")
  const [viewingClient, setViewingClient] = useState<"browser" | "gmail" | "outlook" | "apple-mail">("browser")

  useEffect(() => {
    loadPreview()
  }, [token])

  async function loadPreview(pwd?: string) {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/preview-links/${token}${pwd ? `?password=${encodeURIComponent(pwd)}` : ""}`
      const res = await fetch(url)
      const json = await res.json()

      if (res.status === 410) {
        setError(json.error || "This preview link has expired")
        return
      }
      if (res.status === 403) {
        setError("Incorrect password")
        return
      }
      if (json.needs_password) {
        setNeedsPassword(true)
        setTemplateName(json.template_name || "")
        return
      }
      if (!res.ok) {
        setError(json.error || "Failed to load preview")
        return
      }
      setData(json)
    } catch {
      setError("Failed to load preview")
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNeedsPassword(false)
    await loadPreview(password)
  }

  function getCssForClient(client: string): string {
    if (client === "gmail") {
      return `<style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .gmail-header { background: #fff; border-bottom: 1px solid #e0e0e0; padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
        .gmail-header svg { width: 24px; height: 24px; color: #d93025; }
        .gmail-header span { font-size: 14px; color: #222; }
      </style>
      <div class="gmail-header">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <span>Gmail</span>
      </div>`
    }
    if (client === "outlook") {
      return `<style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .outlook-header { background: #0078d4; padding: 8px 16px; display: flex; align-items: center; gap: 8px; }
        .outlook-header span { color: #fff; font-size: 14px; font-weight: 600; }
      </style>
      <div class="outlook-header"><span>Outlook</span></div>`
    }
    if (client === "apple-mail") {
      return `<style>
        body { font-family: -apple-system, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; }
        .apple-header { background: #f5f5f5; border-bottom: 1px solid #ddd; padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
        .apple-header span { font-size: 13px; color: #555; font-weight: 500; }
      </style>
      <div class="apple-header"><span>Apple Mail</span></div>`
    }
    return ""
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-center mb-1">Password Required</h1>
          {templateName && <p className="text-sm text-gray-500 text-center mb-4">"{templateName}" is password-protected</p>}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              View Preview
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold mb-1">Preview Unavailable</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{data?.template_name || "Email Preview"}</span>
            {data?.subject && (
              <span className="text-xs text-gray-400">— {data.subject}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-1">Preview in:</span>
            {(["browser", "gmail", "outlook", "apple-mail"] as const).map((client) => (
              <button
                key={client}
                onClick={() => setViewingClient(client)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  viewingClient === client
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {client === "apple-mail" ? "Apple Mail" : client.charAt(0).toUpperCase() + client.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ minHeight: 500 }}>
          <iframe
            srcDoc={getCssForClient(viewingClient) + (data?.body_html || `<pre style="padding:16px;white-space:pre-wrap;font-family:monospace;font-size:13px;">${data?.body_text || ""}</pre>`)}
            className="w-full bg-white"
            style={{ height: "calc(100vh - 180px)", minHeight: 500 }}
            title="Email preview"
          />
        </div>
      </div>
    </div>
  )
}

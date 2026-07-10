"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Star, ShoppingBag, Layers } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"

interface MarketTemplate {
  id: string
  name: string
  description: string
  category: string
  preview_url: string
  author: string
  author_url: string
  subject: string
  downloads: number
  rating: number
  tags: string[]
  featured: boolean
}

const CATEGORIES = ["All", "Marketing", "Transactional", "Newsletter", "Promotional", "Event", "Feedback", "Social"]

export default function MarketplacePage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const [templates, setTemplates] = useState<MarketTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [installing, setInstalling] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [category, searchQuery])

  async function loadTemplates() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category && category !== "All") params.set("category", category)
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`/api/marketplace?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load")
      setTemplates(await res.json())
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  async function installTemplate(templateId: string) {
    setInstalling(templateId)
    try {
      const res = await fetch(`/api/marketplace/${templateId}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      if (!res.ok) { toast.error("Failed to install template"); return }
      toast.success("Template installed successfully!")
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, downloads: (t.downloads || 0) + 1 } : t))
    } catch {
      toast.error("Failed to install template")
    } finally {
      setInstalling(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Template Marketplace"
        description="Browse and install community templates"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(`/${workspaceId}/templates`)} className="gap-2">
            <Layers className="h-4 w-4" />
            My Templates
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Search + Categories */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search marketplace..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                    category === cat
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No templates found"
              description={searchQuery ? "Try a different search term" : "No templates available in this category yet"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <div
                  key={t.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
                >
                  {/* Preview */}
                  <div className="h-36 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
                    <Layers className="h-12 w-12 text-blue-300 dark:text-blue-700" />
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</h3>
                        {t.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {t.category && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t.category}</span>
                      )}
                      {t.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {t.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Download className="h-3 w-3" />
                        {t.downloads}
                      </span>
                    </div>

                    {t.tags && t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {t.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded bg-gray-50 dark:bg-gray-800 text-gray-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => installTemplate(t.id)}
                        disabled={installing === t.id}
                        className="gap-1 flex-1"
                      >
                        {installing === t.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        {installing === t.id ? "Installing..." : "Install"}
                      </Button>
                      {t.author && (
                        <span className="text-[10px] text-gray-400 truncate">
                          by {t.author}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Plus, Play, CheckCircle2, Trophy, BarChart3 } from "lucide-react"
import type { ABTest } from "@/types"

export default function ABTestsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [subjectA, setSubjectA] = useState("")
  const [subjectB, setSubjectB] = useState("")
  const [sending, setSending] = useState(false)

  async function loadTests() {
    const res = await fetch(`/api/ab-tests?workspaceId=${workspaceId}`)
    if (res.ok) {
      const json = await res.json()
      setTests(json.data || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadTests() }, [workspaceId])

  async function handleCreate() {
    if (!name || !subjectA || !subjectB) return
    setSending(true)
    await fetch("/api/ab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        name,
        variants: [
          { subject: subjectA, body_html: "", body_text: "" },
          { subject: subjectB, body_html: "", body_text: "" },
        ],
      }),
    })
    setName("")
    setSubjectA("")
    setSubjectB("")
    setShowCreate(false)
    setSending(false)
    await loadTests()
  }

  async function handleStart(id: string) {
    const recipients = prompt("Enter comma-separated recipient emails:")
    if (!recipients) return
    await fetch(`/api/ab-tests/${id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, recipients: recipients.split(",").map(r => r.trim()) }),
    })
    await loadTests()
  }

  async function handleComplete(id: string) {
    await fetch(`/api/ab-tests/${id}/complete`, { method: "POST" })
    await loadTests()
  }

  async function handleDeclareWinner(testId: string, variantId: string) {
    await fetch(`/api/ab-tests/${testId}/declare-winner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winning_variant_id: variantId }),
    })
    await loadTests()
  }

  return (
    <>
      <PageHeader
        title="A/B Testing"
        description="Create and manage split tests"
        actions={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Test
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {showCreate && (
            <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">New A/B Test</h3>
              <input
                placeholder="Test name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Variant A Subject</label>
                  <input
                    placeholder="Subject line A"
                    value={subjectA}
                    onChange={e => setSubjectA(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Variant B Subject</label>
                  <input
                    placeholder="Subject line B"
                    value={subjectB}
                    onChange={e => setSubjectB(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleCreate} disabled={sending} className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Create Test</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No A/B tests yet. Create your first test to compare subject lines.</p>
            </div>
          ) : tests.map(test => {
            const variantA = test.variants?.[0]
            const variantB = test.variants?.[1]
            const totalSent = (variantA?.sent_count || 0) + (variantB?.sent_count || 0)
            const aOpenRate = variantA?.sent_count ? ((variantA.open_count / variantA.sent_count) * 100).toFixed(1) : "0"
            const bOpenRate = variantB?.sent_count ? ((variantB.open_count / variantB.sent_count) * 100).toFixed(1) : "0"
            const aClickRate = variantA?.sent_count ? ((variantA.click_count / variantA.sent_count) * 100).toFixed(1) : "0"
            const bClickRate = variantB?.sent_count ? ((variantB.click_count / variantB.sent_count) * 100).toFixed(1) : "0"

            return (
              <div key={test.id} className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{test.name}</h3>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      test.status === "draft" ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" :
                      test.status === "running" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    }`}>{test.status}</span>
                  </div>
                  <div className="flex gap-2">
                    {test.status === "draft" && (
                      <button onClick={() => handleStart(test.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700">
                        <Play className="h-3 w-3" /> Start
                      </button>
                    )}
                    {test.status === "running" && (
                      <button onClick={() => handleComplete(test.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-gray-600 text-white hover:bg-gray-700">
                        <CheckCircle2 className="h-3 w-3" /> Complete
                      </button>
                    )}
                  </div>
                </div>

                {test.status !== "draft" && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className={`p-4 rounded-lg border ${test.winning_variant_id === variantA?.id ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-100 dark:border-gray-800"}`}>
                        <p className="text-xs font-medium text-gray-500 mb-1">Variant A</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{variantA?.subject}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">Sent:</span><span>{variantA?.sent_count || 0}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Open rate:</span><span className="text-green-600 font-medium">{aOpenRate}%</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Click rate:</span><span className="text-blue-600 font-medium">{aClickRate}%</span></div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg border ${test.winning_variant_id === variantB?.id ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-100 dark:border-gray-800"}`}>
                        <p className="text-xs font-medium text-gray-500 mb-1">Variant B</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{variantB?.subject}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">Sent:</span><span>{variantB?.sent_count || 0}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Open rate:</span><span className="text-green-600 font-medium">{bOpenRate}%</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Click rate:</span><span className="text-blue-600 font-medium">{bClickRate}%</span></div>
                        </div>
                      </div>
                    </div>
                    {test.status === "completed" && !test.winning_variant_id && (
                      <div className="flex gap-2 mt-4 justify-center">
                        <button onClick={() => handleDeclareWinner(test.id, variantA!.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                          <Trophy className="h-3 w-3" /> Declare A Winner
                        </button>
                        <button onClick={() => handleDeclareWinner(test.id, variantB!.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                          <Trophy className="h-3 w-3" /> Declare B Winner
                        </button>
                      </div>
                    )}
                    {test.winning_variant_id && (
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                          <Trophy className="h-4 w-4" />
                          Winner: Variant {test.winning_variant_id === variantA?.id ? "A" : "B"}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {test.status === "draft" && (
                  <p className="text-xs text-gray-400 text-center py-4">Start the test to send variants and track results</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

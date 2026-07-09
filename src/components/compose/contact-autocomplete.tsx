"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Users } from "lucide-react"

interface ContactSuggestion {
  id: string
  email: string
  name: string | null
  company: string | null
}

interface GroupSuggestion {
  id: string
  name: string
  member_count?: number
  isGroup: true
}

export function ContactAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  workspaceId,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  workspaceId?: string
}) {
  const [suggestions, setSuggestions] = useState<(ContactSuggestion | GroupSuggestion)[]>([])
  const [show, setShow] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }
    try {
      const params = new URLSearchParams({ q: query })
      if (workspaceId) params.set("workspaceId", workspaceId)
      const [contactsRes, groupsRes] = await Promise.all([
        fetch(`/api/contacts/search?${params}`),
        workspaceId ? fetch(`/api/contact-groups?workspaceId=${encodeURIComponent(workspaceId)}&q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : []) : [],
      ])
      const contacts: ContactSuggestion[] = contactsRes.ok ? await contactsRes.json() : []
      const groups: GroupSuggestion[] = (groupsRes || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        member_count: g.contact_group_members?.count || 0,
        isGroup: true as const,
      }))
      const combined = [...groups, ...contacts]
      setSuggestions(combined)
      setShow(combined.length > 0)
      setActiveIndex(-1)
    } catch {}
  }, [workspaceId])

  const onInputChange = (val: string) => {
    onChange(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const last = val.split(",").pop()?.trim() || ""
      fetchSuggestions(last)
    }, 200)
  }

  const selectSuggestion = async (s: ContactSuggestion | GroupSuggestion) => {
    if ("isGroup" in s && s.isGroup) {
      try {
        const res = await fetch(`/api/contact-groups/${s.id}/members?includeContacts=true`)
        if (res.ok) {
          const members = await res.json()
          const emails = members.map((m: any) => {
            const contact = m.contacts
            return contact ? `${contact.name ? `${contact.name} <${contact.email}>` : contact.email}` : ""
          }).filter(Boolean)
          const parts = value.split(",")
          parts[parts.length - 1] = ""
          onChange([...parts, ...emails].filter(Boolean).join(", "))
        }
      } catch {}
    } else if ("email" in s) {
      const parts = value.split(",")
      parts[parts.length - 1] = ` ${s.name ? `${s.name} <${s.email}>` : s.email}`
      onChange(parts.join(","))
    }
    setShow(false)
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!show || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      setShow(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShow(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          const last = value.split(",").pop()?.trim() || ""
          if (last.length >= 1) fetchSuggestions(last)
        }}
        placeholder={placeholder}
        className="border-0 border-b border-gray-100 dark:border-gray-700 rounded-none px-0 h-8 text-sm focus:ring-0"
      />
      {show && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSuggestion(s)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${i === activeIndex ? "bg-gray-50 dark:bg-gray-800" : ""}`}
            >
              {"isGroup" in s && s.isGroup ? (
                <>
                  <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</div>
                    <div className="text-[10px] text-amber-600">{s.member_count} member{s.member_count !== 1 ? "s" : ""} · click to expand</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {((s as ContactSuggestion).name || (s as ContactSuggestion).email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      {(s as ContactSuggestion).name || <span className="text-gray-400 italic">No name</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{(s as ContactSuggestion).email}{(s as ContactSuggestion).company ? ` · ${(s as ContactSuggestion).company}` : ""}</div>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

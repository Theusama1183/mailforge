'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  SaveOutlined, ArrowBackOutlined, UndoOutlined, RedoOutlined,
  ZoomInOutlined, ZoomOutOutlined, ContentCopyOutlined, ContentPasteOutlined,
  ContentCutOutlined, DeleteOutlined, SearchOutlined,
} from '@mui/icons-material'
import {
  Box, Button, CircularProgress, IconButton, Stack, TextField, ThemeProvider,
  Tooltip, Typography, createTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItemButton, ListItemText, InputAdornment, Badge,
} from '@mui/material'
import { renderToHtml } from '@/components/email-builder/render-to-html'
import { createClient } from '@/lib/supabase/client'

import InspectorDrawer from '@/components/email-builder/inspector'
import SamplesDrawer from '@/components/email-builder/samples'
import TemplatePanel from '@/components/email-builder/template-panel'
import {
  getDocumentSnapshot, setDocumentFull, undo, redo, setZoom, useZoom,
  clipboardCopy, clipboardPaste, clipboardCut, deleteSelectedBlocks,
  duplicateSelectedBlocks, moveSelectedBlocks,
  scheduleAutoSave, loadAutoSave, clearAutoSave,
  searchInDocument, setSearchOpen, setSearchQuery, useSearchOpen, useSearchQuery,
  useSelectedBlockId, useDocument,
} from '@/components/email-builder/editor/EditorContext'

const theme = createTheme()

export default function EmailBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateSubject, setTemplateSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const zoom = useZoom()
  const searchOpen = useSearchOpen()
  const searchQuery = useSearchQuery()
  const selectedBlockId = useSelectedBlockId()
  const document = useDocument()
  const [searchResults, setSearchResults] = useState<string[]>([])
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const tid = window.location.hash.replace('#', '') || null
    setTemplateId(tid)

    const autoSaved = loadAutoSave()
    if (autoSaved && Object.keys(autoSaved).length > 1) {
      setDocumentFull(autoSaved)
    }

    if (tid) {
      loadTemplate(tid)
    } else {
      setLoading(false)
    }

    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      if (autosaveRef.current) clearInterval(autosaveRef.current)
      autosaveRef.current = setInterval(scheduleAutoSave, 15000)
    }
  }, [loading])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey

    if (isCtrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); undo()
    }
    if (isCtrl && e.key === 'z' && e.shiftKey) {
      e.preventDefault(); redo()
    }
    if (isCtrl && e.key === 'y') {
      e.preventDefault(); redo()
    }
    if (isCtrl && e.key === 'c') {
      if (selectedBlockId) { e.preventDefault(); clipboardCopy() }
    }
    if (isCtrl && e.key === 'x') {
      if (selectedBlockId) { e.preventDefault(); clipboardCut() }
    }
    if (isCtrl && e.key === 'v') {
      e.preventDefault(); clipboardPaste()
    }
    if (isCtrl && e.key === 'd') {
      if (selectedBlockId) { e.preventDefault(); duplicateSelectedBlocks() }
    }
    if (isCtrl && e.key === 'f') {
      e.preventDefault(); setSearchOpen(!searchOpen)
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      e.preventDefault(); deleteSelectedBlocks()
    }
    if (e.key === '+' && e.ctrlKey) {
      e.preventDefault(); setZoom(zoom + 10)
    }
    if (e.key === '-' && e.ctrlKey) {
      e.preventDefault(); setZoom(zoom - 10)
    }
    if (e.key === '0' && e.ctrlKey) {
      e.preventDefault(); setZoom(100)
    }
  }, [selectedBlockId, zoom, searchOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchInDocument(searchQuery))
    } else {
      setSearchResults([])
    }
  }, [searchQuery, document])

  async function loadTemplate(id: string) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        setLoading(false)
        return
      }

      setTemplateName(data.name || '')
      setTemplateSubject(data.subject || '')

      if (data.body_text) {
        try {
          const doc = JSON.parse(data.body_text)
          if (doc && typeof doc === 'object') {
            setDocumentFull(doc)
            clearAutoSave()
          }
        } catch {
        }
      }
    } catch (err) {
      console.error('Failed to load template:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setSaveError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const document = getDocumentSnapshot()
      const jsonConfig = JSON.stringify(document)
      const html = renderToHtml(document, 'root')

      const payload = {
        name: templateName || 'Untitled Template',
        subject: templateSubject,
        body_html: html,
        body_text: jsonConfig,
      }

      if (templateId) {
        const { error } = await supabase
          .from('templates')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', templateId)
        if (error) throw new Error(error.message || 'Update failed')
      } else {
        const { data, error } = await supabase
          .from('templates')
          .insert({ ...payload, user_id: user.id, workspace_id: workspaceId || null })
          .select()
        if (error) {
          const msg = error.message || 'Insert failed'
          if (msg.includes('schema cache')) {
            throw new Error(
              `The "templates" table is missing from the database. ` +
              `Run "supabase db push" in your terminal to apply pending migrations, ` +
              `or run the SQL from supabase/migrations/0007_templates.sql in the Supabase SQL editor.`
            )
          }
          throw new Error(msg)
        }
        if (!data || data.length === 0) throw new Error('No data returned')

        setTemplateId(data[0].id)
        window.location.hash = data[0].id
      }

      clearAutoSave()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setSaveError(msg)
      console.error('Failed to save template:', msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, py: 0.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'white', alignItems: 'center', minHeight: 48 }}
        >
          <Button size="small" startIcon={<ArrowBackOutlined />} onClick={() => router.push(`/${workspaceId}/templates`)}>
            Back
          </Button>
          <TextField size="small" placeholder="Template name" value={templateName}
            onChange={(e) => setTemplateName(e.target.value)} sx={{ minWidth: 160 }} />
          <TextField size="small" placeholder="Subject line (optional)" value={templateSubject}
            onChange={(e) => setTemplateSubject(e.target.value)} sx={{ minWidth: 240 }} />

          <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 24, mx: 1 }} />

          <Tooltip title="Undo (Ctrl+Z)">
            <IconButton size="small" onClick={() => undo()}><UndoOutlined fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <IconButton size="small" onClick={() => redo()}><RedoOutlined fontSize="small" /></IconButton>
          </Tooltip>

          <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 24, mx: 1 }} />

          <Tooltip title="Copy (Ctrl+C)">
            <span><IconButton size="small" disabled={!selectedBlockId} onClick={() => clipboardCopy()}><ContentCopyOutlined fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title="Cut (Ctrl+X)">
            <span><IconButton size="small" disabled={!selectedBlockId} onClick={() => clipboardCut()}><ContentCutOutlined fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title="Paste (Ctrl+V)">
            <IconButton size="small" onClick={() => clipboardPaste()}><ContentPasteOutlined fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Duplicate (Ctrl+D)">
            <span><IconButton size="small" disabled={!selectedBlockId} onClick={() => duplicateSelectedBlocks()}><ContentCopyOutlined fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title="Delete (Del)">
            <span><IconButton size="small" disabled={!selectedBlockId} onClick={() => deleteSelectedBlocks()}><DeleteOutlined fontSize="small" /></IconButton></span>
          </Tooltip>

          <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 24, mx: 1 }} />

          <Tooltip title="Zoom Out (Ctrl+-)">
            <IconButton size="small" onClick={() => setZoom(zoom - 10)}><ZoomOutOutlined fontSize="small" /></IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', userSelect: 'none' }}>
            {zoom}%
          </Typography>
          <Tooltip title="Zoom In (Ctrl++)">
            <IconButton size="small" onClick={() => setZoom(zoom + 10)}><ZoomInOutlined fontSize="small" /></IconButton>
          </Tooltip>

          <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 24, mx: 1 }} />

          <Tooltip title="Search (Ctrl+F)">
            <IconButton size="small" onClick={() => setSearchOpen(!searchOpen)}>
              <Badge badgeContent={searchResults.length} color="primary" invisible={searchResults.length === 0 || !searchOpen}>
                <SearchOutlined fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={saved ? undefined : <SaveOutlined />}
            onClick={handleSave} disabled={saving} color={saved ? 'success' : 'primary'}>
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </Button>
        </Stack>

        {saveError && (
          <Box sx={{ px: 2, py: 1, bgcolor: 'error.main', color: 'error.contrastText', fontSize: 14 }}>
            {saveError}
          </Box>
        )}

        <SearchDialog open={searchOpen} query={searchQuery} results={searchResults}
          onQueryChange={setSearchQuery} onClose={() => setSearchOpen(false)} />

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          <SamplesDrawer />
          <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'auto' }}>
            <TemplatePanel />
          </Box>
          <InspectorDrawer />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

function SearchDialog({ open, query, results, onQueryChange, onClose }: {
  open: boolean; query: string; results: string[];
  onQueryChange: (q: string) => void; onClose: () => void
}) {
  const clickedRef = useRef(false)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Search in Document</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth size="small" placeholder="Search text across all blocks..."
          value={query} onChange={(e) => onQueryChange(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
          sx={{ mb: 2 }} />
        {query.trim() && (
          <Typography variant="caption" color="text.secondary">
            {results.length} block{results.length !== 1 ? 's' : ''} found
          </Typography>
        )}
        {results.length > 0 && (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {results.map((id) => (
              <ListItemButton key={id} onClick={() => {
                const { setSelectedBlockId } = require('@/components/email-builder/editor/EditorContext')
                setSelectedBlockId(id)
                clickedRef.current = true
                onClose()
              }}>
                <ListItemText primary={id} secondary={query ? `Contains "${query}"` : ''} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

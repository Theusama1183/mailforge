'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { Box, Button, CircularProgress, Stack, TextField, ThemeProvider, Typography, createTheme } from '@mui/material'
import { renderToHtml } from '@/components/email-builder/render-to-html'
import { createClient } from '@/lib/supabase/client'

import InspectorDrawer from '@/components/email-builder/inspector'
import SamplesDrawer from '@/components/email-builder/samples'
import TemplatePanel from '@/components/email-builder/template-panel'
import { getDocumentSnapshot, setDocumentFull } from '@/components/email-builder/editor/EditorContext'

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
  const supabase = createClient()

  useEffect(() => {
    const tid = window.location.hash.replace('#', '') || null
    setTemplateId(tid)

    if (tid) {
      loadTemplate(tid)
    } else {
      setLoading(false)
    }
  }, [])

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
          .insert({ ...payload, user_id: user.id })
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
          spacing={2}
          sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'white', alignItems: 'center' }}
        >
          <Button
            size="small"
            startIcon={<ArrowBackOutlined />}
            onClick={() => router.push(`/${workspaceId}/templates`)}
          >
            Back
          </Button>
          <TextField
            size="small"
            placeholder="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            placeholder="Subject line (optional)"
            value={templateSubject}
            onChange={(e) => setTemplateSubject(e.target.value)}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={saved ? undefined : <SaveOutlined />}
            onClick={handleSave}
            disabled={saving}
            color={saved ? 'success' : 'primary'}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </Button>
        </Stack>
        {saveError && (
          <Box sx={{ px: 2, py: 1, bgcolor: 'error.main', color: 'error.contrastText', fontSize: 14 }}>
            {saveError}
          </Box>
        )}
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

import React, { useMemo } from 'react'

import { Box } from '@mui/material'
import { renderToHtml } from '@/components/email-builder/render-to-html'

import { useDocument } from '../editor/EditorContext'

export default function HtmlPanel() {
  const document = useDocument()
  const html = useMemo(() => {
    try {
      return renderToHtml(document, 'root')
    } catch {
      return 'Error rendering HTML'
    }
  }, [document])

  return (
    <Box sx={{ p: 2 }}>
      <Box
        component="pre"
        sx={{
          fontFamily: 'monospace',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 1,
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'auto',
        }}
      >
        {html}
      </Box>
    </Box>
  )
}

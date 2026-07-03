import React, { useMemo } from 'react'

import { Box } from '@mui/material'
import { renderToStaticMarkup } from '@usewaypoint/email-builder'

import { useDocument } from '../editor/EditorContext'

export default function HtmlPanel() {
  const document = useDocument()
  const html = useMemo(() => {
    try {
      return renderToStaticMarkup(document, { rootBlockId: 'root' })
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

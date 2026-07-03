import React from 'react'

import { Box } from '@mui/material'

import { useDocument } from '../editor/EditorContext'

export default function JsonPanel() {
  const document = useDocument()

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
        {JSON.stringify(document, null, 2)}
      </Box>
    </Box>
  )
}

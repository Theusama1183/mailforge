import React from 'react'

import { Box, Stack, Typography } from '@mui/material'

type Props = {
  title: string
  children: React.ReactNode
}
export default function MultiStylePropertyPanel({ title, children }: Props) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {title}
      </Typography>
      <Stack spacing={3}>
        {children}
      </Stack>
    </Box>
  )
}

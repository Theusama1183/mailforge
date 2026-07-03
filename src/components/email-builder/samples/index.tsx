import React from 'react'

import { Box, Divider, Stack, Typography } from '@mui/material'

import { useSamplesDrawerOpen } from '../editor/EditorContext'

import SidebarButton from './SidebarButton'

export const SAMPLES_DRAWER_WIDTH = 240

export default function SamplesDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen()

  return (
    <Box
      sx={{
        width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
        height: '100%',
        borderRight: samplesDrawerOpen ? 1 : 0,
        borderColor: 'divider',
        bgcolor: 'white',
      }}
    >
      <Box sx={{ width: SAMPLES_DRAWER_WIDTH, height: '100%', overflow: 'auto' }}>
        <Stack spacing={3} sx={{ py: 1, px: 2, justifyContent: 'space-between', height: '100%' }}>
          <Stack spacing={2} sx={{ '& .MuiButtonBase-root': { width: '100%', justifyContent: 'flex-start' } }}>
            <Typography variant="h6" component="h1" sx={{ p: 0.75 }}>
              Email Builder
            </Typography>

            <Stack sx={{ alignItems: 'flex-start' }}>
              <SidebarButton href="#">Empty</SidebarButton>
            </Stack>

            <Divider />

            <Stack>
              <Typography variant="body2" color="text.secondary" sx={{ px: 0.75 }}>
                Click the + buttons between blocks to add new content.
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

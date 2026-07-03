import React from 'react'

import { Box, Tab, Tabs } from '@mui/material'

import { setSidebarTab, useInspectorDrawerOpen, useSelectedSidebarTab } from '../editor/EditorContext'

import ConfigurationPanel from './ConfigurationPanel'
import StylesPanel from './StylesPanel'

export const INSPECTOR_DRAWER_WIDTH = 320

export default function InspectorDrawer() {
  const selectedSidebarTab = useSelectedSidebarTab()
  const inspectorDrawerOpen = useInspectorDrawerOpen()

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'block-configuration':
        return <ConfigurationPanel />
      case 'styles':
        return <StylesPanel />
    }
  }

  return (
    <Box
      sx={{
        width: inspectorDrawerOpen ? INSPECTOR_DRAWER_WIDTH : 0,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
        height: '100%',
        borderLeft: inspectorDrawerOpen ? 1 : 0,
        borderColor: 'divider',
        bgcolor: 'white',
      }}
    >
      <Box sx={{ width: INSPECTOR_DRAWER_WIDTH, height: '100%', overflow: 'auto' }}>
        <Box sx={{ height: 49, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ px: 2 }}>
            <Tabs value={selectedSidebarTab} onChange={(_, v) => setSidebarTab(v)}>
              <Tab value="styles" label="Styles" />
              <Tab value="block-configuration" label="Inspect" />
            </Tabs>
          </Box>
        </Box>
        <Box sx={{ height: 'calc(100% - 49px)', overflow: 'auto' }}>
          {renderCurrentSidebarPanel()}
        </Box>
      </Box>
    </Box>
  )
}

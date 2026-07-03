import React from 'react'

import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { CodeOutlined, DesktopWindowsOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material'

import { setSelectedMainTab, useSelectedMainTab } from '../editor/EditorContext'

export default function MainTabsGroup() {
  const selectedMainTab = useSelectedMainTab()

  return (
    <ToggleButtonGroup
      value={selectedMainTab}
      exclusive
      size="small"
      onChange={(_, v) => {
        if (v) setSelectedMainTab(v)
      }}
    >
      <ToggleButton value="editor">
        <EditOutlined fontSize="small" />
      </ToggleButton>
      <ToggleButton value="preview">
        <VisibilityOutlined fontSize="small" />
      </ToggleButton>
      <ToggleButton value="html">
        <CodeOutlined fontSize="small" />
      </ToggleButton>
      <ToggleButton value="json">
        <DesktopWindowsOutlined fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

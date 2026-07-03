import React from 'react'

import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { FormatAlignCenterOutlined, FormatAlignLeftOutlined, FormatAlignRightOutlined } from '@mui/icons-material'

type Props = {
  value: string | null | undefined
  onChange: (v: string | null | undefined) => void
}
export default function TextAlignInput({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      value={value ?? 'left'}
      exclusive
      size="small"
      onChange={(_, v) => onChange(v || null)}
    >
      <ToggleButton value="left">
        <FormatAlignLeftOutlined fontSize="small" />
      </ToggleButton>
      <ToggleButton value="center">
        <FormatAlignCenterOutlined fontSize="small" />
      </ToggleButton>
      <ToggleButton value="right">
        <FormatAlignRightOutlined fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

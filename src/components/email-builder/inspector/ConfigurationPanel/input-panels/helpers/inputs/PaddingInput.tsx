import React from 'react'

import { InputAdornment, Stack, TextField, Typography } from '@mui/material'

type PaddingInputProps = {
  value: { top: number; bottom: number; left: number; right: number } | null | undefined
  onChange: (v: { top: number; bottom: number; left: number; right: number } | null | undefined) => void
}
export default function PaddingInput({ value, onChange }: PaddingInputProps) {
  const v = value ?? { top: 0, bottom: 0, left: 0, right: 0 }
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Padding
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Top"
          size="small"
          type="number"
          value={v.top}
          onChange={(e) => onChange({ ...v, top: parseInt(e.target.value, 10) || 0 })}
          slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment> } }}
        />
        <TextField
          label="Bottom"
          size="small"
          type="number"
          value={v.bottom}
          onChange={(e) => onChange({ ...v, bottom: parseInt(e.target.value, 10) || 0 })}
          slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment> } }}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Left"
          size="small"
          type="number"
          value={v.left}
          onChange={(e) => onChange({ ...v, left: parseInt(e.target.value, 10) || 0 })}
          slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment> } }}
        />
        <TextField
          label="Right"
          size="small"
          type="number"
          value={v.right}
          onChange={(e) => onChange({ ...v, right: parseInt(e.target.value, 10) || 0 })}
          slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment> } }}
        />
      </Stack>
    </Stack>
  )
}

import React from 'react'

import { InputAdornment, TextField } from '@mui/material'

type Props = {
  value: number | null | undefined
  onChange: (v: number | null | undefined) => void
}
export default function FontSizeInput({ value, onChange }: Props) {
  return (
    <TextField
      label="Font size"
      size="small"
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">px</InputAdornment>,
        },
      }}
      fullWidth
    />
  )
}

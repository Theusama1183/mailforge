import React from 'react'

import { MenuItem, TextField } from '@mui/material'

type Props = {
  value: string | null | undefined
  onChange: (v: string | null | undefined) => void
}
export default function FontWeightInput({ value, onChange }: Props) {
  return (
    <TextField
      select
      label="Font weight"
      size="small"
      value={value ?? 'normal'}
      onChange={(e) => onChange(e.target.value || null)}
      fullWidth
    >
      <MenuItem value="normal">Normal</MenuItem>
      <MenuItem value="bold">Bold</MenuItem>
    </TextField>
  )
}

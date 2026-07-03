import React from 'react'

import { Stack, TextField, Typography } from '@mui/material'

type ColorInputProps = {
  label: string
  value: string | null | undefined
  onChange: (v: string | null | undefined) => void
}
export default function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <TextField
        label={label}
        size="small"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        sx={{ flexGrow: 1 }}
      />
      <input
        type="color"
        value={value ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', padding: 0 }}
      />
    </Stack>
  )
}

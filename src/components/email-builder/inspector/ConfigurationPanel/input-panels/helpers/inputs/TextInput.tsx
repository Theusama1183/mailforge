import React from 'react'

import { TextField } from '@mui/material'

type Props = {
  label: string
  value: string | null | undefined
  onChange: (v: string | null | undefined) => void
  multiline?: boolean
  rows?: number
}
export default function TextInput({ label, value, onChange, multiline, rows }: Props) {
  return (
    <TextField
      label={label}
      size="small"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      multiline={multiline}
      rows={rows}
      fullWidth
    />
  )
}

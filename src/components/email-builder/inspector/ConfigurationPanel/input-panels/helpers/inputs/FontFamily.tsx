import React from 'react'

import { MenuItem, TextField } from '@mui/material'

import { FONT_FAMILIES } from '../../../../../blocks/helpers/fontFamily'

type Props = {
  value: string | null | undefined
  onChange: (v: string | null | undefined) => void
}
export default function FontFamilyInput({ value, onChange }: Props) {
  return (
    <TextField
      select
      label="Font family"
      size="small"
      value={value ?? 'MODERN_SANS'}
      onChange={(e) => onChange(e.target.value || null)}
      fullWidth
    >
      {FONT_FAMILIES.map((f) => (
        <MenuItem key={f.key} value={f.key}>
          {f.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

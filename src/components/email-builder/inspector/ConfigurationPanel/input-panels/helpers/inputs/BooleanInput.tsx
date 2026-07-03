import React from 'react'

import { FormControlLabel, Switch } from '@mui/material'

type Props = {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}
export default function BooleanInput({ label, value, onChange }: Props) {
  return (
    <FormControlLabel
      label={label}
      control={
        <Switch
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
    />
  )
}

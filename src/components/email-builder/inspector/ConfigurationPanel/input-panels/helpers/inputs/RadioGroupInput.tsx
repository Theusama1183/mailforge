import React from 'react'

import { FormControlLabel, Radio, RadioGroup } from '@mui/material'

type Props = {
  label: string
  value: string | null | undefined
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}
export default function RadioGroupInput({ label, value, options, onChange }: Props) {
  return (
    <RadioGroup value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <FormControlLabel key={opt.value} value={opt.value} label={opt.label} control={<Radio size="small" />} />
      ))}
    </RadioGroup>
  )
}

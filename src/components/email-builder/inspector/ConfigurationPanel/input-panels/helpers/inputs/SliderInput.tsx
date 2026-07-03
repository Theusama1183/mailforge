import React from 'react'

import { Slider, Stack, Typography } from '@mui/material'

type Props = {
  label: string
  value: number | null | undefined
  onChange: (v: number | null | undefined) => void
  min?: number
  max?: number
  step?: number
}
export default function SliderInput({ label, value, onChange, min = 0, max = 100, step = 1 }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Slider
        value={value ?? 0}
        onChange={(_, v) => onChange(v as number)}
        min={min}
        max={max}
        step={step}
      />
    </Stack>
  )
}

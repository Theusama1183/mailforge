import React from 'react'

import { Box, InputAdornment, Slider, Stack, TextField, Typography } from '@mui/material'

type ColumnWidthsInput = {
  value: number[]
  onChange: (v: number[]) => void
}
export default function ColumnWidthsInput({ value, onChange }: ColumnWidthsInput) {
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Column widths
      </Typography>
      {value.map((v, i) => (
        <TextField
          key={i}
          label={`Column ${i + 1}`}
          size="small"
          type="number"
          value={v}
          onChange={(e) => {
            const n = [...value]
            n[i] = parseInt(e.target.value, 10)
            onChange(n)
          }}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">px</InputAdornment>,
            },
          }}
        />
      ))}
    </Stack>
  )
}

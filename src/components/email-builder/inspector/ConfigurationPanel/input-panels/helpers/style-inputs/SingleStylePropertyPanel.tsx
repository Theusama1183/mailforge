import React from 'react'

import { Box, Stack, Typography } from '@mui/material'

import { MUI_STYLE_INPUTS } from './StyleInputInfo'

import ColorInput from '../inputs/ColorInput'
import FontSizeInput from '../inputs/FontSizeInput'
import FontWeightInput from '../inputs/FontWeightInput'
import PaddingInput from '../inputs/PaddingInput'
import TextAlignInput from '../inputs/TextAlignInput'

type Props = {
  style: Record<string, any>
  onChange: (style: Record<string, any>) => void
}
export default function SingleStylePropertyPanel({ style, onChange }: Props) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Style
      </Typography>
      <Stack spacing={3}>
        {MUI_STYLE_INPUTS.map((input) => {
          const key = input.key
          const value = style[key]
          const handleChange = (v: any) => {
            onChange({ ...style, [key]: v })
          }
          switch (input.type) {
            case 'color':
              return <ColorInput key={key} label={input.label} value={value} onChange={handleChange} />
            case 'font-size':
              return <FontSizeInput key={key} value={value} onChange={handleChange} />
            case 'font-weight':
              return <FontWeightInput key={key} value={value} onChange={handleChange} />
            case 'text-align':
              return <TextAlignInput key={key} value={value} onChange={handleChange} />
            case 'padding':
              return <PaddingInput key={key} value={value} onChange={handleChange} />
            default:
              return null
          }
        })}
      </Stack>
    </Box>
  )
}

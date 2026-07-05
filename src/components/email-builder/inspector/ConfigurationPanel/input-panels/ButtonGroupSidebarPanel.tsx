import React from 'react'

import { Box, Button } from '@mui/material'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import BooleanInput from './helpers/inputs/BooleanInput'
import ColorInput from './helpers/inputs/ColorInput'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import PaddingInput from './helpers/inputs/PaddingInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['textAlign', 'padding']

export default function ButtonGroupSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}
  const buttons = props_.buttons ?? []

  const addButton = () => {
    const newButtons = [...buttons, { text: 'Button', url: 'https://example.com' }]
    setData({ ...data, props: { ...props_, buttons: newButtons } })
  }

  const removeButton = (i: number) => {
    const newButtons = buttons.filter((_: any, idx: number) => idx !== i)
    setData({ ...data, props: { ...props_, buttons: newButtons } })
  }

  const updateButton = (i: number, field: string, value: string | null | undefined) => {
    const newButtons = buttons.map((b: any, idx: number) => idx === i ? { ...b, [field]: value } : b)
    setData({ ...data, props: { ...props_, buttons: newButtons } })
  }

  return (
    <BaseSidebarPanel title="Button Group">
      <RadioGroupInput
        label="Layout"
        value={props_.alignment ?? 'horizontal'}
        options={[
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' },
        ]}
        onChange={(alignment) => setData({ ...data, props: { ...props_, alignment } })}
      />

      {buttons.map((btn: any, i: number) => (
        <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <TextInput label={`Button ${i + 1} text`} value={btn.text} onChange={(v) => updateButton(i, 'text', v)} />
          <TextInput label={`Button ${i + 1} URL`} value={btn.url} onChange={(v) => updateButton(i, 'url', v)} />
          {buttons.length > 1 && (
            <Button size="small" color="error" onClick={() => removeButton(i)}>Remove</Button>
          )}
        </Box>
      ))}

      <Button variant="outlined" size="small" onClick={addButton}>Add button</Button>

      <SliderInput label="Gap" value={style.gap} onChange={(gap) => setData({ ...data, style: { ...style, gap } })} min={0} max={48} />
      <ColorInput label="Button background" value={style.buttonBackgroundColor} onChange={(buttonBackgroundColor) => setData({ ...data, style: { ...style, buttonBackgroundColor } })} />
      <ColorInput label="Button text color" value={style.buttonTextColor} onChange={(buttonTextColor) => setData({ ...data, style: { ...style, buttonTextColor } })} />
      <SliderInput label="Button border radius" value={style.buttonBorderRadius} onChange={(buttonBorderRadius) => setData({ ...data, style: { ...style, buttonBorderRadius } })} min={0} max={30} />
      <FontSizeInput value={style.buttonFontSize} onChange={(buttonFontSize) => setData({ ...data, style: { ...style, buttonFontSize } })} />
      <PaddingInput value={style.buttonPadding} onChange={(buttonPadding) => setData({ ...data, style: { ...style, buttonPadding } })} />
      <BooleanInput label="Full width buttons" value={style.fullWidth ?? false} onChange={(fullWidth) => setData({ ...data, style: { ...style, fullWidth } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

import React from 'react'

import { Box, Button, IconButton } from '@mui/material'
import { RemoveCircleOutlined, AddCircleOutlined } from '@mui/icons-material'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import BooleanInput from './helpers/inputs/BooleanInput'
import ColorInput from './helpers/inputs/ColorInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['textAlign', 'padding']

export default function AccordionSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}
  const items = props_.items ?? []

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = items.map((item: any, i: number) => i === index ? { ...item, [field]: value } : item)
    setData({ ...data, props: { ...props_, items: newItems } })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index)
    setData({ ...data, props: { ...props_, items: newItems } })
  }

  const addItem = () => {
    const newItems = [...items, { title: 'New question', content: 'Answer goes here', open: false }]
    setData({ ...data, props: { ...props_, items: newItems } })
  }

  return (
    <BaseSidebarPanel title="FAQ / Accordion">
      <ColorInput
        label="Title color"
        value={props_.titleColor}
        onChange={(titleColor) => setData({ ...data, props: { ...props_, titleColor } })}
      />
      <ColorInput
        label="Content color"
        value={props_.contentColor}
        onChange={(contentColor) => setData({ ...data, props: { ...props_, contentColor } })}
      />
      <ColorInput
        label="Border color"
        value={props_.borderColor}
        onChange={(borderColor) => setData({ ...data, props: { ...props_, borderColor } })}
      />
      <ColorInput
        label="Background color"
        value={props_.backgroundColor}
        onChange={(backgroundColor) => setData({ ...data, props: { ...props_, backgroundColor } })}
      />
      <SliderInput
        label="Border radius"
        value={props_.borderRadius}
        onChange={(borderRadius) => setData({ ...data, props: { ...props_, borderRadius } })}
        min={0}
        max={20}
      />
      <SliderInput
        label="Gap between items"
        value={props_.gap}
        onChange={(gap) => setData({ ...data, props: { ...props_, gap } })}
        min={0}
        max={16}
      />

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item: any, index: number) => (
            <Box key={index} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ fontWeight: 600, fontSize: 13 }}>Item {index + 1}</Box>
                <IconButton size="small" onClick={() => removeItem(index)} color="error">
                  <RemoveCircleOutlined fontSize="small" />
                </IconButton>
              </Box>
              <TextInput
                label="Title"
                value={item.title}
                onChange={(title) => updateItem(index, 'title', title)}
              />
              <TextInput
                label="Content"
                value={item.content}
                onChange={(content) => updateItem(index, 'content', content)}
                multiline
                rows={3}
              />
              <BooleanInput
                label="Open by default"
                value={item.open ?? false}
                onChange={(open) => updateItem(index, 'open', open)}
              />
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          startIcon={<AddCircleOutlined />}
          onClick={addItem}
          sx={{ mt: 1, textTransform: 'none' }}
        >
          Add item
        </Button>
      </Box>

      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

import React from 'react'

import { z } from 'zod'
import { ButtonPropsSchema } from '@usewaypoint/block-button'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import FontWeightInput from './helpers/inputs/FontWeightInput'
import PaddingInput from './helpers/inputs/PaddingInput'
import TextAlignInput from './helpers/inputs/TextAlignInput'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: z.infer<typeof ButtonPropsSchema>
  setData: (data: z.infer<typeof ButtonPropsSchema>) => void
}

export default function ButtonSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Button">
      <TextInput label="Button text" value={data.props?.text} onChange={(text) => setData({ ...data, props: { ...data.props, text } })} />
      <TextInput label="URL" value={data.props?.url} onChange={(url) => setData({ ...data, props: { ...data.props, url } })} />
      <ColorInput label="Button color" value={data.props?.buttonColor} onChange={(buttonColor) => setData({ ...data, props: { ...data.props, buttonColor } })} />
      <ColorInput label="Text color" value={data.props?.textColor} onChange={(textColor) => setData({ ...data, props: { ...data.props, textColor } })} />
      <FontSizeInput value={data.props?.fontSize} onChange={(fontSize) => setData({ ...data, props: { ...data.props, fontSize } })} />
      <FontWeightInput value={data.props?.fontWeight} onChange={(fontWeight) => setData({ ...data, props: { ...data.props, fontWeight } })} />
      <TextAlignInput value={data.props?.textAlign} onChange={(textAlign) => setData({ ...data, props: { ...data.props, textAlign } })} />
      <PaddingInput value={data.style?.padding} onChange={(padding) => setData({ ...data, style: { ...data.style, padding } })} />
    </BaseSidebarPanel>
  )
}

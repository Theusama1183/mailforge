import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import SliderInput from './helpers/inputs/SliderInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'padding']

export default function DividerSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Divider">
      <ColorInput label="Line color" value={data.props?.lineColor} onChange={(lineColor) => setData({ ...data, props: { ...data.props, lineColor } })} />
      <SliderInput label="Line height" value={data.props?.lineHeight} onChange={(lineHeight) => setData({ ...data, props: { ...data.props, lineHeight } })} min={1} max={10} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

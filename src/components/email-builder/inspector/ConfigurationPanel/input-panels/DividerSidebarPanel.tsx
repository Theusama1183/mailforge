import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import SliderInput from './helpers/inputs/SliderInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function DividerSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Divider">
      <ColorInput label="Line color" value={data.props?.lineColor} onChange={(lineColor) => setData({ ...data, props: { ...data.props, lineColor } })} />
      <SliderInput label="Line width" value={data.props?.lineWeight} onChange={(lineWeight) => setData({ ...data, props: { ...data.props, lineWeight } })} min={1} max={10} />
      <SingleStylePropertyPanel style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import FontFamilyInput from './helpers/inputs/FontFamily'
import SliderInput from './helpers/inputs/SliderInput'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function EmailLayoutSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Layout">
      <ColorInput label="Backdrop color" value={data.backdropColor} onChange={(backdropColor) => setData({ ...data, backdropColor })} />
      <ColorInput label="Canvas color" value={data.canvasColor} onChange={(canvasColor) => setData({ ...data, canvasColor })} />
      <ColorInput label="Border color" value={data.borderColor} onChange={(borderColor) => setData({ ...data, borderColor })} />
      <ColorInput label="Text color" value={data.textColor} onChange={(textColor) => setData({ ...data, textColor })} />
      <FontFamilyInput value={data.fontFamily} onChange={(fontFamily) => setData({ ...data, fontFamily })} />
      <SliderInput label="Border radius" value={data.borderRadius} onChange={(borderRadius) => setData({ ...data, borderRadius })} min={0} max={40} />
    </BaseSidebarPanel>
  )
}

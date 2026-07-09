import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

export default function MapSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Map">
      <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
        Note: Replace YOUR_API_KEY in the generated URL with your actual Google Maps API key.
      </div>
      <TextInput label="Address label" value={props_.address} onChange={(v) => setData({ ...data, props: { ...props_, address: v } })} />
      <TextInput label="Link URL (default: Google Maps)" value={props_.linkUrl} onChange={(v) => setData({ ...data, props: { ...props_, linkUrl: v } })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput label="Latitude" value={props_.latitude?.toString() ?? ''} onChange={(v) => setData({ ...data, props: { ...props_, latitude: v ? parseFloat(v) : 0 } })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput label="Longitude" value={props_.longitude?.toString() ?? ''} onChange={(v) => setData({ ...data, props: { ...props_, longitude: v ? parseFloat(v) : 0 } })} />
        </div>
      </div>
      <SliderInput label="Zoom" min={1} max={20} value={props_.zoom ?? 14} onChange={(v) => setData({ ...data, props: { ...props_, zoom: v } })} />
      <SliderInput label="Width" min={100} max={1200} value={props_.width ?? 600} onChange={(v) => setData({ ...data, props: { ...props_, width: v } })} />
      <SliderInput label="Height" min={50} max={800} value={props_.height ?? 300} onChange={(v) => setData({ ...data, props: { ...props_, height: v } })} />
      <RadioGroupInput
        label="Map style"
        value={props_.mapStyle ?? 'roadmap'}
        options={[
          { value: 'roadmap', label: 'Roadmap' },
          { value: 'satellite', label: 'Satellite' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'terrain', label: 'Terrain' },
        ]}
        onChange={(v) => setData({ ...data, props: { ...props_, mapStyle: v as any } })}
      />
      <TextInput label="Marker label (first char used)" value={props_.markerLabel} onChange={(v) => setData({ ...data, props: { ...props_, markerLabel: v } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

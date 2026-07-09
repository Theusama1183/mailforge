import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import FontFamilyInput from './helpers/inputs/FontFamily'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import FontWeightInput from './helpers/inputs/FontWeightInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'
import TextDimensionInput from './helpers/inputs/TextDimensionInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

export default function HeaderSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Header / Logo">
      <RadioGroupInput
        label="Layout"
        value={props_.layout ?? 'logo-left'}
        options={[
          { value: 'logo-left', label: 'Logo + Text' },
          { value: 'logo-above', label: 'Logo above text' },
          { value: 'logo-only', label: 'Logo only' },
          { value: 'text-only', label: 'Text only' },
        ]}
        onChange={(layout) => setData({ ...data, props: { ...props_, layout } })}
      />

      {props_.layout !== 'text-only' && (
        <>
          <TextInput label="Logo image URL" value={props_.logoUrl} onChange={(logoUrl) => setData({ ...data, props: { ...props_, logoUrl } })} />
          <TextInput label="Logo alt text" value={props_.logoAlt} onChange={(logoAlt) => setData({ ...data, props: { ...props_, logoAlt } })} />
          <TextDimensionInput label="Logo width" value={props_.logoWidth} onChange={(logoWidth) => setData({ ...data, props: { ...props_, logoWidth } })} />
          <TextDimensionInput label="Logo height (optional)" value={props_.logoHeight} onChange={(logoHeight) => setData({ ...data, props: { ...props_, logoHeight } })} />
        </>
      )}

      {props_.layout !== 'logo-only' && (
        <>
          <TextInput label="Header text" value={props_.text} onChange={(text) => setData({ ...data, props: { ...props_, text } })} />
          <ColorInput label="Text color" value={props_.textColor} onChange={(textColor) => setData({ ...data, props: { ...props_, textColor } })} />
          <FontSizeInput value={props_.fontSize} onChange={(fontSize) => setData({ ...data, props: { ...props_, fontSize } })} />
          <FontFamilyInput value={props_.fontFamily} onChange={(fontFamily) => setData({ ...data, props: { ...props_, fontFamily } })} />
          <FontWeightInput value={props_.fontWeight} onChange={(fontWeight) => setData({ ...data, props: { ...props_, fontWeight } })} />
        </>
      )}

      <TextInput label="Link URL (optional)" value={props_.url} onChange={(url) => setData({ ...data, props: { ...props_, url } })} />

      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

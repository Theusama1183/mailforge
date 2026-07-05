import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'color', 'fontFamily', 'fontWeight', 'textAlign', 'padding', 'borderRadius']

export default function HeadingSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Heading">
      <TextInput label="Heading text" value={data.props?.text} onChange={(text) => setData({ ...data, props: { ...data.props, text } })} />
      <RadioGroupInput
        label="Level"
        value={data.props?.level ?? 'h2'}
        options={[
          { value: 'h1', label: 'H1' },
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
        ]}
        onChange={(level) => setData({ ...data, props: { ...data.props, level } })}
      />
      <FontSizeInput value={data.style?.fontSize} onChange={(fontSize) => setData({ ...data, style: { ...data.style, fontSize } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

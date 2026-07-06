import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'color', 'fontFamily', 'fontWeight', 'textAlign', 'padding', 'borderRadius']

export default function HeadingSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
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
      <FontSizeInput value={style.fontSize} onChange={(fontSize) => setData({ ...data, style: { ...style, fontSize } })} />
      <SliderInput
        label="Line height"
        value={style.lineHeight}
        onChange={(lineHeight) => setData({ ...data, style: { ...style, lineHeight } })}
        min={0.5}
        max={3}
        step={0.1}
      />
      <SliderInput
        label="Letter spacing"
        value={style.letterSpacing}
        onChange={(letterSpacing) => setData({ ...data, style: { ...style, letterSpacing } })}
        min={-2}
        max={10}
        step={0.5}
      />
      <RadioGroupInput
        label="Text transform"
        value={style.textTransform ?? 'none'}
        options={[
          { value: 'none', label: 'None' },
          { value: 'uppercase', label: 'UPPER' },
          { value: 'lowercase', label: 'lower' },
          { value: 'capitalize', label: 'Capitalize' },
        ]}
        onChange={(textTransform) => setData({ ...data, style: { ...style, textTransform } })}
      />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...s } })} />
    </BaseSidebarPanel>
  )
}

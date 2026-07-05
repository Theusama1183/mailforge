import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import TextDimensionInput from './helpers/inputs/TextDimensionInput'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding']

export default function ImageSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Image">
      <TextInput label="Image URL" value={data.props?.url} onChange={(url) => setData({ ...data, props: { ...data.props, url } })} />
      <TextInput label="Alt text" value={data.props?.alt} onChange={(alt) => setData({ ...data, props: { ...data.props, alt } })} />
      <TextInput label="Link URL" value={data.props?.linkHref} onChange={(linkHref) => setData({ ...data, props: { ...data.props, linkHref } })} />
      <TextDimensionInput label="Width" value={data.props?.width} onChange={(width) => setData({ ...data, props: { ...data.props, width } })} />
      <TextDimensionInput label="Height" value={data.props?.height} onChange={(height) => setData({ ...data, props: { ...data.props, height } })} />
      <RadioGroupInput
        label="Content alignment"
        value={data.props?.contentAlignment ?? 'middle'}
        options={[
          { value: 'top', label: 'Top' },
          { value: 'middle', label: 'Middle' },
          { value: 'bottom', label: 'Bottom' },
        ]}
        onChange={(contentAlignment) => setData({ ...data, props: { ...data.props, contentAlignment } })}
      />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

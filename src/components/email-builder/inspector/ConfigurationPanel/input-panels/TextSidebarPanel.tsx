import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import BooleanInput from './helpers/inputs/BooleanInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'color', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']

export default function TextSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Text">
      <TextInput label="Text content" value={data.props?.text} onChange={(text) => setData({ ...data, props: { ...data.props, text } })} multiline rows={6} />
      <BooleanInput label="Markdown" value={data.props?.markdown ?? false} onChange={(markdown) => setData({ ...data, props: { ...data.props, markdown } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

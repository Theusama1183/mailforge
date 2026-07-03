import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function TextSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Text">
      <TextInput label="Text content" value={data.props?.text} onChange={(text) => setData({ ...data, props: { ...data.props, text } })} multiline rows={6} />
      <SingleStylePropertyPanel style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

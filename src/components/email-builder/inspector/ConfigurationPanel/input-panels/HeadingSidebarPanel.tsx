import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function HeadingSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Heading">
      <TextInput label="Heading text" value={data.props?.text} onChange={(text) => setData({ ...data, props: { ...data.props, text } })} />
      <SingleStylePropertyPanel style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

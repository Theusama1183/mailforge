import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function HtmlSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="HTML">
      <TextInput label="HTML contents" value={data.props?.contents} onChange={(contents) => setData({ ...data, props: { ...data.props, contents } })} multiline rows={8} />
      <SingleStylePropertyPanel style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

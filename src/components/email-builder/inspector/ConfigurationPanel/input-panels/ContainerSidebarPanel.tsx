import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'borderColor', 'borderRadius', 'padding']

export default function ContainerSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Container">
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

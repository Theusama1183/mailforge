import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import TextDimensionInput from './helpers/inputs/TextDimensionInput'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function SpacerSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Spacer">
      <TextDimensionInput label="Height" value={data.props?.height} onChange={(height) => setData({ ...data, props: { ...data.props, height } })} />
    </BaseSidebarPanel>
  )
}

import React from 'react'

import { z } from 'zod'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import SliderInput from './helpers/inputs/SliderInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

export default function ColumnsContainerSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Columns">
      <SliderInput
        label="Columns gap"
        value={data.props?.columnsGap}
        onChange={(columnsGap) => setData({ ...data, props: { ...data.props, columnsGap } })}
        min={0}
        max={60}
      />
      <SingleStylePropertyPanel style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

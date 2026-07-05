import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SliderInput from './helpers/inputs/SliderInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'padding']

export default function ColumnsContainerSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Columns">
      <RadioGroupInput
        label="Columns count"
        value={`${data.props?.columnsCount ?? 2}`}
        options={[
          { value: '2', label: '2 columns' },
          { value: '3', label: '3 columns' },
        ]}
        onChange={(columnsCount) => setData({ ...data, props: { ...data.props, columnsCount: parseInt(columnsCount, 10) } })}
      />
      <SliderInput
        label="Columns gap"
        value={data.props?.columnsGap}
        onChange={(columnsGap) => setData({ ...data, props: { ...data.props, columnsGap } })}
        min={0}
        max={60}
      />
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

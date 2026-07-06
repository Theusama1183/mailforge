import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import BooleanInput from './helpers/inputs/BooleanInput'
import ColorInput from './helpers/inputs/ColorInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

export default function CountdownTimerSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}
  const labels = props_.labels ?? {}

  return (
    <BaseSidebarPanel title="Countdown Timer">
      <TextInput
        label="End date (ISO, e.g. 2026-12-31T23:59:59)"
        value={props_.endDate}
        onChange={(endDate) => setData({ ...data, props: { ...props_, endDate } })}
      />
      <TextInput
        label="Text when expired"
        value={props_.endText}
        onChange={(endText) => setData({ ...data, props: { ...props_, endText } })}
      />
      <ColorInput
        label="Digit color"
        value={props_.digitColor}
        onChange={(digitColor) => setData({ ...data, props: { ...props_, digitColor } })}
      />
      <ColorInput
        label="Label color"
        value={props_.labelColor}
        onChange={(labelColor) => setData({ ...data, props: { ...props_, labelColor } })}
      />
      <SliderInput label="Gap between units" value={props_.gap} onChange={(gap) => setData({ ...data, props: { ...props_, gap } })} min={4} max={48} />
      <BooleanInput label="Show labels" value={props_.showLabels ?? true} onChange={(showLabels) => setData({ ...data, props: { ...props_, showLabels } })} />
      <TextInput label="Days label" value={labels.days} onChange={(days) => setData({ ...data, props: { ...props_, labels: { ...labels, days } } })} />
      <TextInput label="Hours label" value={labels.hours} onChange={(hours) => setData({ ...data, props: { ...props_, labels: { ...labels, hours } } })} />
      <TextInput label="Minutes label" value={labels.mins} onChange={(mins) => setData({ ...data, props: { ...props_, labels: { ...labels, mins } } })} />
      <TextInput label="Seconds label" value={labels.secs} onChange={(secs) => setData({ ...data, props: { ...props_, labels: { ...labels, secs } } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

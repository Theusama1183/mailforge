import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import BooleanInput from './helpers/inputs/BooleanInput'
import ColorInput from './helpers/inputs/ColorInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['color', 'textAlign', 'padding']

export default function ProgressBarSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Progress Bar">
      <SliderInput
        label="Percentage"
        value={props_.percentage}
        onChange={(percentage) => setData({ ...data, props: { ...props_, percentage } })}
        min={0}
        max={100}
      />
      <TextInput
        label="Label"
        value={props_.label}
        onChange={(label) => setData({ ...data, props: { ...props_, label } })}
      />
      <BooleanInput
        label="Show percentage"
        value={props_.showPercentage ?? true}
        onChange={(showPercentage) => setData({ ...data, props: { ...props_, showPercentage } })}
      />
      <ColorInput
        label="Bar color"
        value={props_.barColor}
        onChange={(barColor) => setData({ ...data, props: { ...props_, barColor } })}
      />
      <ColorInput
        label="Track color"
        value={props_.trackColor}
        onChange={(trackColor) => setData({ ...data, props: { ...props_, trackColor } })}
      />
      <SliderInput
        label="Height"
        value={props_.height}
        onChange={(height) => setData({ ...data, props: { ...props_, height } })}
        min={4}
        max={40}
      />
      <SliderInput
        label="Border radius"
        value={props_.borderRadius}
        onChange={(borderRadius) => setData({ ...data, props: { ...props_, borderRadius } })}
        min={0}
        max={20}
      />
      <RadioGroupInput
        label="Label position"
        value={props_.labelPosition ?? 'above'}
        options={[
          { value: 'above', label: 'Above' },
          { value: 'below', label: 'Below' },
          { value: 'inside', label: 'Inside' },
          { value: 'none', label: 'None' },
        ]}
        onChange={(labelPosition) => setData({ ...data, props: { ...props_, labelPosition } })}
      />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

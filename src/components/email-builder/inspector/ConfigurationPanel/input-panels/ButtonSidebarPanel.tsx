import React from 'react'

import { z } from 'zod'
import { ButtonPropsSchema } from '@usewaypoint/block-button'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import BooleanInput from './helpers/inputs/BooleanInput'
import ColorInput from './helpers/inputs/ColorInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: z.infer<typeof ButtonPropsSchema>
  setData: (data: z.infer<typeof ButtonPropsSchema>) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']

export default function ButtonSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Button">
      <TextInput label="Button text" value={data.props?.text} onChange={(text) => setData({ ...data, props: { ...data.props, text } })} />
      <TextInput label="URL" value={data.props?.url} onChange={(url) => setData({ ...data, props: { ...data.props, url } })} />
      <ColorInput label="Button background" value={data.props?.buttonBackgroundColor} onChange={(buttonBackgroundColor) => setData({ ...data, props: { ...data.props, buttonBackgroundColor } })} />
      <ColorInput label="Button text color" value={data.props?.buttonTextColor} onChange={(buttonTextColor) => setData({ ...data, props: { ...data.props, buttonTextColor } })} />
      <RadioGroupInput
        label="Size"
        value={data.props?.size ?? 'medium'}
        options={[
          { value: 'x-small', label: 'X-Small' },
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
        onChange={(size) => setData({ ...data, props: { ...data.props, size } })}
      />
      <RadioGroupInput
        label="Style"
        value={data.props?.buttonStyle ?? 'rounded'}
        options={[
          { value: 'rectangle', label: 'Rectangle' },
          { value: 'rounded', label: 'Rounded' },
          { value: 'pill', label: 'Pill' },
        ]}
        onChange={(buttonStyle) => setData({ ...data, props: { ...data.props, buttonStyle } })}
      />
      <BooleanInput label="Full width" value={data.props?.fullWidth ?? false} onChange={(fullWidth) => setData({ ...data, props: { ...data.props, fullWidth } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

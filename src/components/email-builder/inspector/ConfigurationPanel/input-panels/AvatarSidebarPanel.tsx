import React from 'react'

import { z } from 'zod'
import { AvatarPropsSchema } from '@usewaypoint/block-avatar'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import TextDimensionInput from './helpers/inputs/TextDimensionInput'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: z.infer<typeof AvatarPropsSchema>
  setData: (data: z.infer<typeof AvatarPropsSchema>) => void
}

export default function AvatarSidebarPanel({ data, setData }: Props) {
  return (
    <BaseSidebarPanel title="Avatar">
      <TextInput label="Image URL" value={data.props?.imageUrl} onChange={(imageUrl) => setData({ ...data, props: { ...data.props, imageUrl } })} />
      <TextDimensionInput label="Size" value={data.props?.size} onChange={(size) => setData({ ...data, props: { ...data.props, size } })} />
      <RadioGroupInput
        label="Shape"
        value={data.props?.shape ?? 'circle'}
        options={[
          { value: 'circle', label: 'Circle' },
          { value: 'rounded', label: 'Rounded' },
          { value: 'square', label: 'Square' },
        ]}
        onChange={(shape) => setData({ ...data, props: { ...data.props, shape } as any })}
      />
      <SingleStylePropertyPanel style={data.style ?? {}} onChange={(style) => setData({ ...data, style })} />
    </BaseSidebarPanel>
  )
}

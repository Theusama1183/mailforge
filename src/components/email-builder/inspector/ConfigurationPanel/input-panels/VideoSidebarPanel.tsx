import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'
import TextDimensionInput from './helpers/inputs/TextDimensionInput'
import SliderInput from './helpers/inputs/SliderInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding']

export default function VideoSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Video">
      <TextInput
        label="Video URL (YouTube / Vimeo)"
        value={props_.videoUrl}
        onChange={(videoUrl) => setData({ ...data, props: { ...props_, videoUrl } })}
      />
      <TextInput
        label="Custom thumbnail URL (optional)"
        value={props_.thumbnailUrl}
        onChange={(thumbnailUrl) => setData({ ...data, props: { ...props_, thumbnailUrl } })}
      />
      <TextInput
        label="Alt text"
        value={props_.alt}
        onChange={(alt) => setData({ ...data, props: { ...props_, alt } })}
      />
      <TextDimensionInput
        label="Width"
        value={props_.width}
        onChange={(width) => setData({ ...data, props: { ...props_, width } })}
      />
      <SliderInput
        label="Border radius"
        value={props_.borderRadius ?? style.borderRadius}
        onChange={(borderRadius) => setData({ ...data, props: { ...props_, borderRadius } })}
        min={0}
        max={40}
      />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

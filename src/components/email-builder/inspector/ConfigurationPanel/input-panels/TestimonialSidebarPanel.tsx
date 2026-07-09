import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'
import BooleanInput from './helpers/inputs/BooleanInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

export default function TestimonialSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Testimonial">
      <TextInput label="Quote" value={props_.quote} onChange={(v) => setData({ ...data, props: { ...props_, quote: v } })} />
      <TextInput label="Author" value={props_.author} onChange={(v) => setData({ ...data, props: { ...props_, author: v } })} />
      <TextInput label="Author title" value={props_.title} onChange={(v) => setData({ ...data, props: { ...props_, title: v } })} />
      <TextInput label="Avatar URL" value={props_.avatarUrl} onChange={(v) => setData({ ...data, props: { ...props_, avatarUrl: v } })} />
      <BooleanInput label="Show stars" value={props_.showStars} onChange={(v) => setData({ ...data, props: { ...props_, showStars: v } })} />
      {props_.showStars !== false && (
        <SliderInput label="Star rating (0-5)" min={0} max={5} value={props_.starRating ?? 5} onChange={(v) => setData({ ...data, props: { ...props_, starRating: v } })} />
      )}
      <BooleanInput label="Show quote mark" value={props_.showQuoteMark} onChange={(v) => setData({ ...data, props: { ...props_, showQuoteMark: v } })} />
      <FontSizeInput value={props_.fontSize} onChange={(v) => setData({ ...data, props: { ...props_, fontSize: v } })} />
      <ColorInput label="Quote color" value={props_.quoteColor} onChange={(v) => setData({ ...data, props: { ...props_, quoteColor: v } })} />
      <ColorInput label="Author color" value={props_.authorColor} onChange={(v) => setData({ ...data, props: { ...props_, authorColor: v } })} />
      <ColorInput label="Title color" value={props_.titleColor} onChange={(v) => setData({ ...data, props: { ...props_, titleColor: v } })} />
      <ColorInput label="Card background" value={props_.backgroundColor} onChange={(v) => setData({ ...data, props: { ...props_, backgroundColor: v } })} />
      <ColorInput label="Border color" value={props_.borderColor} onChange={(v) => setData({ ...data, props: { ...props_, borderColor: v } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

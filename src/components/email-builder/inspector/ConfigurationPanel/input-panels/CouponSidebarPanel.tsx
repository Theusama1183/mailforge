import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'
import BooleanInput from './helpers/inputs/BooleanInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

export default function CouponSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Coupon / Discount">
      <TextInput label="Discount text (e.g. 20% OFF)" value={props_.discount} onChange={(v) => setData({ ...data, props: { ...props_, discount: v } })} />
      <TextInput label="Description" value={props_.description} onChange={(v) => setData({ ...data, props: { ...props_, description: v } })} />
      <TextInput label="Coupon code" value={props_.code} onChange={(v) => setData({ ...data, props: { ...props_, code: v } })} />
      <TextInput label="Expiry text" value={props_.expiry} onChange={(v) => setData({ ...data, props: { ...props_, expiry: v } })} />
      <TextInput label="Disclaimer" value={props_.disclaimer} onChange={(v) => setData({ ...data, props: { ...props_, disclaimer: v } })} />
      <ColorInput label="Coupon background" value={props_.couponColor} onChange={(v) => setData({ ...data, props: { ...props_, couponColor: v } })} />
      <ColorInput label="Text color" value={props_.textColor} onChange={(v) => setData({ ...data, props: { ...props_, textColor: v } })} />
      <BooleanInput label="Show dashed border" value={props_.showDashedBorder} onChange={(v) => setData({ ...data, props: { ...props_, showDashedBorder: v } })} />
      <TextInput label="Button text (optional)" value={props_.buttonText} onChange={(v) => setData({ ...data, props: { ...props_, buttonText: v } })} />
      {props_.buttonText && (
        <>
          <TextInput label="Button URL" value={props_.buttonUrl} onChange={(v) => setData({ ...data, props: { ...props_, buttonUrl: v } })} />
          <ColorInput label="Button color" value={props_.buttonColor} onChange={(v) => setData({ ...data, props: { ...props_, buttonColor: v } })} />
        </>
      )}
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

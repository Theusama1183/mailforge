import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'
import BooleanInput from './helpers/inputs/BooleanInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

export default function FooterSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Footer">
      <TextInput label="Copyright text" value={props_.copyright} onChange={(v) => setData({ ...data, props: { ...props_, copyright: v } })} />
      <TextInput label="Address" value={props_.address} onChange={(v) => setData({ ...data, props: { ...props_, address: v } })} />
      <FontSizeInput value={props_.fontSize} onChange={(v) => setData({ ...data, props: { ...props_, fontSize: v } })} />
      <ColorInput label="Text color" value={props_.textColor} onChange={(v) => setData({ ...data, props: { ...props_, textColor: v } })} />
      <ColorInput label="Link color" value={props_.linkColor} onChange={(v) => setData({ ...data, props: { ...props_, linkColor: v } })} />
      <BooleanInput label="Show unsubscribe" value={props_.showUnsubscribe} onChange={(v) => setData({ ...data, props: { ...props_, showUnsubscribe: v } })} />
      {props_.showUnsubscribe !== false && (
        <TextInput label="Unsubscribe text" value={props_.unsubscribeText} onChange={(v) => setData({ ...data, props: { ...props_, unsubscribeText: v } })} />
      )}
      <BooleanInput label="Show social icons" value={props_.showSocialIcons} onChange={(v) => setData({ ...data, props: { ...props_, showSocialIcons: v } })} />
      {props_.showSocialIcons && (
        <>
          <TextInput label="Facebook URL" value={props_.facebook} onChange={(v) => setData({ ...data, props: { ...props_, facebook: v } })} />
          <TextInput label="Twitter URL" value={props_.twitter} onChange={(v) => setData({ ...data, props: { ...props_, twitter: v } })} />
          <TextInput label="Instagram URL" value={props_.instagram} onChange={(v) => setData({ ...data, props: { ...props_, instagram: v } })} />
          <TextInput label="LinkedIn URL" value={props_.linkedin} onChange={(v) => setData({ ...data, props: { ...props_, linkedin: v } })} />
        </>
      )}
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

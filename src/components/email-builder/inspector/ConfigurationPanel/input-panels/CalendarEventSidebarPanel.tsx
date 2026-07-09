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

export default function CalendarEventSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Calendar Event">
      <TextInput label="Event title" value={props_.title} onChange={(v) => setData({ ...data, props: { ...props_, title: v } })} />
      <TextInput label="Description" value={props_.description} onChange={(v) => setData({ ...data, props: { ...props_, description: v } })} />
      <TextInput label="Location" value={props_.location} onChange={(v) => setData({ ...data, props: { ...props_, location: v } })} />

      <BooleanInput label="Show date badge" value={props_.showDateBadge} onChange={(v) => setData({ ...data, props: { ...props_, showDateBadge: v } })} />
      {props_.showDateBadge !== false && (
        <>
          <TextInput label="Month (e.g. Jan)" value={props_.monthName} onChange={(v) => setData({ ...data, props: { ...props_, monthName: v } })} />
          <TextInput label="Date number (e.g. 15)" value={props_.dateNumber} onChange={(v) => setData({ ...data, props: { ...props_, dateNumber: v } })} />
          <TextInput label="Day of week (e.g. Mon)" value={props_.dayOfWeek} onChange={(v) => setData({ ...data, props: { ...props_, dayOfWeek: v } })} />
        </>
      )}

      <TextInput label="Date text (e.g. Jan 15, 2026)" value={props_.date} onChange={(v) => setData({ ...data, props: { ...props_, date: v } })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput label="Start time" value={props_.time} onChange={(v) => setData({ ...data, props: { ...props_, time: v } })} />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput label="End time" value={props_.endTime} onChange={(v) => setData({ ...data, props: { ...props_, endTime: v } })} />
        </div>
      </div>

      <TextInput label="CTA text" value={props_.ctaText} onChange={(v) => setData({ ...data, props: { ...props_, ctaText: v } })} />
      {props_.ctaText && (
        <TextInput label="CTA URL" value={props_.ctaUrl} onChange={(v) => setData({ ...data, props: { ...props_, ctaUrl: v } })} />
      )}
      <ColorInput label="Accent color" value={props_.accentColor} onChange={(v) => setData({ ...data, props: { ...props_, accentColor: v } })} />
      <ColorInput label="Text color" value={props_.textColor} onChange={(v) => setData({ ...data, props: { ...props_, textColor: v } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

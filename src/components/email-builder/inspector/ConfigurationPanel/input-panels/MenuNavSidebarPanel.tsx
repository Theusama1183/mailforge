import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import FontSizeInput from './helpers/inputs/FontSizeInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import TextInput from './helpers/inputs/TextInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

function LinksEditor({ links, onChange }: { links: any[]; onChange: (links: any[]) => void }) {
  const add = () => onChange([...(links || []), { label: 'Link', url: 'https://' }])
  const remove = (i: number) => onChange((links || []).filter((_, idx) => idx !== i))
  const update = (i: number, field: string, val: string) => {
    const next = [...(links || [])]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>LINKS</div>
      {(links || []).map((link, i) => (
        <div key={i} style={{ marginBottom: 8, padding: 8, border: '1px solid #E5E7EB', borderRadius: 6 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <input
              style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }}
              value={link.label || ''}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="Label"
            />
            <button
              style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #EF4444', borderRadius: 4, color: '#EF4444', background: 'white', cursor: 'pointer' }}
              onClick={() => remove(i)}
            >
              X
            </button>
          </div>
          <input
            style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }}
            value={link.url || ''}
            onChange={(e) => update(i, 'url', e.target.value)}
            placeholder="https://..."
          />
        </div>
      ))}
      <button
        style={{ padding: '6px 12px', fontSize: 13, border: '1px dashed #3B82F6', borderRadius: 4, color: '#3B82F6', background: 'white', cursor: 'pointer', width: '100%' }}
        onClick={add}
      >
        + Add Link
      </button>
    </div>
  )
}

export default function MenuNavSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Menu / Nav Bar">
      <LinksEditor links={props_.links} onChange={(links) => setData({ ...data, props: { ...props_, links } })} />
      <RadioGroupInput
        label="Layout"
        value={props_.layout ?? 'horizontal'}
        options={[
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' },
        ]}
        onChange={(layout) => setData({ ...data, props: { ...props_, layout } })}
      />
      <RadioGroupInput
        label="Alignment"
        value={props_.alignment ?? 'center'}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
        onChange={(alignment) => setData({ ...data, props: { ...props_, alignment } })}
      />
      <FontSizeInput value={props_.fontSize} onChange={(v) => setData({ ...data, props: { ...props_, fontSize: v } })} />
      <ColorInput label="Link color" value={props_.linkColor} onChange={(v) => setData({ ...data, props: { ...props_, linkColor: v } })} />
      <RadioGroupInput
        label="Separator"
        value={props_.separator ?? 'none'}
        options={[
          { value: 'none', label: 'None' },
          { value: 'dot', label: 'Dot' },
          { value: 'line', label: 'Line' },
          { value: 'chevron', label: 'Chevron' },
        ]}
        onChange={(separator) => setData({ ...data, props: { ...props_, separator } })}
      />
      {props_.separator && props_.separator !== 'none' && (
        <ColorInput label="Separator color" value={props_.separatorColor} onChange={(v) => setData({ ...data, props: { ...props_, separatorColor: v } })} />
      )}
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

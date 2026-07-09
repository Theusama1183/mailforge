import React from 'react'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'
import SliderInput from './helpers/inputs/SliderInput'
import BooleanInput from './helpers/inputs/BooleanInput'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['backgroundColor', 'textAlign', 'padding', 'borderRadius']

function PlanEditor({ plans, onChange }: { plans: any[]; onChange: (plans: any[]) => void }) {
  const add = () => onChange([...(plans || []), { name: 'Plan', price: '19', currency: '$', period: 'mo', description: '', features: [{ text: 'Feature 1', included: true }, { text: 'Feature 2', included: true }], ctaText: 'Choose Plan', ctaUrl: 'https://', highlighted: false }])
  const remove = (i: number) => onChange((plans || []).filter((_, idx) => idx !== i))
  const update = (i: number, field: string, val: any) => {
    const next = [...(plans || [])]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  const addFeature = (pi: number) => {
    const next = [...(plans || [])]
    next[pi] = { ...next[pi], features: [...(next[pi].features || []), { text: 'New feature', included: true }] }
    onChange(next)
  }
  const updateFeature = (pi: number, fi: number, field: string, val: string | boolean) => {
    const next = [...(plans || [])]
    const features = [...(next[pi].features || [])]
    features[fi] = { ...features[fi], [field]: val }
    next[pi] = { ...next[pi], features }
    onChange(next)
  }
  const removeFeature = (pi: number, fi: number) => {
    const next = [...(plans || [])]
    next[pi] = { ...next[pi], features: (next[pi].features || []).filter((_: any, idx: number) => idx !== fi) }
    onChange(next)
  }
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>PLANS</div>
      {(plans || []).map((plan, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 8, border: plan.highlighted ? '2px solid #3B82F6' : '1px solid #E5E7EB', borderRadius: 6 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{plan.name || `Plan ${i + 1}`}</span>
            <label style={{ fontSize: 11, marginLeft: 8 }}>
              <input type="checkbox" checked={!!plan.highlighted} onChange={(e) => update(i, 'highlighted', e.target.checked)} /> Highlighted
            </label>
            <div style={{ flex: 1 }} />
            <button
              style={{ padding: '2px 6px', fontSize: 11, border: '1px solid #EF4444', borderRadius: 4, color: '#EF4444', background: 'white', cursor: 'pointer' }}
              onClick={() => remove(i)}
            >
              X
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <input style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.name || ''} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Plan name" />
              <input style={{ width: 60, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.price || ''} onChange={(e) => update(i, 'price', e.target.value)} placeholder="Price" />
              <input style={{ width: 40, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.currency || '$'} onChange={(e) => update(i, 'currency', e.target.value)} placeholder="$" />
              <input style={{ width: 50, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.period || ''} onChange={(e) => update(i, 'period', e.target.value)} placeholder="mo" />
            </div>
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.description || ''} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Description" />
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.ctaText || ''} onChange={(e) => update(i, 'ctaText', e.target.value)} placeholder="CTA text" />
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.ctaUrl || ''} onChange={(e) => update(i, 'ctaUrl', e.target.value)} placeholder="CTA URL" />
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={plan.accentColor || ''} onChange={(e) => update(i, 'accentColor', e.target.value)} placeholder="Accent color (hex)" />
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Features:</div>
            {(plan.features || []).map((feat: any, fi: number) => (
              <div key={fi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={feat.included !== false}
                  onChange={(e) => updateFeature(i, fi, 'included', e.target.checked)}
                  style={{ margin: 0 }}
                />
                <input
                  style={{ flex: 1, padding: '3px 6px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 4 }}
                  value={feat.text || ''}
                  onChange={(e) => updateFeature(i, fi, 'text', e.target.value)}
                  placeholder="Feature"
                />
                <button
                  style={{ padding: '2px 4px', fontSize: 10, border: '1px solid #EF4444', borderRadius: 4, color: '#EF4444', background: 'white', cursor: 'pointer' }}
                  onClick={() => removeFeature(i, fi)}
                >
                  X
                </button>
              </div>
            ))}
            <button
              style={{ padding: '3px 8px', fontSize: 11, border: '1px dashed #3B82F6', borderRadius: 4, color: '#3B82F6', background: 'white', cursor: 'pointer' }}
              onClick={() => addFeature(i)}
            >
              + Feature
            </button>
          </div>
        </div>
      ))}
      <button
        style={{ padding: '6px 12px', fontSize: 13, border: '1px dashed #3B82F6', borderRadius: 4, color: '#3B82F6', background: 'white', cursor: 'pointer', width: '100%' }}
        onClick={add}
      >
        + Add Plan
      </button>
    </div>
  )
}

export default function PricingTableSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Pricing Table">
      <PlanEditor plans={props_.plans} onChange={(plans) => setData({ ...data, props: { ...props_, plans } })} />
      <SliderInput label="Gap" min={4} max={48} value={props_.gap ?? 12} onChange={(v) => setData({ ...data, props: { ...props_, gap: v } })} />
      <BooleanInput label="Show features" value={props_.showFeatures} onChange={(v) => setData({ ...data, props: { ...props_, showFeatures: v } })} />
      <ColorInput label="Button color" value={props_.buttonColor} onChange={(v) => setData({ ...data, props: { ...props_, buttonColor: v } })} />
      <ColorInput label="Button text color" value={props_.buttonTextColor} onChange={(v) => setData({ ...data, props: { ...props_, buttonTextColor: v } })} />
      <ColorInput label="Card background" value={props_.cardBackgroundColor} onChange={(v) => setData({ ...data, props: { ...props_, cardBackgroundColor: v } })} />
      <ColorInput label="Header background" value={props_.headerBackgroundColor} onChange={(v) => setData({ ...data, props: { ...props_, headerBackgroundColor: v } })} />
      <ColorInput label="Header text color" value={props_.headerTextColor} onChange={(v) => setData({ ...data, props: { ...props_, headerTextColor: v } })} />
      <ColorInput label="Price color" value={props_.priceColor} onChange={(v) => setData({ ...data, props: { ...props_, priceColor: v } })} />
      <SliderInput label="Card border radius" min={0} max={24} value={props_.cardBorderRadius ?? 12} onChange={(v) => setData({ ...data, props: { ...props_, cardBorderRadius: v } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

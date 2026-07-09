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

function ProductEditor({ products, onChange }: { products: any[]; onChange: (products: any[]) => void }) {
  const add = () => onChange([...(products || []), { imageUrl: 'https://placehold.co/400x300/F8F8F8/CCC?text=Product', title: 'New Product', price: '$19.99', ctaText: 'Shop Now', ctaUrl: 'https://' }])
  const remove = (i: number) => onChange((products || []).filter((_, idx) => idx !== i))
  const update = (i: number, field: string, val: string) => {
    const next = [...(products || [])]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>PRODUCTS</div>
      {(products || []).map((p, i) => (
        <div key={i} style={{ marginBottom: 8, padding: 8, border: '1px solid #E5E7EB', borderRadius: 6 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Product {i + 1}</span>
            <div style={{ flex: 1 }} />
            <button
              style={{ padding: '2px 6px', fontSize: 11, border: '1px solid #EF4444', borderRadius: 4, color: '#EF4444', background: 'white', cursor: 'pointer' }}
              onClick={() => remove(i)}
            >
              X
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={p.imageUrl || ''} onChange={(e) => update(i, 'imageUrl', e.target.value)} placeholder="Image URL" />
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={p.title || ''} onChange={(e) => update(i, 'title', e.target.value)} placeholder="Title" />
            <div style={{ display: 'flex', gap: 4 }}>
              <input style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={p.price || ''} onChange={(e) => update(i, 'price', e.target.value)} placeholder="Price" />
              <input style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={p.originalPrice || ''} onChange={(e) => update(i, 'originalPrice', e.target.value)} placeholder="Orig. price" />
            </div>
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={p.ctaText || ''} onChange={(e) => update(i, 'ctaText', e.target.value)} placeholder="Button text" />
            <input style={{ padding: '4px 8px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 4 }} value={p.ctaUrl || ''} onChange={(e) => update(i, 'ctaUrl', e.target.value)} placeholder="Button URL" />
          </div>
        </div>
      ))}
      <button
        style={{ padding: '6px 12px', fontSize: 13, border: '1px dashed #3B82F6', borderRadius: 4, color: '#3B82F6', background: 'white', cursor: 'pointer', width: '100%' }}
        onClick={add}
      >
        + Add Product
      </button>
    </div>
  )
}

export default function ProductGridSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}

  return (
    <BaseSidebarPanel title="Product Grid">
      <ProductEditor products={props_.products} onChange={(products) => setData({ ...data, props: { ...props_, products } })} />
      <RadioGroupInput
        label="Columns"
        value={props_.columns ?? '2'}
        options={[
          { value: '2', label: '2 columns' },
          { value: '3', label: '3 columns' },
        ]}
        onChange={(columns) => setData({ ...data, props: { ...props_, columns: columns as any } })}
      />
      <SliderInput label="Gap" min={4} max={48} value={props_.gap ?? 16} onChange={(v) => setData({ ...data, props: { ...props_, gap: v } })} />
      <BooleanInput label="Show prices" value={props_.showPrice} onChange={(v) => setData({ ...data, props: { ...props_, showPrice: v } })} />
      <ColorInput label="Button color" value={props_.buttonColor} onChange={(v) => setData({ ...data, props: { ...props_, buttonColor: v } })} />
      <ColorInput label="Button text color" value={props_.buttonTextColor} onChange={(v) => setData({ ...data, props: { ...props_, buttonTextColor: v } })} />
      <ColorInput label="Card background" value={props_.cardBackgroundColor} onChange={(v) => setData({ ...data, props: { ...props_, cardBackgroundColor: v } })} />
      <ColorInput label="Title color" value={props_.titleColor} onChange={(v) => setData({ ...data, props: { ...props_, titleColor: v } })} />
      <ColorInput label="Price color" value={props_.priceColor} onChange={(v) => setData({ ...data, props: { ...props_, priceColor: v } })} />
      <SliderInput label="Border radius" min={0} max={24} value={props_.borderRadiusSize ?? 8} onChange={(v) => setData({ ...data, props: { ...props_, borderRadiusSize: v } })} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}

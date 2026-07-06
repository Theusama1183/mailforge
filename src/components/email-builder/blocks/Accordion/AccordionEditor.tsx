import React from 'react'

import { AccordionProps } from './AccordionPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function AccordionEditor({ style, props: p }: AccordionProps) {
  const items = p?.items?.filter(Boolean) ?? []
  const titleColor = p?.titleColor ?? '#111827'
  const contentColor = p?.contentColor ?? '#6B7280'
  const borderColor = p?.borderColor ?? '#E5E7EB'
  const borderRadius = p?.borderRadius ?? 8
  const gap = p?.gap ?? 4
  const backgroundColor = p?.backgroundColor ?? '#FFFFFF'

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'left',
    padding: getPadding(style?.padding),
  }

  if (items.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ color: '#9CA3AF', fontSize: 14, fontStyle: 'italic' }}>
          Add FAQ items in the sidebar
        </div>
      </div>
    )
  }

  const accordionWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap,
  }

  return (
    <div style={containerStyle}>
      <div style={accordionWrapperStyle}>
        {items.map((item, i) => {
          const detailsStyle: React.CSSProperties = {
            backgroundColor,
            border: `1px solid ${borderColor}`,
            borderRadius,
            overflow: 'hidden',
          }
          const summaryStyle: React.CSSProperties = {
            padding: '12px 16px',
            fontWeight: 600,
            fontSize: 15,
            color: titleColor,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
          }
          const contentStyle: React.CSSProperties = {
            padding: '0 16px 12px',
            fontSize: 14,
            color: contentColor,
            lineHeight: 1.6,
          }
          return (
            <div key={i} style={detailsStyle}>
              <div style={summaryStyle}>
                <span>{item.title || `Item ${i + 1}`}</span>
                <span style={{ fontSize: 12, color: borderColor }}>{item.open ? '−' : '+'}</span>
              </div>
              {item.open && (
                <div style={contentStyle}>
                  {item.content || 'Content goes here...'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

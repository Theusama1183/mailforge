import React from 'react'

import { MenuNavProps } from './MenuNavPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

const SEPARATORS: Record<string, string> = {
  dot: '\u00B7',
  line: '|',
  chevron: '\u203A',
}

export default function MenuNavEditor({ style, props }: MenuNavProps) {
  const links = props?.links ?? []
  const alignment = props?.alignment ?? 'center'
  const layout = props?.layout ?? 'horizontal'
  const fontSize = props?.fontSize ?? 14
  const linkColor = props?.linkColor ?? '#374151'
  const separator = props?.separator ?? 'none'
  const separatorStr = SEPARATORS[separator ?? 'none'] || ''
  const separatorColor = props?.separatorColor ?? '#D1D5DB'

  return (
    <div
      style={{
        textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
        padding: getPadding(style?.padding),
        backgroundColor: style?.backgroundColor ?? undefined,
        borderRadius: style?.borderRadius ?? undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: layout === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
          gap: layout === 'vertical' ? 8 : 0,
          flexWrap: 'wrap',
        }}
      >
        {links.map((link, i) => (
          <React.Fragment key={i}>
            {i > 0 && separator !== 'none' && layout !== 'vertical' && (
              <span style={{ color: separatorColor, padding: '0 10px', fontSize }}>{separatorStr}</span>
            )}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: linkColor,
                fontSize,
                textDecoration: 'none',
                padding: layout === 'vertical' ? '2px 0' : '4px 10px',
                display: 'inline-block',
              }}
            >
              {link.label || `Link ${i + 1}`}
            </a>
            {i > 0 && separator !== 'none' && layout === 'vertical' && (
              <div style={{ borderTop: `1px solid ${separatorColor}`, width: '100%', margin: '4px 0' }} />
            )}
          </React.Fragment>
        ))}
        {links.length === 0 && (
          <span style={{ color: '#9CA3AF', fontSize, fontStyle: 'italic' }}>Add navigation links</span>
        )}
      </div>
    </div>
  )
}

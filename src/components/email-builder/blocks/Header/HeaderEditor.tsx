import React from 'react'

import { HeaderProps } from './HeaderPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

function getFontFamily(fontFamily: string | null | undefined): string | undefined {
  switch (fontFamily) {
    case 'MODERN_SANS': return '"Helvetica Neue", "Arial Nova", Arial, sans-serif'
    case 'BOOK_SANS': return 'Optima, Candara, "Noto Sans", sans-serif'
    case 'ORGANIC_SANS': return 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, sans-serif'
    case 'GEOMETRIC_SANS': return 'Avenir, Montserrat, Corbel, sans-serif'
    case 'HEAVY_SANS': return 'Bahnschrift, "Franklin Gothic Medium", sans-serif'
    case 'ROUNDED_SANS': return 'ui-rounded, Quicksand, Comfortaa, sans-serif'
    case 'MODERN_SERIF': return 'Charter, "Bitstream Charter", Cambria, serif'
    case 'BOOK_SERIF': return '"Iowan Old Style", "Palatino Linotype", serif'
    case 'MONOSPACE': return '"Courier New", "Cutive Mono", monospace'
  }
  return undefined
}

const DEFAULT_LOGO = 'https://placehold.co/200x60/3B82F6/FFFFFF?text=Logo'

export default function HeaderEditor({ style, props }: HeaderProps) {
  const logoUrl = props?.logoUrl || DEFAULT_LOGO
  const logoAlt = props?.logoAlt ?? 'Logo'
  const logoWidth = props?.logoWidth ?? 200
  const logoHeight = props?.logoHeight
  const text = props?.text ?? ''
  const url = props?.url
  const layout = props?.layout ?? 'logo-left'
  const textColor = props?.textColor ?? '#111827'
  const fontSize = props?.fontSize ?? 24
  const fontFamily = getFontFamily(props?.fontFamily)
  const fontWeight = props?.fontWeight ?? 'bold'

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
    borderRadius: style?.borderRadius ?? undefined,
  }

  const logoImg = (
    <img
      src={logoUrl}
      alt={logoAlt}
      width={logoWidth}
      height={logoHeight ?? undefined}
      style={{ display: 'block', maxWidth: '100%', height: logoHeight ?? 'auto' }}
    />
  )

  const textEl = text ? (
    <span style={{ color: textColor, fontSize, fontWeight, fontFamily, lineHeight: 1.2 }}>
      {text}
    </span>
  ) : null

  const innerContent = () => {
    if (textOnly(layout)) {
      return textEl || <span style={{ color: '#9CA3AF', fontSize: 24, fontStyle: 'italic' }}>Header text</span>
    }
    if (logoOnly(layout)) {
      return logoImg
    }
    if (layout === 'logo-above') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {logoImg}
          {textEl}
        </div>
      )
    }
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        {logoImg}
        {textEl}
      </div>
    )
  }

  const content = <>{innerContent()}</>

  return (
    <div style={containerStyle}>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-block' }}>
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}

function textOnly(layout: string | null | undefined): boolean {
  return layout === 'text-only'
}

function logoOnly(layout: string | null | undefined): boolean {
  return layout === 'logo-only'
}

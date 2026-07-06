import React from 'react'

import { HeadingBlockProps } from './HeadingBlockPropsSchema'

function getFontFamily(fontFamily: string | null | undefined): string | undefined {
  switch (fontFamily) {
    case 'MODERN_SANS':
      return '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif'
    case 'BOOK_SANS':
      return 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif'
    case 'ORGANIC_SANS':
      return 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif'
    case 'GEOMETRIC_SANS':
      return 'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif'
    case 'HEAVY_SANS':
      return 'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif'
    case 'ROUNDED_SANS':
      return 'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif'
    case 'MODERN_SERIF':
      return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif'
    case 'BOOK_SERIF':
      return '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif'
    case 'MONOSPACE':
      return '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace'
  }
  return undefined
}

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

function getFontSize(level: string): number {
  switch (level) {
    case 'h1':
      return 32
    case 'h2':
      return 24
    case 'h3':
      return 20
    default:
      return 24
  }
}

export default function HeadingBlockEditor({ style, props }: HeadingBlockProps) {
  const level = props?.level ?? 'h2'
  const text = props?.text ?? ''
  const fontSize = style?.fontSize ?? getFontSize(level)
  const hStyle: React.CSSProperties = {
    color: style?.color ?? undefined,
    backgroundColor: style?.backgroundColor ?? undefined,
    fontWeight: style?.fontWeight ?? 'bold',
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? undefined,
    margin: 0,
    fontFamily: getFontFamily(style?.fontFamily),
    fontSize,
    padding: getPadding(style?.padding),
    borderRadius: style?.borderRadius ?? undefined,
    lineHeight: style?.lineHeight ?? undefined,
    letterSpacing: style?.letterSpacing != null ? `${style.letterSpacing}px` : undefined,
    textTransform: (style?.textTransform as React.CSSProperties['textTransform']) ?? undefined,
  }

  const Tag = level as 'h1' | 'h2' | 'h3'
  return <Tag style={hStyle}>{text || 'Heading'}</Tag>
}

import React from 'react'

import { ButtonGroupProps } from './ButtonGroupPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  if (!padding) return undefined
  return `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
}

const DEFAULT_BUTTONS: { text: string; url: string; leftIcon?: string; rightIcon?: string }[] = [
  { text: 'Get Started', url: 'https://example.com' },
  { text: 'Learn More', url: 'https://example.com' },
]

export default function ButtonGroupEditor({ style, props }: ButtonGroupProps) {
  const buttons = props?.buttons ?? DEFAULT_BUTTONS
  const alignment = props?.alignment ?? 'horizontal'
  const gap = style?.gap ?? 12
  const bgColor = style?.buttonBackgroundColor ?? '#3B82F6'
  const textColor = style?.buttonTextColor ?? '#FFFFFF'
  const borderRadius = style?.buttonBorderRadius ?? 6
  const fontSize = style?.buttonFontSize ?? 14
  const btnPadding = style?.buttonPadding ?? { top: 12, bottom: 12, right: 24, left: 24 }
  const fullWidth = style?.fullWidth ?? false
  const btnBorderWidth = style?.buttonBorderWidth ?? 0
  const btnBorderColor = style?.buttonBorderColor

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
    padding: getPadding(style?.padding),
  }

  const flexStyle: React.CSSProperties = {
    display: alignment === 'horizontal' ? 'inline-flex' : 'flex',
    flexDirection: alignment === 'horizontal' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap,
    width: fullWidth ? '100%' : undefined,
  }

  return (
    <div style={containerStyle}>
      <div style={flexStyle}>
        {buttons.map((btn, i) => (
          <a
            key={i}
            href={btn.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: bgColor,
              color: textColor,
              borderRadius,
              fontSize,
              fontWeight: 600,
              padding: getPadding(btnPadding),
              textDecoration: 'none',
              textAlign: 'center',
              width: fullWidth ? '100%' : undefined,
              border: btnBorderWidth && btnBorderColor ? `${btnBorderWidth}px solid ${btnBorderColor}` : undefined,
            }}
          >
            {btn.leftIcon && <span style={{ marginRight: 6 }}>{btn.leftIcon}</span>}
            {btn.text || 'Button'}
            {btn.rightIcon && <span style={{ marginLeft: 6 }}>{btn.rightIcon}</span>}
          </a>
        ))}
      </div>
    </div>
  )
}

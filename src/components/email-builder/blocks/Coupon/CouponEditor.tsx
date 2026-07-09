import React from 'react'

import { CouponProps } from './CouponPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function CouponEditor({ style, props }: CouponProps) {
  const code = props?.code ?? 'SAVE20'
  const discount = props?.discount ?? '20% OFF'
  const description = props?.description ?? 'Your coupon description here'
  const expiry = props?.expiry ?? 'Expires Dec 31, 2026'
  const disclaimer = props?.disclaimer ?? ''
  const couponColor = props?.couponColor ?? '#FEF2F2'
  const textColor = props?.textColor ?? '#111827'
  const buttonText = props?.buttonText ?? ''
  const buttonUrl = props?.buttonUrl ?? ''
  const buttonColor = props?.buttonColor ?? '#3B82F6'
  const showDashedBorder = props?.showDashedBorder ?? true

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
          backgroundColor: couponColor,
          borderRadius: 12,
          padding: 24,
          border: showDashedBorder ? `2px dashed ${textColor}40` : 'none',
          borderColor: `${textColor}40`,
        }}
      >
        {discount && (
          <div style={{ fontSize: 32, fontWeight: 800, color: textColor, lineHeight: 1.2, marginBottom: 4 }}>
            {discount}
          </div>
        )}
        <div style={{ fontSize: 14, color: textColor, opacity: 0.7, marginBottom: 12 }}>
          {description}
        </div>
        {code && (
          <div
            style={{
              display: 'inline-block',
              backgroundColor: textColor,
              color: couponColor,
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'monospace',
              padding: '8px 24px',
              borderRadius: 6,
              letterSpacing: 4,
              marginBottom: 12,
            }}
          >
            {code}
          </div>
        )}
        {expiry && (
          <div style={{ fontSize: 12, color: textColor, opacity: 0.6, marginBottom: disclaimer ? 4 : 0 }}>
            {expiry}
          </div>
        )}
        {disclaimer && (
          <div style={{ fontSize: 11, color: textColor, opacity: 0.5, marginBottom: 0 }}>
            {disclaimer}
          </div>
        )}
        {buttonText && buttonUrl && (
          <div style={{ marginTop: 16 }}>
            <a
              href={buttonUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                backgroundColor: buttonColor,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 24px',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              {buttonText}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

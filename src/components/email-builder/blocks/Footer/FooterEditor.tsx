import React from 'react'

import { FooterProps } from './FooterPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function FooterEditor({ style, props }: FooterProps) {
  const copyright = props?.copyright ?? ''
  const showUnsubscribe = props?.showUnsubscribe ?? true
  const unsubscribeText = props?.unsubscribeText ?? 'Unsubscribe'
  const address = props?.address ?? ''
  const showSocialIcons = props?.showSocialIcons ?? false
  const facebook = props?.facebook ?? ''
  const twitter = props?.twitter ?? ''
  const instagram = props?.instagram ?? ''
  const linkedin = props?.linkedin ?? ''
  const fontSize = props?.fontSize ?? 12
  const textColor = props?.textColor ?? '#6B7280'
  const linkColor = props?.linkColor ?? '#3B82F6'

  const separator = (
    <div style={{ borderTop: '1px solid #E5E7EB' }} />
  )

  const socialLinks = []
  if (facebook) socialLinks.push({ label: 'Facebook', url: facebook })
  if (twitter) socialLinks.push({ label: 'Twitter', url: twitter })
  if (instagram) socialLinks.push({ label: 'Instagram', url: instagram })
  if (linkedin) socialLinks.push({ label: 'LinkedIn', url: linkedin })

  return (
    <div
      style={{
        textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
        padding: getPadding(style?.padding),
        backgroundColor: style?.backgroundColor ?? undefined,
        borderRadius: style?.borderRadius ?? undefined,
      }}
    >
      {separator}
      <div style={{ padding: '16px 0', fontSize, color: textColor, lineHeight: 1.6 }}>
        {copyright && <div style={{ marginBottom: 8 }}>{copyright}</div>}
        {address && <div style={{ marginBottom: 8 }}>{address}</div>}
        {showUnsubscribe && (
          <div style={{ marginBottom: 8 }}>
            <a
              href="{{unsubscribe_url}}"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: linkColor, textDecoration: 'underline' }}
            >
              {unsubscribeText}
            </a>
          </div>
        )}
        {showSocialIcons && socialLinks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: linkColor, textDecoration: 'none', fontSize: fontSize + 4 }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

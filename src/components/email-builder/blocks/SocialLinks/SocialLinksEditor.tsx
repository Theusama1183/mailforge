import React from 'react'

import { SocialLinksProps } from './SocialLinksPropsSchema'
import { SocialIcon, SOCIAL_PLATFORM_LABELS, SocialPlatform } from './SocialLinksIcons'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

const DEFAULT_LINKS = [
  { platform: 'facebook', url: 'https://facebook.com', enabled: true },
  { platform: 'twitter', url: 'https://twitter.com', enabled: true },
  { platform: 'instagram', url: 'https://instagram.com', enabled: true },
  { platform: 'linkedin', url: 'https://linkedin.com', enabled: true },
]

export default function SocialLinksEditor({ style, props }: SocialLinksProps) {
  const links = props?.links?.filter((l) => l.enabled !== false) ?? DEFAULT_LINKS
  const alignment = props?.alignment ?? 'horizontal'
  const iconSize = style?.iconSize ?? 24
  const iconColor = style?.iconColor ?? '#000000'
  const iconGap = style?.iconGap ?? 12
  const iconBg = style?.iconBackgroundColor
  const iconRadius = style?.iconBorderRadius ?? 4
  const iconPadding = style?.iconPadding ?? 0

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
    padding: getPadding(style?.padding),
  }

  const listStyle: React.CSSProperties = {
    display: alignment === 'horizontal' ? 'inline-flex' : 'flex',
    flexDirection: alignment === 'horizontal' ? 'row' : 'column',
    alignItems: 'center',
    gap: iconGap,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }

  return (
    <div style={containerStyle}>
      <ul style={listStyle}>
        {links.map((link, i) => {
          const platform = link.platform as SocialPlatform
          const label = SOCIAL_PLATFORM_LABELS[platform] ?? platform
          const linkStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconBg ? iconSize + iconPadding * 2 : undefined,
            height: iconBg ? iconSize + iconPadding * 2 : undefined,
            backgroundColor: iconBg ?? undefined,
            borderRadius: iconRadius,
            padding: iconBg ? iconPadding : 0,
            textDecoration: 'none',
          }
          return (
            <li key={i}>
              <a href={link.url || '#'} style={linkStyle} title={label} target="_blank" rel="noopener noreferrer">
                <SocialIcon platform={platform} size={iconSize} color={iconColor} />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

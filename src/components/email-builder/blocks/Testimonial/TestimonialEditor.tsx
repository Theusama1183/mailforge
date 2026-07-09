import React from 'react'

import { TestimonialProps } from './TestimonialPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function TestimonialEditor({ style, props }: TestimonialProps) {
  const quote = props?.quote ?? ''
  const author = props?.author ?? ''
  const title = props?.title ?? ''
  const avatarUrl = props?.avatarUrl ?? ''
  const starRating = props?.starRating ?? 5
  const showStars = props?.showStars ?? true
  const quoteColor = props?.quoteColor ?? '#374151'
  const authorColor = props?.authorColor ?? '#111827'
  const titleColor = props?.titleColor ?? '#6B7280'
  const bgColor = props?.backgroundColor ?? '#F9FAFB'
  const borderColor = props?.borderColor ?? '#E5E7EB'
  const fontSize = props?.fontSize ?? 16
  const showQuoteMark = props?.showQuoteMark ?? true

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
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        {showStars && starRating > 0 && (
          <div style={{ marginBottom: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < starRating ? '#F59E0B' : '#E5E7EB', fontSize: 20, marginRight: 2 }}>
                &#9733;
              </span>
            ))}
          </div>
        )}
        {showQuoteMark && (
          <div style={{ fontSize: 48, lineHeight: 1, color: quoteColor, opacity: 0.2, marginBottom: -16, textAlign: 'left' }}>
            &ldquo;
          </div>
        )}
        <div style={{ fontSize, color: quoteColor, lineHeight: 1.6, fontStyle: 'italic', marginBottom: 16 }}>
          {quote || 'Your testimonial quote goes here...'}
        </div>
        {(author || avatarUrl) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={author || 'Avatar'}
                width={48}
                height={48}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div style={{ textAlign: 'left' }}>
              {author && (
                <div style={{ fontWeight: 700, color: authorColor, fontSize: 14 }}>{author}</div>
              )}
              {title && (
                <div style={{ fontSize: 12, color: titleColor }}>{title}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'

import { CalendarEventProps } from './CalendarEventPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function CalendarEventEditor({ style, props }: CalendarEventProps) {
  const title = props?.title ?? ''
  const date = props?.date ?? ''
  const time = props?.time ?? ''
  const endDate = props?.endDate ?? ''
  const endTime = props?.endTime ?? ''
  const location = props?.location ?? ''
  const description = props?.description ?? ''
  const showDateBadge = props?.showDateBadge ?? true
  const dayOfWeek = props?.dayOfWeek ?? ''
  const dateNumber = props?.dateNumber ?? ''
  const monthName = props?.monthName ?? ''
  const ctaText = props?.ctaText ?? ''
  const ctaUrl = props?.ctaUrl ?? ''
  const accentColor = props?.accentColor ?? '#3B82F6'
  const textColor = props?.textColor ?? '#111827'

  const dateLines: string[] = []
  if (date) dateLines.push(date)
  if (time) {
    let t = time
    if (endTime) t += ` - ${endTime}`
    if (endDate) t += ` (${endDate})`
    dateLines.push(t)
  }

  return (
    <div
      style={{
        textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
        padding: getPadding(style?.padding),
        backgroundColor: style?.backgroundColor ?? undefined,
        borderRadius: style?.borderRadius ?? undefined,
      }}
    >
      <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
        <tbody>
          <tr>
            {showDateBadge && (dayOfWeek || dateNumber || monthName) && (
              <td style={{ width: 80, verticalAlign: 'top', paddingRight: 16 }}>
                <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: accentColor, borderRadius: 8, overflow: 'hidden' }}>
                  <tbody>
                    {monthName && (
                      <tr>
                        <td style={{ backgroundColor: accentColor, color: '#FFFFFF', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '4px 8px', textTransform: 'uppercase' as const }}>
                          {monthName}
                        </td>
                      </tr>
                    )}
                    {dateNumber && (
                      <tr>
                        <td style={{ backgroundColor: '#FFFFFF', color: accentColor, fontSize: 28, fontWeight: 800, textAlign: 'center', padding: '8px' }}>
                          {dateNumber}
                        </td>
                      </tr>
                    )}
                    {dayOfWeek && (
                      <tr>
                        <td style={{ backgroundColor: '#FFFFFF', color: textColor, fontSize: 11, fontWeight: 600, textAlign: 'center', padding: '0 8px 8px' }}>
                          {dayOfWeek}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            )}
            <td style={{ verticalAlign: 'top' }}>
              {title && (
                <div style={{ fontSize: 18, fontWeight: 700, color: textColor, marginBottom: 8 }}>
                  {title}
                </div>
              )}
              {description && (
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 1.4 }}>
                  {description}
                </div>
              )}
              {dateLines.length > 0 && (
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                  {dateLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
              {location && (
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                  {location}
                </div>
              )}
              {ctaText && ctaUrl && (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: accentColor,
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    marginTop: 4,
                  }}
                >
                  {ctaText}
                </a>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

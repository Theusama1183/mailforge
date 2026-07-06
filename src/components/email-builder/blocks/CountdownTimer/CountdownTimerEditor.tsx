import React from 'react'

import { CountdownTimerProps } from './CountdownTimerPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

function getTimeRemaining(endDate: string): { days: number; hours: number; mins: number; secs: number } | null {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    mins: Math.floor((diff / (1000 * 60)) % 60),
    secs: Math.floor((diff / 1000) % 60),
  }
}

function formatNum(n: number): string {
  return String(n).padStart(2, '0')
}

export default function CountdownTimerEditor({ style, props }: CountdownTimerProps) {
  const endDate = props?.endDate
  const endText = props?.endText ?? 'Offer has ended!'
  const digitColor = props?.digitColor ?? '#111827'
  const labelColor = props?.labelColor ?? '#6B7280'
  const gap = props?.gap ?? 12
  const showLabels = props?.showLabels ?? true
  const labels = props?.labels ?? { days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs' }

  const remaining = endDate ? getTimeRemaining(endDate) : null

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
    borderRadius: style?.borderRadius ?? undefined,
  }

  if (!endDate || !remaining) {
    return (
      <div style={containerStyle}>
        <div style={{ color: labelColor, fontSize: 16 }}>
          {!endDate ? 'Set an end date in the sidebar' : endText}
        </div>
      </div>
    )
  }

  const items = [
    { value: remaining.days, label: labels.days ?? 'Days' },
    { value: remaining.hours, label: labels.hours ?? 'Hours' },
    { value: remaining.mins, label: labels.mins ?? 'Mins' },
    { value: remaining.secs, label: labels.secs ?? 'Secs' },
  ]

  return (
    <div style={containerStyle}>
      <div style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
        {items.map((item, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: digitColor,
                lineHeight: 1.2,
                minWidth: 48,
              }}
            >
              {formatNum(item.value)}
            </div>
            {showLabels && (
              <div
                style={{
                  fontSize: 11,
                  color: labelColor,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginTop: 4,
                }}
              >
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

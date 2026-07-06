import React from 'react'

import { ProgressBarProps } from './ProgressBarPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function ProgressBarEditor({ style, props: p }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, p?.percentage ?? 50))
  const label = p?.label ?? ''
  const showPercentage = p?.showPercentage ?? true
  const barColor = p?.barColor ?? '#3B82F6'
  const trackColor = p?.trackColor ?? '#E5E7EB'
  const height = p?.height ?? 12
  const borderRadius = p?.borderRadius ?? 6
  const labelPosition = p?.labelPosition ?? 'above'

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'left',
    padding: getPadding(style?.padding),
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: style?.color ?? '#374151',
    marginBottom: labelPosition === 'above' ? 6 : 0,
    marginTop: labelPosition === 'below' ? 6 : 0,
    display: 'flex',
    justifyContent: 'space-between',
  }

  const trackStyle: React.CSSProperties = {
    width: '100%',
    height,
    backgroundColor: trackColor,
    borderRadius,
    overflow: 'hidden',
    position: 'relative',
  }

  const fillStyle: React.CSSProperties = {
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: barColor,
    borderRadius,
    transition: 'width 0.3s ease',
    position: 'relative',
  }

  const insideLabelStyle: React.CSSProperties = {
    position: 'absolute',
    right: 4,
    top: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    fontSize: Math.min(height - 2, 11),
    fontWeight: 600,
    color: '#FFFFFF',
  }

  return (
    <div style={containerStyle}>
      {(label || showPercentage) && labelPosition === 'above' && (
        <div style={labelStyle}>
          <span>{label}</span>
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div style={trackStyle}>
        <div style={fillStyle}>
          {labelPosition === 'inside' && showPercentage && (
            <span style={insideLabelStyle}>{Math.round(percentage)}%</span>
          )}
        </div>
      </div>
      {(label || showPercentage) && labelPosition === 'below' && (
        <div style={labelStyle}>
          <span>{label}</span>
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
    </div>
  )
}

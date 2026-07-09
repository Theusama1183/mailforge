import React from 'react'

import { PricingTableProps } from './PricingTablePropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function PricingTableEditor({ style, props }: PricingTableProps) {
  const plans = props?.plans ?? []
  const gap = props?.gap ?? 12
  const buttonColor = props?.buttonColor ?? '#3B82F6'
  const buttonTextColor = props?.buttonTextColor ?? '#FFFFFF'
  const cardBg = props?.cardBackgroundColor ?? '#FFFFFF'
  const cardRadius = props?.cardBorderRadius ?? 12
  const headerBg = props?.headerBackgroundColor ?? '#F9FAFB'
  const headerTextColor = props?.headerTextColor ?? '#111827'
  const featureColor = props?.featureColor ?? '#6B7280'
  const priceColor = props?.priceColor ?? '#111827'
  const showFeatures = props?.showFeatures ?? true

  if (plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: getPadding(style?.padding), color: '#9CA3AF', fontStyle: 'italic' }}>
        Add pricing plans to display
      </div>
    )
  }

  const colWidth = `${100 / plans.length}%`

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
            {plans.map((plan, i) => {
              const accent = plan.accentColor || buttonColor
              return (
                <td
                  key={i}
                  style={{
                    width: colWidth,
                    padding: gap / 2,
                    verticalAlign: 'top',
                  }}
                >
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{
                      backgroundColor: plan.highlighted ? cardBg : cardBg,
                      borderRadius: cardRadius,
                      overflow: 'hidden',
                      border: plan.highlighted ? `2px solid ${accent}` : '1px solid #E5E7EB',
                    }}
                  >
                    <tbody>
                      {plan.highlighted && (
                        <tr>
                          <td style={{ backgroundColor: accent, color: '#FFFFFF', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '4px 0', textTransform: 'uppercase' as const }}>
                            Most Popular
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ backgroundColor: headerBg, padding: '20px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: headerTextColor, marginBottom: 8 }}>
                            {plan.name || 'Plan'}
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: priceColor }}>{plan.currency || '$'}</span>
                            <span style={{ fontSize: 28, fontWeight: 800, color: priceColor }}>{plan.price || '0'}</span>
                            {plan.period && (
                              <span style={{ fontSize: 12, color: featureColor }}> /{plan.period}</span>
                            )}
                          </div>
                          {plan.description && (
                            <div style={{ fontSize: 12, color: featureColor, marginTop: 8 }}>{plan.description}</div>
                          )}
                        </td>
                      </tr>
                      {showFeatures && plan.features && plan.features.length > 0 && (
                        <tr>
                          <td style={{ padding: '12px' }}>
                            {plan.features.map((feature, fi) => (
                              <div
                                key={fi}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '4px 0',
                                  fontSize: 13,
                                  color: featureColor,
                                }}
                              >
                                <span style={{ color: feature.included !== false ? '#10B981' : '#D1D5DB', fontSize: 16 }}>
                                  {feature.included !== false ? '\u2713' : '\u2013'}
                                </span>
                                <span style={{ textDecoration: feature.included === false ? 'line-through' : 'none', opacity: feature.included === false ? 0.5 : 1 }}>
                                  {feature.text || ''}
                                </span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                      {plan.ctaText && plan.ctaUrl && (
                        <tr>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <a
                              href={plan.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                fontSize: 13,
                                fontWeight: 700,
                                padding: '10px 20px',
                                borderRadius: 6,
                                textDecoration: 'none',
                              }}
                            >
                              {plan.ctaText}
                            </a>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

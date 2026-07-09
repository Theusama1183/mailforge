import React from 'react'

import { ProductGridProps } from './ProductGridPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

export default function ProductGridEditor({ style, props }: ProductGridProps) {
  const products = props?.products ?? []
  const columns = props?.columns ?? '2'
  const gap = props?.gap ?? 16
  const showPrice = props?.showPrice ?? true
  const buttonColor = props?.buttonColor ?? '#3B82F6'
  const buttonTextColor = props?.buttonTextColor ?? '#FFFFFF'
  const cardBg = props?.cardBackgroundColor ?? '#FFFFFF'
  const titleColor = props?.titleColor ?? '#111827'
  const priceColor = props?.priceColor ?? '#6B7280'
  const radius = props?.borderRadiusSize ?? 8

  const colCount = parseInt(columns, 10)

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: getPadding(style?.padding), color: '#9CA3AF', fontStyle: 'italic' }}>
        Add products to display
      </div>
    )
  }

  const rows: typeof products[] = []
  for (let i = 0; i < products.length; i += colCount) {
    rows.push(products.slice(i, i + colCount))
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
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((product, ci) => (
                <td
                  key={ci}
                  style={{
                    width: `${100 / colCount}%`,
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
                      backgroundColor: cardBg,
                      borderRadius: radius,
                      overflow: 'hidden',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <img
                            src={product.imageUrl || 'https://placehold.co/400x300/F8F8F8/CCC?text=Product'}
                            alt={product.title || ''}
                            width="100%"
                            style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 12px 0' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: titleColor, marginBottom: 4 }}>
                            {product.title || 'Product Name'}
                          </div>
                        </td>
                      </tr>
                      {showPrice && (product.price || product.originalPrice) && (
                        <tr>
                          <td style={{ padding: '0 12px' }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: priceColor }}>
                              {product.originalPrice && (
                                <span style={{ textDecoration: 'line-through', color: '#9CA3AF', marginRight: 6, fontSize: 13 }}>
                                  {product.originalPrice}
                                </span>
                              )}
                              {product.price}
                            </div>
                          </td>
                        </tr>
                      )}
                      {product.ctaText && product.ctaUrl && (
                        <tr>
                          <td style={{ padding: '12px' }}>
                            <a
                              href={product.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                fontSize: 12,
                                fontWeight: 700,
                                padding: '8px 16px',
                                borderRadius: 4,
                                textDecoration: 'none',
                              }}
                            >
                              {product.ctaText}
                            </a>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
              ))}
              {row.length < colCount && Array.from({ length: colCount - row.length }).map((_, i) => (
                <td key={`empty-${i}`} style={{ width: `${100 / colCount}%` }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

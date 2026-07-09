import React from 'react'

import { MapProps } from './MapPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

function buildStaticMapUrl(props: MapProps['props']): string {
  const lat = props?.latitude ?? 40.7128
  const lng = props?.longitude ?? -74.006
  const zoom = props?.zoom ?? 14
  const width = props?.width ?? 600
  const height = props?.height ?? 300
  const mapStyle = props?.mapStyle ?? 'roadmap'
  const label = props?.markerLabel ? `&markers=label:${encodeURIComponent(props.markerLabel.slice(0, 1))}|${lat},${lng}` : `&markers=${lat},${lng}`
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=${mapStyle}${label}&key=YOUR_API_KEY`
}

export default function MapEditor({ style, props }: MapProps) {
  const imgUrl = buildStaticMapUrl(props)
  const linkUrl = props?.linkUrl || `https://www.google.com/maps?q=${props?.latitude ?? 40.7128},${props?.longitude ?? -74.006}`
  const width = props?.width ?? 600
  const height = props?.height ?? 300

  const img = (
    <img
      src={imgUrl}
      alt={props?.address || 'Map location'}
      width={width}
      height={height}
      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
    />
  )

  return (
    <div
      style={{
        textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
        padding: getPadding(style?.padding),
        backgroundColor: style?.backgroundColor ?? undefined,
        borderRadius: style?.borderRadius ?? undefined,
      }}
    >
      {linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-block' }}>
          {img}
        </a>
      ) : (
        img
      )}
      {props?.address && (
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
          {props.address}
        </div>
      )}
    </div>
  )
}

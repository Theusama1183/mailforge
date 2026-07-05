import React from 'react'

import { useCurrentBlockId } from '../../editor/EditorBlock'
import { setDocument, setSelectedBlockId, useDocument } from '../../editor/EditorContext'
import EditorChildrenIds from '../helpers/EditorChildrenIds'

import { ContainerProps } from './ContainerPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

function getGradientBackground(style: ContainerProps['style']): string | undefined {
  if (style?.backgroundType !== 'gradient' || !style.gradientType) return undefined
  const stops = style.gradientColorStops ?? []
  const stopStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ')
  if (style.gradientType === 'linear') {
    const angle = style.gradientAngle ?? 0
    return `linear-gradient(${angle}deg, ${stopStr})`
  }
  return `radial-gradient(circle, ${stopStr})`
}

export default function ContainerEditor({ style, props }: ContainerProps) {
  const childrenIds = props?.childrenIds ?? []
  const document = useDocument()
  const currentBlockId = useCurrentBlockId()
  const gradientBg = getGradientBackground(style)

  const wStyle: React.CSSProperties = {
    backgroundColor: !gradientBg ? (style?.backgroundColor ?? undefined) : undefined,
    border: style?.borderColor ? `1px solid ${style.borderColor}` : undefined,
    borderRadius: style?.borderRadius ?? undefined,
    padding: getPadding(style?.padding),
    display: (style?.display as React.CSSProperties['display']) ?? undefined,
    flexDirection: (style?.flexDirection as React.CSSProperties['flexDirection']) ?? undefined,
    flexWrap: (style?.flexWrap as React.CSSProperties['flexWrap']) ?? undefined,
    alignItems: (style?.alignItems as React.CSSProperties['alignItems']) ?? undefined,
    justifyContent: (style?.justifyContent as React.CSSProperties['justifyContent']) ?? undefined,
    gap: style?.gap ?? undefined,
    background: gradientBg ?? undefined,
  }

  return (
    <div style={wStyle}>
      <EditorChildrenIds
        childrenIds={childrenIds}
        onChange={({ block, blockId, childrenIds }) => {
          setDocument({
            [blockId]: block,
            [currentBlockId]: {
              type: 'Container',
              data: {
                ...document[currentBlockId].data,
                props: { childrenIds },
              },
            },
          })
          setSelectedBlockId(blockId)
        }}
      />
    </div>
  )
}

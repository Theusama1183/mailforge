import React from 'react'

import { ColumnsContainer as BaseColumnsContainer } from '@usewaypoint/block-columns-container'

import { useCurrentBlockId } from '../../editor/EditorBlock'
import { setDocument, setSelectedBlockId } from '../../editor/EditorContext'
import EditorChildrenIds, { EditorChildrenChange } from '../helpers/EditorChildrenIds'

import ColumnsContainerPropsSchema, { ColumnsContainerProps } from './ColumnsContainerPropsSchema'

const EMPTY_COLUMNS = [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }]

export default function ColumnsContainerEditor({ style, props }: ColumnsContainerProps) {
  const currentBlockId = useCurrentBlockId()
  const columnsCount = props?.columnsCount ?? 2
  const columnsArray = columnsCount === 2
    ? [{ childrenIds: [] }, { childrenIds: [] }]
    : [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }]

  const columnsValue: Array<{ childrenIds: string[] }> = (props?.columns ?? columnsArray) as Array<{ childrenIds: string[] }>
  const restProps = props ?? {}

  const updateColumn = (columnIndex: number, { block, blockId, childrenIds }: EditorChildrenChange) => {
    const nColumns = [...columnsValue]
    nColumns[columnIndex] = { childrenIds }
    setDocument({
      [blockId]: block,
      [currentBlockId]: {
        type: 'ColumnsContainer',
        data: ColumnsContainerPropsSchema.parse({
          style,
          props: {
            ...restProps,
            columns: nColumns,
          },
        }),
      },
    })
    setSelectedBlockId(blockId)
  }

  const colEditors = columnsCount === 2
    ? [
        <EditorChildrenIds key={0} childrenIds={columnsValue[0]?.childrenIds} onChange={(change) => updateColumn(0, change)} />,
        <EditorChildrenIds key={1} childrenIds={columnsValue[1]?.childrenIds} onChange={(change) => updateColumn(1, change)} />,
      ]
    : [
        <EditorChildrenIds key={0} childrenIds={columnsValue[0]?.childrenIds} onChange={(change) => updateColumn(0, change)} />,
        <EditorChildrenIds key={1} childrenIds={columnsValue[1]?.childrenIds} onChange={(change) => updateColumn(1, change)} />,
        <EditorChildrenIds key={2} childrenIds={columnsValue[2]?.childrenIds} onChange={(change) => updateColumn(2, change)} />,
      ]

  const wrapperStyle: React.CSSProperties = {
    borderRadius: style?.borderRadius ?? undefined,
    border: style?.borderColor ? `1px solid ${style.borderColor}` : undefined,
    overflow: style?.borderRadius ? 'hidden' : undefined,
  }

  return (
    <div style={wrapperStyle}>
      <BaseColumnsContainer
        props={restProps}
        style={style}
        columns={colEditors}
      />
    </div>
  )
}

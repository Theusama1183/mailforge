import React, { CSSProperties, useState } from 'react'

import { Box } from '@mui/material'
import LockOutlined from '@mui/icons-material/LockOutlined'

import { useCurrentBlockId } from '../../../editor/EditorBlock'
import { setSelectedBlockId, toggleBlockSelection, useDocument, useSelectedBlockId, useSelectedBlockIds } from '../../../editor/EditorContext'

import TuneMenu from './TuneMenu'

type TEditorBlockWrapperProps = {
  children: React.ReactNode
}

export default function EditorBlockWrapper({ children }: TEditorBlockWrapperProps) {
  const selectedBlockId = useSelectedBlockId()
  const selectedBlockIds = useSelectedBlockIds()
  const document = useDocument()
  const [mouseInside, setMouseInside] = useState(false)
  const blockId = useCurrentBlockId()
  const block = document[blockId]
  const isLocked = block?.data?.props?._locked || block?.data?._locked

  let outline: CSSProperties['outline']
  if (isLocked) {
    outline = '1px dashed rgba(156,163,175, 1)'
  } else if (selectedBlockIds.includes(blockId) && selectedBlockIds.length > 1) {
    outline = '2px solid rgba(59,130,246, 1)'
  } else if (selectedBlockId === blockId) {
    outline = '2px solid rgba(0,121,204, 1)'
  } else if (mouseInside) {
    outline = '2px solid rgba(0,121,204, 0.3)'
  }

  const handleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation()
    ev.preventDefault()
    if (isLocked) return
    if (ev.shiftKey) {
      toggleBlockSelection(blockId)
    } else {
      setSelectedBlockId(blockId)
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: '100%',
        outlineOffset: '-1px',
        outline,
        opacity: isLocked ? 0.7 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(ev) => { setMouseInside(true); ev.stopPropagation() }}
      onMouseLeave={() => { setMouseInside(false) }}
      onClick={handleClick}
    >
      {!isLocked && selectedBlockId === blockId && <TuneMenu blockId={blockId} />}
      {isLocked && (
        <Box sx={{ position: 'absolute', top: 2, right: 2, zIndex: 10, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LockOutlined sx={{ fontSize: 12 }} />
        </Box>
      )}
      {children}
    </Box>
  )
}



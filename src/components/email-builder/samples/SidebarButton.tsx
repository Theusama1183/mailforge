import React from 'react'

import { Button } from '@mui/material'

import { resetDocument } from '../editor/EditorContext'
import getConfiguration from '../editor/getConfiguration'

export default function SidebarButton({ href, children }: { href: string; children: React.ReactNode }) {
  const handleClick = () => {
    resetDocument(getConfiguration(href))
  }
  return (
    <Button size="small" href={href} onClick={handleClick}>
      {children}
    </Button>
  )
}

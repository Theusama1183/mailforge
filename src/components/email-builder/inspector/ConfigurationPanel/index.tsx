import React from 'react'

import { Box, Typography } from '@mui/material'

import { TEditorBlock } from '../../editor/core'
import { setDocument, useDocument, useSelectedBlockId } from '../../editor/EditorContext'

import AccordionSidebarPanel from './input-panels/AccordionSidebarPanel'
import AvatarSidebarPanel from './input-panels/AvatarSidebarPanel'
import ButtonGroupSidebarPanel from './input-panels/ButtonGroupSidebarPanel'
import ButtonSidebarPanel from './input-panels/ButtonSidebarPanel'
import ColumnsContainerSidebarPanel from './input-panels/ColumnsContainerSidebarPanel'
import ContainerSidebarPanel from './input-panels/ContainerSidebarPanel'
import CountdownTimerSidebarPanel from './input-panels/CountdownTimerSidebarPanel'
import DividerSidebarPanel from './input-panels/DividerSidebarPanel'
import EmailLayoutSidebarPanel from './input-panels/EmailLayoutSidebarPanel'
import HeadingSidebarPanel from './input-panels/HeadingSidebarPanel'
import HtmlSidebarPanel from './input-panels/HtmlSidebarPanel'
import ImageSidebarPanel from './input-panels/ImageSidebarPanel'
import ProgressBarSidebarPanel from './input-panels/ProgressBarSidebarPanel'
import SocialLinksSidebarPanel from './input-panels/SocialLinksSidebarPanel'
import SpacerSidebarPanel from './input-panels/SpacerSidebarPanel'
import TextSidebarPanel from './input-panels/TextSidebarPanel'
import VideoSidebarPanel from './input-panels/VideoSidebarPanel'

function renderMessage(val: string) {
  return (
    <Box sx={{ m: 3, p: 1, border: '1px dashed', borderColor: 'divider' }}>
      <Typography color="text.secondary">{val}</Typography>
    </Box>
  )
}

export default function ConfigurationPanel() {
  const document = useDocument()
  const selectedBlockId = useSelectedBlockId()

  if (!selectedBlockId) {
    return renderMessage('Click on a block to inspect.')
  }
  const block = document[selectedBlockId]
  if (!block) {
    return renderMessage(`Block with id ${selectedBlockId} was not found. Click on a block to reset.`)
  }

  const setBlock = (conf: TEditorBlock) => setDocument({ [selectedBlockId]: conf })
  const { data, type } = block
  switch (type) {
    case 'Accordion':
      return <AccordionSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Avatar':
      return <AvatarSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Button':
      return <ButtonSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'ButtonGroup':
      return <ButtonGroupSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'ColumnsContainer':
      return (
        <ColumnsContainerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
      )
    case 'Container':
      return <ContainerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'CountdownTimer':
      return <CountdownTimerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Divider':
      return <DividerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Heading':
      return <HeadingSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Html':
      return <HtmlSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Image':
      return <ImageSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'ProgressBar':
      return <ProgressBarSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'SocialLinks':
      return <SocialLinksSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'EmailLayout':
      return <EmailLayoutSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Spacer':
      return <SpacerSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Text':
      return <TextSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    case 'Video':
      return <VideoSidebarPanel key={selectedBlockId} data={data} setData={(data) => setBlock({ type, data })} />
    default:
      return <pre>{JSON.stringify(block, null, '  ')}</pre>
  }
}

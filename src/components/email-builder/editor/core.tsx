import React from 'react'
import { z } from 'zod'

import { Avatar, AvatarPropsSchema } from '@usewaypoint/block-avatar'
import { Button, ButtonPropsSchema } from '@usewaypoint/block-button'
import { Divider, DividerPropsSchema } from '@usewaypoint/block-divider'
import HeadingBlockEditor from '../blocks/Heading/HeadingBlockEditor'
import HeadingBlockPropsSchema from '../blocks/Heading/HeadingBlockPropsSchema'
import { Html, HtmlPropsSchema } from '@usewaypoint/block-html'
import { Image, ImagePropsSchema } from '@usewaypoint/block-image'
import { Spacer, SpacerPropsSchema } from '@usewaypoint/block-spacer'
import { Text, TextPropsSchema } from '@usewaypoint/block-text'
import {
  buildBlockComponent,
  buildBlockConfigurationDictionary,
  buildBlockConfigurationSchema,
} from '@usewaypoint/document-core'

import ButtonGroupEditor from '../blocks/ButtonGroup/ButtonGroupEditor'
import ButtonGroupPropsSchema from '../blocks/ButtonGroup/ButtonGroupPropsSchema'
import ColumnsContainerEditor from '../blocks/ColumnsContainer/ColumnsContainerEditor'
import ColumnsContainerPropsSchema from '../blocks/ColumnsContainer/ColumnsContainerPropsSchema'
import ContainerEditor from '../blocks/Container/ContainerEditor'
import ContainerPropsSchema from '../blocks/Container/ContainerPropsSchema'
import EmailLayoutEditor from '../blocks/EmailLayout/EmailLayoutEditor'
import EmailLayoutPropsSchema from '../blocks/EmailLayout/EmailLayoutPropsSchema'
import EditorBlockWrapper from '../blocks/helpers/block-wrappers/EditorBlockWrapper'
import SocialLinksEditor from '../blocks/SocialLinks/SocialLinksEditor'
import SocialLinksPropsSchema from '../blocks/SocialLinks/SocialLinksPropsSchema'

const EDITOR_DICTIONARY = buildBlockConfigurationDictionary({
  Avatar: {
    schema: AvatarPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Avatar {...props} />
      </EditorBlockWrapper>
    ),
  },
  Button: {
    schema: ButtonPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Button {...props} />
      </EditorBlockWrapper>
    ),
  },
  ButtonGroup: {
    schema: ButtonGroupPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ButtonGroupEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  Container: {
    schema: ContainerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ContainerEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  ColumnsContainer: {
    schema: ColumnsContainerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ColumnsContainerEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  Heading: {
    schema: HeadingBlockPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <HeadingBlockEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  Html: {
    schema: HtmlPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Html {...props} />
      </EditorBlockWrapper>
    ),
  },
  Image: {
    schema: ImagePropsSchema,
    Component: (data) => {
      const props = {
        ...data,
        props: {
          ...data.props,
          url: data.props?.url ?? 'https://placehold.co/600x400@2x/F8F8F8/CCC?text=Your%20image',
        },
      }
      return (
        <EditorBlockWrapper>
          <Image {...props} />
        </EditorBlockWrapper>
      )
    },
  },
  SocialLinks: {
    schema: SocialLinksPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <SocialLinksEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  Text: {
    schema: TextPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Text {...props} />
      </EditorBlockWrapper>
    ),
  },
  EmailLayout: {
    schema: EmailLayoutPropsSchema,
    Component: (p) => <EmailLayoutEditor {...p} />,
  },
  Spacer: {
    schema: SpacerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Spacer {...props} />
      </EditorBlockWrapper>
    ),
  },
  Divider: {
    schema: DividerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Divider {...props} />
      </EditorBlockWrapper>
    ),
  },
})

export const EditorBlock = buildBlockComponent(EDITOR_DICTIONARY)
export const EditorBlockSchema = buildBlockConfigurationSchema(EDITOR_DICTIONARY)
export const EditorConfigurationSchema = z.record(z.string(), EditorBlockSchema)

export type TEditorBlock = z.infer<typeof EditorBlockSchema>
export type TEditorConfiguration = Record<string, TEditorBlock>

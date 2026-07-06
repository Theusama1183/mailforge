import React from 'react'

import {
  AccountCircleOutlined,
  Crop32Outlined,
  HMobiledataOutlined,
  HorizontalRuleOutlined,
  HtmlOutlined,
  ImageOutlined,
  LibraryAddOutlined,
  NotesOutlined,
  OndemandVideoOutlined,
  ShareOutlined,
  SmartButtonOutlined,
  TimerOutlined,
  ViewColumnOutlined,
} from '@mui/icons-material'
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined'
import ShowChartOutlined from '@mui/icons-material/ShowChartOutlined'

import { TEditorBlock } from '../../../../editor/core'

type TButtonProps = {
  label: string
  icon: React.ReactNode
  block: () => TEditorBlock
}
export const BUTTONS: TButtonProps[] = [
  {
    label: 'Heading',
    icon: <HMobiledataOutlined />,
    block: () => ({
      type: 'Heading',
      data: {
        props: { text: 'Hello friend' },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
        },
      },
    }),
  },
  {
    label: 'Text',
    icon: <NotesOutlined />,
    block: () => ({
      type: 'Text',
      data: {
        props: { text: 'My new text block' },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          fontWeight: 'normal',
        },
      },
    }),
  },

  {
    label: 'Button',
    icon: <SmartButtonOutlined />,
    block: () => ({
      type: 'Button',
      data: {
        props: {
          text: 'Button',
          url: 'https://www.usewaypoint.com',
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Image',
    icon: <ImageOutlined />,
    block: () => ({
      type: 'Image',
      data: {
        props: {
          url: 'https://assets.usewaypoint.com/sample-image.jpg',
          alt: 'Sample product',
          contentAlignment: 'middle',
          linkHref: null,
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Avatar',
    icon: <AccountCircleOutlined />,
    block: () => ({
      type: 'Avatar',
      data: {
        props: {
          imageUrl: 'https://ui-avatars.com/api/?size=128',
          shape: 'circle',
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Divider',
    icon: <HorizontalRuleOutlined />,
    block: () => ({
      type: 'Divider',
      data: {
        style: { padding: { top: 16, right: 0, bottom: 16, left: 0 } },
        props: {
          lineColor: '#CCCCCC',
        },
      },
    }),
  },
  {
    label: 'Spacer',
    icon: <Crop32Outlined />,
    block: () => ({
      type: 'Spacer',
      data: {},
    }),
  },
  {
    label: 'Html',
    icon: <HtmlOutlined />,
    block: () => ({
      type: 'Html',
      data: {
        props: { contents: '<strong>Hello world</strong>' },
        style: {
          fontSize: 16,
          textAlign: null,
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
        },
      },
    }),
  },
  {
    label: 'Columns',
    icon: <ViewColumnOutlined />,
    block: () => ({
      type: 'ColumnsContainer',
      data: {
        props: {
          columnsGap: 16,
          columnsCount: 3,
          columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }],
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Container',
    icon: <LibraryAddOutlined />,
    block: () => ({
      type: 'Container',
      data: {
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'Social Links',
    icon: <ShareOutlined />,
    block: () => ({
      type: 'SocialLinks',
      data: {
        props: {
          links: [
            { platform: 'facebook', url: 'https://facebook.com', enabled: true },
            { platform: 'twitter', url: 'https://twitter.com', enabled: true },
            { platform: 'instagram', url: 'https://instagram.com', enabled: true },
            { platform: 'linkedin', url: 'https://linkedin.com', enabled: true },
          ],
          alignment: 'horizontal',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          iconSize: 24,
          iconColor: '#000000',
          iconGap: 12,
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Button Group',
    icon: <SmartButtonOutlined />,
    block: () => ({
      type: 'ButtonGroup',
      data: {
        props: {
          buttons: [
            { text: 'Get Started', url: 'https://example.com' },
            { text: 'Learn More', url: 'https://example.com' },
          ],
          alignment: 'horizontal',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          gap: 12,
          buttonBackgroundColor: '#3B82F6',
          buttonTextColor: '#FFFFFF',
          buttonBorderRadius: 6,
          buttonFontSize: 14,
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Video',
    icon: <OndemandVideoOutlined />,
    block: () => ({
      type: 'Video',
      data: {
        props: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          alt: 'Video',
          width: 560,
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 }, textAlign: 'center' },
      },
    }),
  },
  {
    label: 'Countdown Timer',
    icon: <TimerOutlined />,
    block: () => ({
      type: 'CountdownTimer',
      data: {
        props: {
          endDate: '2026-12-31T23:59:59',
          endText: 'Offer ended!',
          digitColor: '#111827',
          labelColor: '#6B7280',
          gap: 12,
          showLabels: true,
          labels: { days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs' },
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 }, textAlign: 'center' },
      },
    }),
  },
  {
    label: 'Progress Bar',
    icon: <ShowChartOutlined />,
    block: () => ({
      type: 'ProgressBar',
      data: {
        props: {
          percentage: 75,
          label: 'Progress',
          showPercentage: true,
          barColor: '#3B82F6',
          trackColor: '#E5E7EB',
          height: 12,
          borderRadius: 6,
          labelPosition: 'above',
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'FAQ / Accordion',
    icon: <UnfoldMoreOutlined />,
    block: () => ({
      type: 'Accordion',
      data: {
        props: {
          items: [
            { title: 'How does it work?', content: 'Simply add your content and customize the design.', open: true },
            { title: 'Is it free?', content: 'Yes, you can get started with our free plan.', open: false },
          ],
          titleColor: '#111827',
          contentColor: '#6B7280',
          borderColor: '#E5E7EB',
          borderRadius: 8,
          gap: 4,
          backgroundColor: '#FFFFFF',
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
]

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
import PanoramaOutlined from '@mui/icons-material/PanoramaOutlined'
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined'
import ShowChartOutlined from '@mui/icons-material/ShowChartOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined'
import GridViewOutlined from '@mui/icons-material/GridViewOutlined'
import FormatQuoteOutlined from '@mui/icons-material/FormatQuoteOutlined'
import TableChartOutlined from '@mui/icons-material/TableChartOutlined'
import EventOutlined from '@mui/icons-material/EventOutlined'
import CallToActionOutlined from '@mui/icons-material/CallToActionOutlined'
import MenuOpenOutlined from '@mui/icons-material/MenuOpenOutlined'

import { TEditorBlock } from '../../../../editor/core'

type TButtonProps = {
  label: string
  icon: React.ReactNode
  block: () => TEditorBlock
}
export const BUTTONS: TButtonProps[] = [
  {
    label: 'Header / Logo',
    icon: <PanoramaOutlined />,
    block: () => ({
      type: 'Header',
      data: {
        props: {
          logoUrl: 'https://placehold.co/200x60/3B82F6/FFFFFF?text=Logo',
          text: 'Company Name',
          layout: 'logo-left',
          logoWidth: 200,
          textColor: '#111827',
          fontSize: 24,
          fontWeight: 'bold',
          url: 'https://example.com',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        },
      },
    }),
  },
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
    label: 'Footer',
    icon: <CallToActionOutlined />,
    block: () => ({
      type: 'Footer',
      data: {
        props: {
          copyright: '© 2026 Your Company. All rights reserved.',
          showUnsubscribe: true,
          unsubscribeText: 'Unsubscribe',
          address: '123 Main St, City, State 12345',
          showSocialIcons: false,
          fontSize: 12,
          textColor: '#6B7280',
          linkColor: '#3B82F6',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Menu / Nav',
    icon: <MenuOpenOutlined />,
    block: () => ({
      type: 'MenuNav',
      data: {
        props: {
          links: [
            { label: 'Home', url: 'https://example.com' },
            { label: 'About', url: 'https://example.com/about' },
            { label: 'Contact', url: 'https://example.com/contact' },
          ],
          alignment: 'center',
          layout: 'horizontal',
          fontSize: 14,
          linkColor: '#374151',
          separator: 'none',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Map',
    icon: <MapOutlined />,
    block: () => ({
      type: 'Map',
      data: {
        props: {
          address: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.006,
          zoom: 14,
          width: 600,
          height: 300,
          mapStyle: 'roadmap',
          linkUrl: 'https://www.google.com/maps?q=40.7128,-74.006',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Coupon / Discount',
    icon: <CardGiftcardOutlined />,
    block: () => ({
      type: 'Coupon',
      data: {
        props: {
          code: 'SAVE20',
          discount: '20% OFF',
          description: 'Your coupon description here',
          expiry: 'Expires Dec 31, 2026',
          showDashedBorder: true,
          couponColor: '#FEF2F2',
          textColor: '#111827',
          buttonText: '',
          buttonColor: '#3B82F6',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Product Grid',
    icon: <GridViewOutlined />,
    block: () => ({
      type: 'ProductGrid',
      data: {
        props: {
          products: [
            { imageUrl: 'https://placehold.co/400x300/F8F8F8/CCC?text=Product+1', title: 'Product 1', price: '$19.99', originalPrice: '', ctaText: 'Shop Now', ctaUrl: 'https://example.com' },
            { imageUrl: 'https://placehold.co/400x300/F8F8F8/CCC?text=Product+2', title: 'Product 2', price: '$29.99', originalPrice: '$39.99', ctaText: 'Shop Now', ctaUrl: 'https://example.com' },
          ],
          columns: '2',
          gap: 16,
          showPrice: true,
          buttonColor: '#3B82F6',
          buttonTextColor: '#FFFFFF',
          cardBackgroundColor: '#FFFFFF',
          titleColor: '#111827',
          priceColor: '#6B7280',
          borderRadiusSize: 8,
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          backgroundColor: '#F9FAFB',
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Testimonial',
    icon: <FormatQuoteOutlined />,
    block: () => ({
      type: 'Testimonial',
      data: {
        props: {
          quote: 'This product completely transformed our workflow. Highly recommended!',
          author: 'Jane Doe',
          title: 'CEO, Example Corp',
          avatarUrl: 'https://ui-avatars.com/api/?name=Jane+Doe&size=96',
          starRating: 5,
          showStars: true,
          showQuoteMark: true,
          quoteColor: '#374151',
          authorColor: '#111827',
          titleColor: '#6B7280',
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB',
          fontSize: 16,
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Pricing Table',
    icon: <TableChartOutlined />,
    block: () => ({
      type: 'PricingTable',
      data: {
        props: {
          plans: [
            { name: 'Basic', price: '9', currency: '$', period: 'mo', description: 'For starters', features: [{ text: '1 Project', included: true }, { text: '10GB Storage', included: true }, { text: 'Basic Support', included: true }], ctaText: 'Get Started', ctaUrl: 'https://example.com', highlighted: false, accentColor: '#3B82F6' },
            { name: 'Pro', price: '29', currency: '$', period: 'mo', description: 'For professionals', features: [{ text: 'Unlimited Projects', included: true }, { text: '100GB Storage', included: true }, { text: 'Priority Support', included: true }, { text: 'Analytics', included: true }], ctaText: 'Get Started', ctaUrl: 'https://example.com', highlighted: true, accentColor: '#3B82F6' },
          ],
          gap: 12,
          showFeatures: true,
          buttonColor: '#3B82F6',
          buttonTextColor: '#FFFFFF',
          cardBackgroundColor: '#FFFFFF',
          cardBorderRadius: 12,
          headerBackgroundColor: '#F9FAFB',
          headerTextColor: '#111827',
          featureColor: '#6B7280',
          priceColor: '#111827',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        },
      },
    }),
  },
  {
    label: 'Calendar Event',
    icon: <EventOutlined />,
    block: () => ({
      type: 'CalendarEvent',
      data: {
        props: {
          title: 'Product Launch',
          description: 'Join us for the launch of our latest product',
          date: 'January 15, 2026',
          time: '10:00 AM',
          endTime: '11:00 AM',
          location: '123 Main St, City',
          showDateBadge: true,
          dayOfWeek: 'Mon',
          dateNumber: '15',
          monthName: 'Jan',
          ctaText: 'Add to Calendar',
          ctaUrl: 'https://example.com/calendar',
          accentColor: '#3B82F6',
          textColor: '#111827',
        },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          textAlign: 'left',
        },
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

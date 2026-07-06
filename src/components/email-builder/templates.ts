import { TEditorConfiguration } from './editor/core'

function uid(): string {
  return Math.random().toString(36).substring(2, 10)
}

export const TEMPLATES: { name: string; label: string; description: string; build: () => TEditorConfiguration }[] = [
  {
    name: 'welcome',
    label: 'Welcome Email',
    description: 'A warm welcome email with heading, text, and CTA button',
    build: () => {
      const headingId = uid()
      const textId = uid()
      const buttonId = uid()
      const containerId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#262626',
            fontFamily: 'MODERN_SANS',
            childrenIds: [containerId],
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: {
              padding: { top: 40, bottom: 40, left: 40, right: 40 },
              display: 'block',
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
            },
            props: { childrenIds: [headingId, textId, buttonId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Welcome to MailForge!', level: 'h1' },
            style: {
              padding: { top: 0, bottom: 16, left: 0, right: 0 },
              color: '#111827',
              fontSize: 32,
              textAlign: 'center',
            },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: {
              text: 'Thank you for joining us. We are excited to have you on board. Click the button below to get started with your first campaign.',
              markdown: false,
            },
            style: {
              padding: { top: 0, bottom: 24, left: 0, right: 0 },
              fontSize: 16,
              color: '#6B7280',
              textAlign: 'center',
            },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: {
              text: 'Get Started',
              url: 'https://mailforge.app',
              buttonBackgroundColor: '#3B82F6',
              buttonTextColor: '#FFFFFF',
              size: 'large',
              buttonStyle: 'rounded',
              fullWidth: false,
            },
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center',
            },
          },
        },
      }
    },
  },
  {
    name: 'newsletter',
    label: 'Newsletter',
    description: 'Two-column newsletter with image, heading, and text',
    build: () => {
      const headingId = uid()
      const colsId = uid()
      const col1ContainerId = uid()
      const col2ContainerId = uid()
      const col1ImageId = uid()
      const col1HeadingId = uid()
      const col1TextId = uid()
      const col2ImageId = uid()
      const col2HeadingId = uid()
      const col2TextId = uid()
      const footerTextId = uid()
      const socialId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#262626',
            fontFamily: 'MODERN_SANS',
            childrenIds: [headingId, colsId, footerTextId, socialId],
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Monthly Newsletter', level: 'h1' },
            style: {
              padding: { top: 32, bottom: 24, left: 24, right: 24 },
              color: '#111827',
              fontSize: 28,
              textAlign: 'center',
            },
          },
        },
        [colsId]: {
          type: 'ColumnsContainer',
          data: {
            props: {
              columnsCount: 2,
              columnsGap: 16,
              contentAlignment: 'top',
              columns: [
                { childrenIds: [col1ContainerId] },
                { childrenIds: [col2ContainerId] },
              ],
            },
            style: { padding: { top: 0, bottom: 24, left: 24, right: 24 } },
          },
        },
        [col1ContainerId]: {
          type: 'Container',
          data: { style: { padding: { top: 0, bottom: 0, left: 0, right: 0 } }, props: { childrenIds: [col1ImageId, col1HeadingId, col1TextId] } },
        },
        [col1ImageId]: {
          type: 'Image',
          data: {
            props: {
              url: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Article+1',
              alt: 'Article 1',
              contentAlignment: 'middle',
              width: 600,
            },
            style: { padding: { top: 0, bottom: 12, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [col1HeadingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Latest Updates', level: 'h2' },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#111827', fontSize: 20 },
          },
        },
        [col1TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Check out our latest features and improvements to make your email marketing even better.' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#6B7280', fontSize: 14 },
          },
        },
        [col2ContainerId]: {
          type: 'Container',
          data: { style: { padding: { top: 0, bottom: 0, left: 0, right: 0 } }, props: { childrenIds: [col2ImageId, col2HeadingId, col2TextId] } },
        },
        [col2ImageId]: {
          type: 'Image',
          data: {
            props: {
              url: 'https://placehold.co/600x400/10B981/FFFFFF?text=Tips',
              alt: 'Tips',
              contentAlignment: 'middle',
              width: 600,
            },
            style: { padding: { top: 0, bottom: 12, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [col2HeadingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Pro Tips', level: 'h2' },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#111827', fontSize: 20 },
          },
        },
        [col2TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Learn how to boost your open rates with these expert email marketing strategies.' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#6B7280', fontSize: 14 },
          },
        },
        [footerTextId]: {
          type: 'Text',
          data: {
            props: { text: 'You received this email because you subscribed to our newsletter. Unsubscribe at any time.' },
            style: { padding: { top: 24, bottom: 16, left: 24, right: 24 }, color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
          },
        },
        [socialId]: {
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
              padding: { top: 0, bottom: 32, left: 0, right: 0 },
              iconSize: 20,
              iconColor: '#9CA3AF',
              iconGap: 16,
              textAlign: 'center',
            },
          },
        },
      }
    },
  },
  {
    name: 'promo',
    label: 'Promotional',
    description: 'Product promo with hero image, features, and CTA',
    build: () => {
      const heroId = uid()
      const headingId = uid()
      const textId = uid()
      const buttonId = uid()
      const featuresContainerId = uid()
      const feature1Id = uid()
      const feature2Id = uid()
      const feature3Id = uid()
      const f1HeadingId = uid()
      const f1TextId = uid()
      const f2HeadingId = uid()
      const f2TextId = uid()
      const f3HeadingId = uid()
      const f3TextId = uid()
      const ctaContainerId = uid()
      const ctaHeadingId = uid()
      const ctaButtonId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#262626',
            fontFamily: 'MODERN_SANS',
            childrenIds: [heroId, headingId, textId, buttonId, featuresContainerId, ctaContainerId],
          },
        },
        [heroId]: {
          type: 'Image',
          data: {
            props: {
              url: 'https://placehold.co/600x300/1E40AF/FFFFFF?text=Special+Offer',
              alt: 'Hero banner',
              contentAlignment: 'middle',
              width: 600,
            },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Limited Time Offer!', level: 'h1' },
            style: { padding: { top: 32, bottom: 16, left: 32, right: 32 }, color: '#111827', fontSize: 30, textAlign: 'center' },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: { text: 'Get 50% off on all premium plans. Upgrade now and unlock all features including advanced analytics, custom templates, and priority support.' },
            style: { padding: { top: 0, bottom: 24, left: 32, right: 32 }, color: '#6B7280', fontSize: 16, textAlign: 'center' },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'Claim Offer', url: 'https://mailforge.app/pricing', buttonBackgroundColor: '#EF4444', buttonTextColor: '#FFFFFF', size: 'large', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 32, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [featuresContainerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 32, bottom: 32, left: 32, right: 32 }, backgroundColor: '#F9FAFB' },
            props: { childrenIds: [feature1Id, feature2Id, feature3Id] },
          },
        },
        [feature1Id]: {
          type: 'Heading',
          data: {
            props: { text: 'Analytics Dashboard', level: 'h3' },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#111827', fontSize: 18 },
          },
        },
        [f1TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Track open rates, click rates, and more with our comprehensive analytics.' },
            style: { padding: { top: 0, bottom: 20, left: 0, right: 0 }, color: '#6B7280', fontSize: 14 },
          },
        },
        [feature2Id]: {
          type: 'Heading',
          data: {
            props: { text: 'AI-Powered Templates', level: 'h3' },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#111827', fontSize: 18 },
          },
        },
        [f2TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Generate beautiful email templates with the power of AI in seconds.' },
            style: { padding: { top: 0, bottom: 20, left: 0, right: 0 }, color: '#6B7280', fontSize: 14 },
          },
        },
        [feature3Id]: {
          type: 'Heading',
          data: {
            props: { text: 'Priority Support', level: 'h3' },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#111827', fontSize: 18 },
          },
        },
        [f3TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Get help when you need it with our dedicated priority support team.' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#6B7280', fontSize: 14 },
          },
        },
        [ctaContainerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 32, bottom: 32, left: 32, right: 32 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
            props: { childrenIds: [ctaHeadingId, ctaButtonId] },
          },
        },
        [ctaHeadingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Dont miss out!', level: 'h2' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#111827', fontSize: 24, textAlign: 'center' },
          },
        },
        [ctaButtonId]: {
          type: 'Button',
          data: {
            props: { text: 'Get Started Now', url: 'https://mailforge.app', buttonBackgroundColor: '#3B82F6', buttonTextColor: '#FFFFFF', size: 'large', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'password-reset',
    label: 'Password Reset',
    description: 'Standard password reset email with link and instructions',
    build: () => {
      const containerId = uid()
      const headingId = uid()
      const textId = uid()
      const buttonId = uid()
      const footerTextId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F0F4FF',
            canvasColor: '#FFFFFF',
            textColor: '#1E293B',
            fontFamily: 'MODERN_SANS',
            childrenIds: [containerId],
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: {
              padding: { top: 40, bottom: 40, left: 40, right: 40 },
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              display: 'block',
            },
            props: { childrenIds: [headingId, textId, buttonId, footerTextId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Reset your password', level: 'h1' },
            style: { padding: { top: 0, bottom: 16, left: 0, right: 0 }, color: '#1E293B', fontSize: 28, textAlign: 'center' },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: { text: 'We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.', markdown: false },
            style: { padding: { top: 0, bottom: 24, left: 0, right: 0 }, color: '#64748B', fontSize: 16, textAlign: 'center' },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'Reset Password', url: 'https://mailforge.app/reset-password', buttonBackgroundColor: '#3B82F6', buttonTextColor: '#FFFFFF', size: 'large', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 24, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [footerTextId]: {
          type: 'Text',
          data: {
            props: { text: 'If you did not request a password reset, you can safely ignore this email.', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#94A3B8', fontSize: 13, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'order-confirmation',
    label: 'Order Confirmation',
    description: 'E-commerce order confirmation with order summary',
    build: () => {
      const containerId = uid()
      const headingId = uid()
      const textId = uid()
      const detailsHeadingId = uid()
      const item1TextId = uid()
      const item2TextId = uid()
      const totalTextId = uid()
      const buttonId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F9FAFB',
            canvasColor: '#FFFFFF',
            textColor: '#111827',
            fontFamily: 'MODERN_SANS',
            childrenIds: [containerId],
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 32, bottom: 32, left: 32, right: 32 }, backgroundColor: '#FFFFFF', borderRadius: 8, display: 'block' },
            props: { childrenIds: [headingId, textId, detailsHeadingId, item1TextId, item2TextId, totalTextId, buttonId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Order Confirmed!', level: 'h1' },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#059669', fontSize: 28, textAlign: 'center' },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: { text: 'Thank you for your purchase. Your order #MF-4281 has been confirmed and is being processed.', markdown: false },
            style: { padding: { top: 0, bottom: 24, left: 0, right: 0 }, color: '#6B7280', fontSize: 16, textAlign: 'center' },
          },
        },
        [detailsHeadingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Order Summary', level: 'h2' },
            style: { padding: { top: 0, bottom: 12, left: 0, right: 0 }, color: '#111827', fontSize: 18 },
          },
        },
        [item1TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Pro Plan - Monthly Subscription  × 1  .........  $29.99', markdown: false },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#374151', fontSize: 14 },
          },
        },
        [item2TextId]: {
          type: 'Text',
          data: {
            props: { text: 'Email Template Pack - Premium  × 2  .........  $39.98', markdown: false },
            style: { padding: { top: 0, bottom: 8, left: 0, right: 0 }, color: '#374151', fontSize: 14 },
          },
        },
        [totalTextId]: {
          type: 'Text',
          data: {
            props: { text: 'Total: $69.97', markdown: false },
            style: { padding: { top: 12, bottom: 24, left: 0, right: 0 }, color: '#111827', fontSize: 18, fontWeight: 'bold' },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'View Order', url: 'https://mailforge.app/orders/4281', buttonBackgroundColor: '#059669', buttonTextColor: '#FFFFFF', size: 'medium', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'event-invitation',
    label: 'Event Invitation',
    description: 'Event invitation with date, time, and location details',
    build: () => {
      const containerId = uid()
      const headingId = uid()
      const dateTextId = uid()
      const descTextId = uid()
      const locationTextId = uid()
      const buttonId = uid()
      const footerTextId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#FFF7ED',
            canvasColor: '#FFFFFF',
            textColor: '#1C1917',
            fontFamily: 'MODERN_SANS',
            childrenIds: [containerId],
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 40, bottom: 40, left: 40, right: 40 }, backgroundColor: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
            props: { childrenIds: [headingId, dateTextId, descTextId, locationTextId, buttonId, footerTextId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: "You're Invited!", level: 'h1' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#EA580C', fontSize: 32, textAlign: 'center' },
          },
        },
        [dateTextId]: {
          type: 'Text',
          data: {
            props: { text: '📅  Saturday, August 15, 2026  ·  7:00 PM', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#111827', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
          },
        },
        [descTextId]: {
          type: 'Text',
          data: {
            props: { text: 'Join us for an evening of networking, drinks, and exciting product announcements. We look forward to seeing you there!', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#6B7280', fontSize: 16, textAlign: 'center' },
          },
        },
        [locationTextId]: {
          type: 'Text',
          data: {
            props: { text: '📍  The Grand Ballroom, 123 Main Street, San Francisco, CA', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#374151', fontSize: 15, textAlign: 'center' },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'RSVP Now', url: 'https://mailforge.app/events/rsvp', buttonBackgroundColor: '#EA580C', buttonTextColor: '#FFFFFF', size: 'large', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [footerTextId]: {
          type: 'Text',
          data: {
            props: { text: 'Space is limited. RSVP by August 1st to reserve your spot.', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'weekly-digest',
    label: 'Weekly Digest',
    description: 'Weekly summary with stats and top content',
    build: () => {
      const headingId = uid()
      const statsHeadingId = uid()
      const stat1TextId = uid()
      const stat2TextId = uid()
      const stat3TextId = uid()
      const topPostsHeadingId = uid()
      const post1TextId = uid()
      const post2TextId = uid()
      const buttonId = uid()
      const footerTextId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#262626',
            fontFamily: 'MODERN_SANS',
            childrenIds: [headingId, statsHeadingId, stat1TextId, stat2TextId, stat3TextId, topPostsHeadingId, post1TextId, post2TextId, buttonId, footerTextId],
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Your Weekly Digest', level: 'h1' },
            style: { padding: { top: 32, bottom: 8, left: 32, right: 32 }, color: '#111827', fontSize: 28, textAlign: 'center' },
          },
        },
        [statsHeadingId]: {
          type: 'Heading',
          data: {
            props: { text: '📊  This Week by the Numbers', level: 'h2' },
            style: { padding: { top: 24, bottom: 12, left: 32, right: 32 }, color: '#111827', fontSize: 18 },
          },
        },
        [stat1TextId]: {
          type: 'Text',
          data: {
            props: { text: '•  12,847  emails sent  (+23% vs last week)', markdown: false },
            style: { padding: { top: 0, bottom: 4, left: 32, right: 32 }, color: '#374151', fontSize: 14 },
          },
        },
        [stat2TextId]: {
          type: 'Text',
          data: {
            props: { text: '•  24.8%  open rate  (+2.1% vs last week)', markdown: false },
            style: { padding: { top: 0, bottom: 4, left: 32, right: 32 }, color: '#374151', fontSize: 14 },
          },
        },
        [stat3TextId]: {
          type: 'Text',
          data: {
            props: { text: '•  5.2%  click rate  (-0.8% vs last week)', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 32, right: 32 }, color: '#374151', fontSize: 14 },
          },
        },
        [topPostsHeadingId]: {
          type: 'Heading',
          data: {
            props: { text: '🔥  Top Performing Content', level: 'h2' },
            style: { padding: { top: 24, bottom: 12, left: 32, right: 32 }, color: '#111827', fontSize: 18 },
          },
        },
        [post1TextId]: {
          type: 'Text',
          data: {
            props: { text: '1.  "10 Tips for Better Email Campaigns"  —  1,247 clicks', markdown: false },
            style: { padding: { top: 0, bottom: 4, left: 32, right: 32 }, color: '#374151', fontSize: 14 },
          },
        },
        [post2TextId]: {
          type: 'Text',
          data: {
            props: { text: '2.  "How to Write Subject Lines That Convert"  —  892 clicks', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 32, right: 32 }, color: '#374151', fontSize: 14 },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'View Full Report', url: 'https://mailforge.app/analytics', buttonBackgroundColor: '#3B82F6', buttonTextColor: '#FFFFFF', size: 'medium', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 24, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [footerTextId]: {
          type: 'Text',
          data: {
            props: { text: 'You receive this because you have analytics notifications enabled. Manage your preferences.', markdown: false },
            style: { padding: { top: 24, bottom: 32, left: 32, right: 32 }, color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'product-launch',
    label: 'Product Launch',
    description: 'New product launch announcement with features and CTA',
    build: () => {
      const heroId = uid()
      const containerId = uid()
      const headingId = uid()
      const textId = uid()
      const feature1Id = uid()
      const feature2Id = uid()
      const feature3Id = uid()
      const buttonId = uid()
      const countdownId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#0F172A',
            canvasColor: '#FFFFFF',
            textColor: '#1E293B',
            fontFamily: 'MODERN_SANS',
            childrenIds: [heroId, containerId],
          },
        },
        [heroId]: {
          type: 'Image',
          data: {
            props: { url: 'https://placehold.co/600x250/7C3AED/FFFFFF?text=Product+Launch', alt: 'Product launch banner', contentAlignment: 'middle', width: 600 },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 40, bottom: 40, left: 40, right: 40 }, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
            props: { childrenIds: [headingId, textId, feature1Id, feature2Id, feature3Id, countdownId, buttonId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Introducing MailForge AI', level: 'h1' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#7C3AED', fontSize: 30, textAlign: 'center' },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: { text: 'Our most powerful update yet. Generate entire email campaigns with AI, get smart recommendations, and automate your workflow.', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#64748B', fontSize: 16, textAlign: 'center' },
          },
        },
        [feature1Id]: {
          type: 'Text',
          data: {
            props: { text: '✨  AI Campaign Generator  —  Create emails from a single prompt', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#1E293B', fontSize: 14 },
          },
        },
        [feature2Id]: {
          type: 'Text',
          data: {
            props: { text: '📊  Smart Analytics  —  AI-powered insights and recommendations', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#1E293B', fontSize: 14 },
          },
        },
        [feature3Id]: {
          type: 'Text',
          data: {
            props: { text: '🔗  New Integrations  —  Connect with 50+ tools you already use', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#1E293B', fontSize: 14 },
          },
        },
        [countdownId]: {
          type: 'CountdownTimer',
          data: {
            props: {
              endDate: '2026-12-31T23:59:59',
              endText: 'Launch is live!',
              digitColor: '#7C3AED',
              labelColor: '#94A3B8',
              gap: 16,
              showLabels: true,
              labels: { days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs' },
            },
            style: { padding: { top: 8, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'Explore Now', url: 'https://mailforge.app', buttonBackgroundColor: '#7C3AED', buttonTextColor: '#FFFFFF', size: 'large', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'feedback-request',
    label: 'Feedback Request',
    description: 'Customer feedback and survey request email',
    build: () => {
      const containerId = uid()
      const headingId = uid()
      const textId = uid()
      const progressId = uid()
      const buttonId = uid()
      const footerTextId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F0FDF4',
            canvasColor: '#FFFFFF',
            textColor: '#1E293B',
            fontFamily: 'MODERN_SANS',
            childrenIds: [containerId],
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 40, bottom: 40, left: 40, right: 40 }, backgroundColor: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20 },
            props: { childrenIds: [headingId, textId, progressId, buttonId, footerTextId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'How are we doing?', level: 'h1' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#059669', fontSize: 28, textAlign: 'center' },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: { text: "We'd love to hear about your experience with MailForge. Your feedback helps us improve and create a better product for you.", markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#6B7280', fontSize: 16, textAlign: 'center' },
          },
        },
        [progressId]: {
          type: 'ProgressBar',
          data: {
            props: { percentage: 80, label: 'User Satisfaction', showPercentage: true, barColor: '#059669', trackColor: '#E5E7EB', height: 16, borderRadius: 8, labelPosition: 'above' },
            style: { padding: { top: 8, bottom: 0, left: 0, right: 0 }, color: '#059669' },
          },
        },
        [buttonId]: {
          type: 'Button',
          data: {
            props: { text: 'Take Survey (2 min)', url: 'https://mailforge.app/feedback', buttonBackgroundColor: '#059669', buttonTextColor: '#FFFFFF', size: 'large', buttonStyle: 'rounded', fullWidth: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, textAlign: 'center' },
          },
        },
        [footerTextId]: {
          type: 'Text',
          data: {
            props: { text: 'As a thank you, all respondents get 1 month of Premium free!', markdown: false },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
          },
        },
      }
    },
  },
  {
    name: 'social-links-only',
    label: 'Social Links',
    description: 'Clean social media links layout',
    build: () => {
      const containerId = uid()
      const headingId = uid()
      const textId = uid()
      const socialId = uid()
      return {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#262626',
            fontFamily: 'MODERN_SANS',
            childrenIds: [containerId],
          },
        },
        [containerId]: {
          type: 'Container',
          data: {
            style: { padding: { top: 48, bottom: 48, left: 32, right: 32 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, backgroundColor: '#FFFFFF', borderRadius: 12 },
            props: { childrenIds: [headingId, textId, socialId] },
          },
        },
        [headingId]: {
          type: 'Heading',
          data: {
            props: { text: 'Follow Us', level: 'h1' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#111827', fontSize: 28, textAlign: 'center' },
          },
        },
        [textId]: {
          type: 'Text',
          data: {
            props: { text: 'Stay connected with us on social media for updates, tips, and more.' },
            style: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, color: '#6B7280', fontSize: 16, textAlign: 'center' },
          },
        },
        [socialId]: {
          type: 'SocialLinks',
          data: {
            props: {
              links: [
                { platform: 'facebook', url: 'https://facebook.com', enabled: true },
                { platform: 'twitter', url: 'https://twitter.com', enabled: true },
                { platform: 'instagram', url: 'https://instagram.com', enabled: true },
                { platform: 'linkedin', url: 'https://linkedin.com', enabled: true },
                { platform: 'youtube', url: 'https://youtube.com', enabled: true },
              ],
              alignment: 'horizontal',
            },
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
              iconSize: 32,
              iconColor: '#3B82F6',
              iconGap: 20,
              textAlign: 'center',
            },
          },
        },
      }
    },
  },
]

export function buildTemplate(name: string): TEditorConfiguration | null {
  const tmpl = TEMPLATES.find((t) => t.name === name)
  return tmpl ? tmpl.build() : null
}

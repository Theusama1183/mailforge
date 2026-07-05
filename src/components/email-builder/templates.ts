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

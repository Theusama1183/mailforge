import { TEditorConfiguration } from '@/components/email-builder/editor/core'

jest.mock('@usewaypoint/email-builder', () => ({
  renderToStaticMarkup: jest.fn(() => {
    throw new Error('mocked – forcing fallback renderer')
  }),
}))

jest.spyOn(console, 'warn').mockImplementation(() => {})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToHtml } = require('@/components/email-builder/render-to-html')

function block(type: string, data: Record<string, unknown> = {}) {
  return { type, data }
}

function layoutWith(...childIds: string[]) {
  return block('EmailLayout', { childrenIds: childIds })
}

describe('renderToHtml', () => {
  describe('required HTML document elements', () => {
    it('contains DOCTYPE, html, head, and body tags', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('t1'),
        t1: block('Text', { props: { text: 'hi' } }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('<body>')
      expect(html).toContain('</body>')
      expect(html).toContain('</html>')
    })
  })

  describe('basic email with header', () => {
    it('renders header text-only layout', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('h1'),
        h1: block('Header', {
          props: { text: 'My Newsletter', layout: 'text-only' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('My Newsletter')
      expect(html).toContain('font-weight:bold')
    })

    it('renders header logo-only layout', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('h1'),
        h1: block('Header', {
          props: {
            layout: 'logo-only',
            logoUrl: 'https://example.com/logo.png',
            logoAlt: 'ACME Logo',
            logoWidth: 120,
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('https://example.com/logo.png')
      expect(html).toContain('ACME Logo')
      expect(html).toContain('width="120"')
    })

    it('wraps header in link when url is provided', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('h1'),
        h1: block('Header', {
          props: {
            text: 'Click me',
            layout: 'text-only',
            url: 'https://example.com',
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('target="_blank"')
    })
  })

  describe('unsubscribe URL placeholder', () => {
    it('includes {{unsubscribe_url}} placeholder in footer', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('f1'),
        f1: block('Footer', {
          props: { showUnsubscribe: true, unsubscribeText: 'Unsubscribe here' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('{{unsubscribe_url}}')
      expect(html).toContain('Unsubscribe here')
    })

    it('omits unsubscribe link when showUnsubscribe is false', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('f1'),
        f1: block('Footer', {
          props: { showUnsubscribe: false },
        }),
      }
      const html = renderToHtml(config)

      expect(html).not.toContain('{{unsubscribe_url}}')
    })

    it('includes copyright and address when provided', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('f1'),
        f1: block('Footer', {
          props: {
            copyright: '2026 MailForge',
            address: '123 Main St, Suite 100',
            showUnsubscribe: true,
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('2026 MailForge')
      expect(html).toContain('123 Main St, Suite 100')
      expect(html).toContain('{{unsubscribe_url}}')
    })
  })

  describe('individual block types', () => {
    it('renders Heading block with specified level', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Heading', {
          props: { text: 'Welcome Aboard', level: 'h1' },
          style: { color: '#111827' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<h1')
      expect(html).toContain('</h1>')
      expect(html).toContain('Welcome Aboard')
      expect(html).toContain('color:#111827')
    })

    it('renders Text block as paragraph', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Text', {
          props: { text: 'This is a paragraph.' },
          style: { fontSize: 16 },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<p')
      expect(html).toContain('This is a paragraph.')
      expect(html).toContain('font-size:16px')
    })

    it('renders Button block with URL and styled anchor', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Button', {
          props: {
            text: 'Get Started',
            url: 'https://app.example.com/start',
            buttonBackgroundColor: '#EF4444',
            buttonTextColor: '#FFFFFF',
            buttonStyle: 'rounded',
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('Get Started')
      expect(html).toContain('https://app.example.com/start')
      expect(html).toContain('background-color:#EF4444')
      expect(html).toContain('border-radius:4px')
    })

    it('renders Divider block with hr element', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Divider', {
          props: { lineColor: '#E5E7EB', lineHeight: 2 },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<hr')
      expect(html).toContain('border-top:1px solid #E5E7EB')
    })

    it('renders Spacer block with fixed height', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Spacer', { props: { height: 40 } }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('height:40px')
    })

    it('renders Image block with src and alt', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Image', {
          props: { url: 'https://example.com/pic.jpg', alt: 'A photo' },
          style: { textAlign: 'center' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('https://example.com/pic.jpg')
      expect(html).toContain('alt="A photo"')
      expect(html).toContain('max-width:100%')
    })

    it('renders Html block with raw contents', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Html', {
          props: { contents: '<table><tr><td>custom</td></tr></table>' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<table><tr><td>custom</td></tr></table>')
    })

    it('renders Avatar block with circle shape', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Avatar', {
          props: {
            imageUrl: 'https://example.com/avatar.jpg',
            size: 48,
            shape: 'circle',
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('https://example.com/avatar.jpg')
      expect(html).toContain('border-radius:50%')
      expect(html).toContain('width:48px')
    })

    it('renders Accordion block with details/summary', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Accordion', {
          props: {
            items: [
              { title: 'Q1', content: 'Answer 1' },
              { title: 'Q2', content: 'Answer 2' },
            ],
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<details')
      expect(html).toContain('<summary')
      expect(html).toContain('Q1')
      expect(html).toContain('Answer 1')
      expect(html).toContain('Q2')
      expect(html).toContain('Answer 2')
    })

    it('renders ButtonGroup with multiple buttons', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('ButtonGroup', {
          props: {
            buttons: [
              { text: 'Yes', url: 'https://yes.com' },
              { text: 'No', url: 'https://no.com' },
            ],
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('Yes')
      expect(html).toContain('https://yes.com')
      expect(html).toContain('No')
      expect(html).toContain('https://no.com')
      expect(html).toContain('display:flex')
    })

    it('renders ProgressBar with percentage', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('ProgressBar', {
          props: {
            percentage: 72,
            label: 'Course progress',
            barColor: '#10B981',
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('72%')
      expect(html).toContain('Course progress')
      expect(html).toContain('width:72%')
      expect(html).toContain('background-color:#10B981')
    })

    it('renders CountdownTimer', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('CountdownTimer', {
          props: { endDate: '2026-12-31', digitColor: '#DC2626' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('Offer ends:')
      expect(html).toContain('2026-12-31')
      expect(html).toContain('color:#DC2626')
    })

    it('renders Video block with YouTube embed', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Video', {
          props: {
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            width: 560,
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('<iframe')
      expect(html).toContain('youtube.com/embed/dQw4w9WgXcQ')
      expect(html).toContain('width="560"')
    })

    it('renders SocialLinks block', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('SocialLinks', {
          props: {
            links: [
              { platform: 'twitter', url: 'https://twitter.com/foo', enabled: true },
              { platform: 'github', url: 'https://github.com/foo', enabled: true },
            ],
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('https://twitter.com/foo')
      expect(html).toContain('https://github.com/foo')
      expect(html).toContain('display:flex')
    })

    it('renders Coupon block with discount code', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Coupon', {
          props: {
            discount: '25% OFF',
            code: 'SAVE25',
            description: 'Limited time offer',
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('25% OFF')
      expect(html).toContain('SAVE25')
      expect(html).toContain('Limited time offer')
      expect(html).toContain('font-family:monospace')
    })

    it('renders ColumnsContainer with table layout', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('cols'),
        cols: block('ColumnsContainer', {
          props: {
            columnsCount: 2,
            columnsGap: 16,
            columns: [
              { childrenIds: ['col1text'] },
              { childrenIds: ['col2text'] },
            ],
          },
        }),
        col1text: block('Text', { props: { text: 'Left column' } }),
        col2text: block('Text', { props: { text: 'Right column' } }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('Left column')
      expect(html).toContain('Right column')
      expect(html).toContain('<table width="100%"')
      expect(html).toContain('<td')
    })
  })

  describe('document validation', () => {
    it('strips unknown block types from config', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('good', 'bad'),
        good: block('Text', { props: { text: 'visible' } }),
        bad: block('UnknownType', { props: { text: 'invisible' } }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('visible')
      expect(html).not.toContain('invisible')
    })
  })

  describe('escapeHtml safety', () => {
    it('escapes HTML entities in user content', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Text', {
          props: { text: '<script>alert("xss")</script>' },
        }),
      }
      const html = renderToHtml(config)

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes ampersands in URLs', () => {
      const config: TEditorConfiguration = {
        root: layoutWith('b1'),
        b1: block('Button', {
          props: {
            text: 'Go',
            url: 'https://example.com?a=1&b=2',
          },
        }),
      }
      const html = renderToHtml(config)

      expect(html).toContain('a=1&amp;b=2')
    })
  })
})

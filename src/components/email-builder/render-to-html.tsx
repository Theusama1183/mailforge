import React from 'react'
import { renderToStaticMarkup as baseRenderToStaticMarkup } from '@usewaypoint/email-builder'

import { TEditorConfiguration } from './editor/core'

function validateDocument(document: TEditorConfiguration): TEditorConfiguration {
  const knownTypes = new Set([
    'Accordion', 'Avatar', 'Button', 'ColumnsContainer', 'Container',
    'CountdownTimer', 'Divider', 'EmailLayout', 'Heading', 'Html',
    'Image', 'ProgressBar', 'Spacer', 'Text', 'Video',
  ])
  const cleaned: TEditorConfiguration = {}
  for (const [id, block] of Object.entries(document)) {
    if (block && block.type && knownTypes.has(block.type)) {
      cleaned[id] = block
    }
  }
  return cleaned
}

export function renderToHtml(document: TEditorConfiguration, rootBlockId = 'root'): string {
  const safeDoc = validateDocument(document)
  try {
    return baseRenderToStaticMarkup(safeDoc, { rootBlockId })
  } catch (err) {
    console.warn('renderToStaticMarkup failed, using fallback renderer:', err)
    return fallbackRender(safeDoc, rootBlockId)
  }
}

function fallbackRender(document: TEditorConfiguration, rootBlockId: string): string {
  const htmlParts: string[] = ['<!DOCTYPE html><html><body>']

  function renderBlock(id: string): void {
    const block = document[id]
    if (!block || !block.data) return

    const { type, data } = block
    const style = data.style || {}

    switch (type) {
      case 'EmailLayout':
        if (data.childrenIds) {
          data.childrenIds.forEach((childId: string) => renderBlock(childId))
        }
        break
      case 'Container':
        htmlParts.push(`<div style="${cssFromStyle(style)}">`)
        if (data.props?.childrenIds) {
          data.props.childrenIds.forEach((childId: string) => renderBlock(childId))
        }
        htmlParts.push('</div>')
        break
      case 'ColumnsContainer':
        htmlParts.push(`<div style="${cssFromStyle(style)}"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>`)
        const columns = data.props?.columns || []
        const count = data.props?.columnsCount || columns.length
        const gap = data.props?.columnsGap || 0
        columns.slice(0, count).forEach((col: { childrenIds: string[] }) => {
          htmlParts.push(`<td style="padding:0 ${gap / 2}px; vertical-align:top; width:${100 / count}%">`)
          if (col.childrenIds) {
            col.childrenIds.forEach((childId: string) => renderBlock(childId))
          }
          htmlParts.push('</td>')
        })
        htmlParts.push('</tr></table></div>')
        break
      case 'Heading':
        const level = data.props?.level || 'h2'
        htmlParts.push(`<${level} style="${cssFromStyle(style)}">${escapeHtml(data.props?.text || '')}</${level}>`)
        break
      case 'Text':
        const text = data.props?.text || ''
        if (data.props?.markdown) {
          htmlParts.push(`<div style="${cssFromStyle(style)}">${escapeHtml(text)}</div>`)
        } else {
          htmlParts.push(`<p style="${cssFromStyle(style)}">${escapeHtml(text)}</p>`)
        }
        break
      case 'Button':
        const btnText = data.props?.text || 'Button'
        const btnUrl = data.props?.url || '#'
        const btnBg = data.props?.buttonBackgroundColor || '#3B82F6'
        const btnColor = data.props?.buttonTextColor || '#FFFFFF'
        const btnRadius = data.props?.buttonStyle === 'pill' ? 64 : data.props?.buttonStyle === 'rounded' ? 4 : 0
        htmlParts.push(`<div style="text-align:${style.textAlign || 'center'};padding:${cssPadding(style.padding)}"><a href="${escapeHtml(btnUrl)}" style="display:inline-block;background-color:${btnBg};color:${btnColor};border-radius:${btnRadius}px;font-size:${style.fontSize || 16}px;font-weight:${style.fontWeight || 'bold'};padding:12px 24px;text-decoration:none">${escapeHtml(btnText)}</a></div>`)
        break
      case 'Image':
        htmlParts.push(`<div style="text-align:${style.textAlign || 'center'};padding:${cssPadding(style.padding)}"><img src="${escapeHtml(data.props?.url || '')}" alt="${escapeHtml(data.props?.alt || '')}" style="max-width:100%;height:auto" /></div>`)
        break
      case 'Divider':
        htmlParts.push(`<div style="padding:${cssPadding(style.padding)}"><hr style="border:none;border-top:1px solid ${data.props?.lineColor || '#CCCCCC'};height:${data.props?.lineHeight || 1}px" /></div>`)
        break
      case 'Spacer':
        htmlParts.push(`<div style="height:${data.props?.height || 20}px"></div>`)
        break
      case 'Avatar':
        htmlParts.push(`<div style="text-align:${style.textAlign || 'center'};padding:${cssPadding(style.padding)}"><img src="${escapeHtml(data.props?.imageUrl || '')}" alt="avatar" style="width:${data.props?.size || 64}px;height:${data.props?.size || 64}px;border-radius:${data.props?.shape === 'circle' ? '50%' : data.props?.shape === 'rounded' ? '8px' : '0'}" /></div>`)
        break
      case 'Html':
        htmlParts.push(`<div style="padding:${cssPadding(style.padding)}">${data.props?.contents || ''}</div>`)
        break
      case 'Video':
        const vUrl = data.props?.videoUrl || ''
        const vAlt = data.props?.alt || 'Video'
        const vWidth = data.props?.width || 560
        const vRadius = data.props?.borderRadius || style.borderRadius || 8
        const vThumb = data.props?.thumbnailUrl || ''
        const vId = getVideoId(vUrl)
        let vEmbed = ''
        if (vId) {
          if (vUrl.includes('youtube') || vUrl.includes('youtu.be')) {
            vEmbed = `<iframe src="https://www.youtube.com/embed/${vId}" width="${vWidth}" height="${Math.round(vWidth * 9 / 16)}" style="border:0;border-radius:${vRadius}px" allowfullscreen></iframe>`
          } else if (vUrl.includes('vimeo')) {
            vEmbed = `<iframe src="https://player.vimeo.com/video/${vId}" width="${vWidth}" height="${Math.round(vWidth * 9 / 16)}" style="border:0;border-radius:${vRadius}px" allowfullscreen></iframe>`
          }
        }
        if (vEmbed) {
          htmlParts.push(`<div style="${cssFromStyle(style)}">${vEmbed}</div>`)
        } else if (vThumb) {
          htmlParts.push(`<div style="${cssFromStyle(style)}"><a href="${escapeHtml(vUrl)}" target="_blank"><img src="${escapeHtml(vThumb)}" alt="${escapeHtml(vAlt)}" style="max-width:100%;width:${vWidth}px;border-radius:${vRadius}px" /></a></div>`)
        } else {
          htmlParts.push(`<div style="text-align:center;padding:${cssPadding(style.padding)};color:#9CA3AF;font-size:14px"><a href="${escapeHtml(vUrl)}" style="color:#3B82F6">${vUrl || 'Video'}</a></div>`)
        }
        break
      case 'CountdownTimer':
        htmlParts.push(`<div style="${cssFromStyle(style)};font-size:14px;color:${data.props?.digitColor || '#111827'}">${data.props?.endDate ? 'Offer ends: ' + data.props.endDate : (data.props?.endText || 'Set an end date')}</div>`)
        break
      case 'ProgressBar':
        const pct = Math.max(0, Math.min(100, data.props?.percentage || 50))
        const barColor = data.props?.barColor || '#3B82F6'
        const trackColor = data.props?.trackColor || '#E5E7EB'
        const barH = data.props?.height || 12
        const barR = data.props?.borderRadius || 6
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;color:${style.color || '#374151'};margin-bottom:4px"><span>${escapeHtml(data.props?.label || '')}</span><span>${Math.round(pct)}%</span></div><div style="width:100%;height:${barH}px;background-color:${trackColor};border-radius:${barR}px;overflow:hidden"><div style="width:${pct}%;height:100%;background-color:${barColor};border-radius:${barR}px"></div></div></div>`)
        break
      case 'Accordion':
        const items = data.props?.items || []
        const titleColor = data.props?.titleColor || '#111827'
        const contentColor = data.props?.contentColor || '#6B7280'
        const borderColor = data.props?.borderColor || '#E5E7EB'
        const bgColor = data.props?.backgroundColor || '#FFFFFF'
        const aRadius = data.props?.borderRadius || 8
        const aGap = data.props?.gap || 4
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="display:flex;flex-direction:column;gap:${aGap}px">`)
        items.forEach((item: any) => {
          htmlParts.push(`<details style="background-color:${bgColor};border:1px solid ${borderColor};border-radius:${aRadius}px;padding:12px 16px"><summary style="font-weight:600;color:${titleColor};cursor:pointer">${escapeHtml(item.title || '')}</summary><div style="margin-top:8px;color:${contentColor};font-size:14px">${escapeHtml(item.content || '')}</div></details>`)
        })
        htmlParts.push('</div></div>')
        break
      default:
        break
    }
  }

  renderBlock(rootBlockId)
  htmlParts.push('</body></html>')
  return htmlParts.join('\n')
}

function cssFromStyle(style: Record<string, any>): string {
  const parts: string[] = []
  if (style.color) parts.push(`color:${style.color}`)
  if (style.backgroundColor) parts.push(`background-color:${style.backgroundColor}`)
  if (style.fontSize) parts.push(`font-size:${style.fontSize}px`)
  if (style.fontWeight) parts.push(`font-weight:${style.fontWeight}`)
  if (style.textAlign) parts.push(`text-align:${style.textAlign}`)
  if (style.fontFamily) parts.push(`font-family:${style.fontFamily}`)
  if (style.borderColor) parts.push(`border:1px solid ${style.borderColor}`)
  if (style.borderRadius != null) parts.push(`border-radius:${style.borderRadius}px`)
  if (style.padding) parts.push(`padding:${cssPadding(style.padding)}`)
  if (style.display) parts.push(`display:${style.display}`)
  if (style.flexDirection) parts.push(`flex-direction:${style.flexDirection}`)
  if (style.gap != null) parts.push(`gap:${style.gap}px`)
  if (style.alignItems) parts.push(`align-items:${style.alignItems}`)
  if (style.justifyContent) parts.push(`justify-content:${style.justifyContent}`)
  return parts.join(';')
}

function getVideoId(url: string | null | undefined): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return ytMatch[1]
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (vimeoMatch) return vimeoMatch[1]
  return null
}

function cssPadding(padding: { top?: number; bottom?: number; left?: number; right?: number } | null | undefined): string {
  if (!padding) return '0'
  return `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

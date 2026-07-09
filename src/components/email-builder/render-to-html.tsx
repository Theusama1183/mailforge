import React from 'react'
import { renderToStaticMarkup as baseRenderToStaticMarkup } from '@usewaypoint/email-builder'

import { TEditorConfiguration } from './editor/core'

function validateDocument(document: TEditorConfiguration): TEditorConfiguration {
  const knownTypes = new Set([
    'Accordion', 'Avatar', 'Button', 'ButtonGroup', 'ColumnsContainer', 'Container',
    'CountdownTimer', 'Divider', 'EmailLayout', 'Header', 'Heading', 'Html',
    'Image', 'ProgressBar', 'SocialLinks', 'Spacer', 'Text', 'Video',
    'Footer', 'MenuNav', 'Map', 'Coupon', 'ProductGrid', 'Testimonial',
    'PricingTable', 'CalendarEvent',
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
      case 'Header':
        const hLogoUrl = data.props?.logoUrl || ''
        const hText = data.props?.text || ''
        const hUrl = data.props?.url
        const hLayout = data.props?.layout || 'logo-left'
        const hLogoWidth = data.props?.logoWidth || 200
        const hLogoAlt = data.props?.logoAlt || 'Logo'
        const hTextColor = data.props?.textColor || '#111827'
        const hFontSize = data.props?.fontSize || 24
        let hInner = ''
        if (hLayout === 'text-only') {
          hInner = `<span style="color:${hTextColor};font-size:${hFontSize}px;font-weight:bold">${escapeHtml(hText || 'Header')}</span>`
        } else if (hLayout === 'logo-only') {
          hInner = `<img src="${escapeHtml(hLogoUrl)}" alt="${escapeHtml(hLogoAlt)}" width="${hLogoWidth}" style="display:block;max-width:100%" />`
        } else if (hLayout === 'logo-above') {
          hInner = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr><td style="text-align:center;padding-bottom:8px"><img src="${escapeHtml(hLogoUrl)}" alt="${escapeHtml(hLogoAlt)}" width="${hLogoWidth}" style="display:block;max-width:100%" /></td></tr><tr><td style="text-align:center"><span style="color:${hTextColor};font-size:${hFontSize}px;font-weight:bold">${escapeHtml(hText)}</span></td></tr></table>`
        } else {
          hInner = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr><td style="vertical-align:middle;padding-right:12px"><img src="${escapeHtml(hLogoUrl)}" alt="${escapeHtml(hLogoAlt)}" width="${hLogoWidth}" style="display:block;max-width:100%" /></td><td style="vertical-align:middle"><span style="color:${hTextColor};font-size:${hFontSize}px;font-weight:bold">${escapeHtml(hText)}</span></td></tr></table>`
        }
        if (hUrl) {
          hInner = `<a href="${escapeHtml(hUrl)}" target="_blank" style="text-decoration:none">${hInner}</a>`
        }
        htmlParts.push(`<div style="${cssFromStyle(style)}">${hInner}</div>`)
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
      case 'ButtonGroup':
        const bgButtons = data.props?.buttons || []
        const bgGap = data.props?.style?.gap || style.gap || 8
        const bgBackgroundColor = data.props?.style?.buttonBackgroundColor || '#3B82F6'
        const bgTextColor = data.props?.style?.buttonTextColor || '#FFFFFF'
        const bgRadius = data.props?.style?.buttonBorderRadius ?? 4
        const bgFontSize = data.props?.style?.buttonFontSize || 14
        const bgFullWidth = data.props?.style?.fullWidth
        const bgDirection = data.props?.alignment === 'vertical' ? 'column' : 'row'
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="display:flex;flex-direction:${bgDirection};gap:${bgGap}px;${bgFullWidth ? 'width:100%' : ''}">`)
        bgButtons.forEach((btn: any) => {
          if (!btn.text && !btn.url) return
          const btnStyle = `display:inline-block;background-color:${bgBackgroundColor};color:${bgTextColor};border-radius:${bgRadius}px;font-size:${bgFontSize}px;padding:10px 20px;text-decoration:none;${bgFullWidth ? 'width:100%;text-align:center' : ''}`
          htmlParts.push(`<a href="${escapeHtml(btn.url || '#')}" style="${btnStyle}">${btn.leftIcon || ''}${escapeHtml(btn.text || 'Button')}${btn.rightIcon || ''}</a>`)
        })
        htmlParts.push('</div></div>')
        break
      case 'Footer':
        htmlParts.push(`<div style="${cssFromStyle(style)}"><hr style="border:none;border-top:1px solid #E5E7EB" />`)
        htmlParts.push(`<div style="padding:16px 0;font-size:${data.props?.fontSize || 12}px;color:${data.props?.textColor || '#6B7280'};line-height:1.6">`)
        if (data.props?.copyright) htmlParts.push(`<div style="margin-bottom:8px">${escapeHtml(data.props.copyright)}</div>`)
        if (data.props?.address) htmlParts.push(`<div style="margin-bottom:8px">${escapeHtml(data.props.address)}</div>`)
        if (data.props?.showUnsubscribe !== false) {
          htmlParts.push(`<div style="margin-bottom:8px"><a href="{{unsubscribe_url}}" style="color:${data.props?.linkColor || '#3B82F6'};text-decoration:underline">${escapeHtml(data.props?.unsubscribeText || 'Unsubscribe')}</a></div>`)
        }
        htmlParts.push('</div></div>')
        break
      case 'MenuNav': {
        const menuLinks = data.props?.links || []
        const menuAlign = data.props?.alignment || 'center'
        const menuDir = data.props?.layout === 'vertical' ? 'column' : 'row'
        const menuFs = data.props?.fontSize || 14
        const menuLc = data.props?.linkColor || '#374151'
        const menuSep = data.props?.separator || 'none'
        const sepMap: Record<string, string> = { dot: '\u00B7', line: '|', chevron: '\u203A' }
        const sepChar = sepMap[menuSep] || ''
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="display:flex;flex-direction:${menuDir};align-items:center;justify-content:${menuAlign === 'left' ? 'flex-start' : menuAlign === 'right' ? 'flex-end' : 'center'};flex-wrap:wrap">`)
        menuLinks.forEach((link: any, i: number) => {
          if (i > 0 && menuSep !== 'none' && menuDir === 'row') htmlParts.push(`<span style="color:#D1D5DB;padding:0 10px;font-size:${menuFs}px">${escapeHtml(sepChar)}</span>`)
          htmlParts.push(`<a href="${escapeHtml(link.url || '#')}" style="color:${menuLc};font-size:${menuFs}px;text-decoration:none;padding:${menuDir === 'column' ? '2px 0' : '4px 10px'};display:inline-block">${escapeHtml(link.label || `Link ${i+1}`)}</a>`)
          if (i > 0 && menuSep !== 'none' && menuDir === 'column') htmlParts.push(`<div style="border-top:1px solid #D1D5DB;width:100%;margin:4px 0"></div>`)
        })
        htmlParts.push('</div></div>')
        break
      }
      case 'Map': {
        const mapLat = data.props?.latitude ?? 40.7128
        const mapLng = data.props?.longitude ?? -74.006
        const mapZoom = data.props?.zoom ?? 14
        const mapW = data.props?.width ?? 600
        const mapH = data.props?.height ?? 300
        const mapStyle = data.props?.mapStyle ?? 'roadmap'
        const mapLabel = data.props?.markerLabel ? `&markers=label:${escapeHtml(data.props.markerLabel.slice(0,1))}|${mapLat},${mapLng}` : `&markers=${mapLat},${mapLng}`
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapLat},${mapLng}&zoom=${mapZoom}&size=${mapW}x${mapH}&maptype=${mapStyle}${mapLabel}&key=YOUR_API_KEY`
        const mapLink = data.props?.linkUrl || `https://www.google.com/maps?q=${mapLat},${mapLng}`
        htmlParts.push(`<div style="${cssFromStyle(style)}"><a href="${escapeHtml(mapLink)}" target="_blank"><img src="${escapeHtml(mapUrl)}" alt="${escapeHtml(data.props?.address || 'Map')}" width="${mapW}" height="${mapH}" style="max-width:100%;height:auto;display:block" /></a></div>`)
        break
      }
      case 'Coupon': {
        const couponBg = data.props?.couponColor || '#FEF2F2'
        const couponTextColor = data.props?.textColor || '#111827'
        const dashed = data.props?.showDashedBorder !== false
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="background-color:${couponBg};border-radius:12px;padding:24px;${dashed ? `border:2px dashed ${couponTextColor}40` : ''}">`)
        if (data.props?.discount) htmlParts.push(`<div style="font-size:32px;font-weight:800;color:${couponTextColor};line-height:1.2;margin-bottom:4px">${escapeHtml(data.props.discount)}</div>`)
        if (data.props?.description) htmlParts.push(`<div style="font-size:14px;color:${couponTextColor};opacity:0.7;margin-bottom:12px">${escapeHtml(data.props.description)}</div>`)
        if (data.props?.code) htmlParts.push(`<div style="display:inline-block;background-color:${couponTextColor};color:${couponBg};font-size:20px;font-weight:700;font-family:monospace;padding:8px 24px;border-radius:6px;letter-spacing:4px;margin-bottom:12px">${escapeHtml(data.props.code)}</div>`)
        if (data.props?.expiry) htmlParts.push(`<div style="font-size:12px;color:${couponTextColor};opacity:0.6;margin-bottom:4px">${escapeHtml(data.props.expiry)}</div>`)
        if (data.props?.disclaimer) htmlParts.push(`<div style="font-size:11px;color:${couponTextColor};opacity:0.5">${escapeHtml(data.props.disclaimer)}</div>`)
        if (data.props?.buttonText && data.props?.buttonUrl) {
          const btnCol = data.props?.buttonColor || '#3B82F6'
          htmlParts.push(`<div style="margin-top:16px"><a href="${escapeHtml(data.props.buttonUrl)}" style="display:inline-block;background-color:${btnCol};color:#FFFFFF;font-size:14px;font-weight:700;padding:10px 24px;border-radius:6px;text-decoration:none">${escapeHtml(data.props.buttonText)}</a></div>`)
        }
        htmlParts.push('</div></div>')
        break
      }
      case 'ProductGrid': {
        const pgProducts = data.props?.products || []
        const pgCols = parseInt(data.props?.columns || '2', 10)
        const pgGap = data.props?.gap || 16
        const pgBtnCol = data.props?.buttonColor || '#3B82F6'
        const pgBtnTxtCol = data.props?.buttonTextColor || '#FFFFFF'
        const pgCardBg = data.props?.cardBackgroundColor || '#FFFFFF'
        const pgTitleCol = data.props?.titleColor || '#111827'
        const pgPriceCol = data.props?.priceColor || '#6B7280'
        const pgRadius = data.props?.borderRadiusSize ?? 8
        htmlParts.push(`<div style="${cssFromStyle(style)}"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>`)
        pgProducts.forEach((p: any, i: number) => {
          if (i > 0 && i % pgCols === 0) htmlParts.push('</tr><tr>')
          htmlParts.push(`<td style="width:${100/pgCols}%;padding:${pgGap/2}px;vertical-align:top"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${pgCardBg};border-radius:${pgRadius}px;overflow:hidden"><tr><td style="text-align:center"><img src="${escapeHtml(p.imageUrl || 'https://placehold.co/400x300/F8F8F8/CCC?text=Product')}" alt="${escapeHtml(p.title || '')}" width="100%" style="display:block;max-width:100%;height:auto" /></td></tr><tr><td style="padding:12px 12px 0"><div style="font-size:14px;font-weight:700;color:${pgTitleCol};margin-bottom:4px">${escapeHtml(p.title || 'Product')}</div></td></tr>`)
          if (p.price || p.originalPrice) {
            htmlParts.push(`<tr><td style="padding:0 12px"><div style="font-size:16px;font-weight:600;color:${pgPriceCol}">`)
            if (p.originalPrice) htmlParts.push(`<span style="text-decoration:line-through;color:#9CA3AF;margin-right:6px;font-size:13px">${escapeHtml(p.originalPrice)}</span>`)
            htmlParts.push(`${escapeHtml(p.price || '')}</div></td></tr>`)
          }
          if (p.ctaText && p.ctaUrl) htmlParts.push(`<tr><td style="padding:12px"><a href="${escapeHtml(p.ctaUrl)}" style="display:inline-block;background-color:${pgBtnCol};color:${pgBtnTxtCol};font-size:12px;font-weight:700;padding:8px 16px;border-radius:4px;text-decoration:none">${escapeHtml(p.ctaText)}</a></td></tr>`)
          htmlParts.push('</table></td>')
        })
        htmlParts.push('</tr></table></div>')
        break
      }
      case 'Testimonial': {
        const tQuote = data.props?.quote || ''
        const tAuthor = data.props?.author || ''
        const tTitle = data.props?.title || ''
        const tAvatar = data.props?.avatarUrl || ''
        const tStars = data.props?.starRating ?? 5
        const tShowStars = data.props?.showStars !== false
        const tQuoteCol = data.props?.quoteColor || '#374151'
        const tAuthorCol = data.props?.authorColor || '#111827'
        const tTitleCol = data.props?.titleColor || '#6B7280'
        const tBg = data.props?.backgroundColor || '#F9FAFB'
        const tBorder = data.props?.borderColor || '#E5E7EB'
        const tFs = data.props?.fontSize || 16
        const tShowQuote = data.props?.showQuoteMark !== false
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="background-color:${tBg};border:1px solid ${tBorder};border-radius:12px;padding:24px">`)
        if (tShowStars && tStars > 0) {
          const filled = '&#9733;'.repeat(Math.round(tStars))
          const empty = '&#9733;'.repeat(5 - Math.round(tStars))
          htmlParts.push(`<div style="margin-bottom:12px;color:#F59E0B;font-size:20px">${filled}<span style="color:#E5E7EB">${empty}</span></div>`)
        }
        if (tShowQuote) htmlParts.push(`<div style="font-size:48px;line-height:1;color:${tQuoteCol};opacity:0.2;margin-bottom:-16px;text-align:left">&ldquo;</div>`)
        htmlParts.push(`<div style="font-size:${tFs}px;color:${tQuoteCol};line-height:1.6;font-style:italic;margin-bottom:16px">${escapeHtml(tQuote || 'Your testimonial quote goes here...')}</div>`)
        if (tAuthor || tAvatar) {
          htmlParts.push(`<div style="display:flex;align-items:center;justify-content:center;gap:12px">`)
          if (tAvatar) htmlParts.push(`<img src="${escapeHtml(tAvatar)}" alt="${escapeHtml(tAuthor)}" width="48" height="48" style="border-radius:50%;object-fit:cover" />`)
          if (tAuthor || tTitle) htmlParts.push(`<div style="text-align:left">`)
          if (tAuthor) htmlParts.push(`<div style="font-weight:700;color:${tAuthorCol};font-size:14px">${escapeHtml(tAuthor)}</div>`)
          if (tTitle) htmlParts.push(`<div style="font-size:12px;color:${tTitleCol}">${escapeHtml(tTitle)}</div>`)
          if (tAuthor || tTitle) htmlParts.push('</div>')
          htmlParts.push('</div>')
        }
        htmlParts.push('</div></div>')
        break
      }
      case 'PricingTable': {
        const ptPlans = data.props?.plans || []
        const ptGap = data.props?.gap || 12
        const ptBtnCol = data.props?.buttonColor || '#3B82F6'
        const ptBtnTxtCol = data.props?.buttonTextColor || '#FFFFFF'
        const ptCardBg = data.props?.cardBackgroundColor || '#FFFFFF'
        const ptCardR = data.props?.cardBorderRadius ?? 12
        const ptHdrBg = data.props?.headerBackgroundColor || '#F9FAFB'
        const ptHdrTxt = data.props?.headerTextColor || '#111827'
        const ptFeatCol = data.props?.featureColor || '#6B7280'
        const ptPriceCol = data.props?.priceColor || '#111827'
        htmlParts.push(`<div style="${cssFromStyle(style)}"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>`)
        ptPlans.forEach((plan: any, i: number) => {
          const accent = plan.accentColor || ptBtnCol
          htmlParts.push(`<td style="width:${100/ptPlans.length}%;padding:${ptGap/2}px;vertical-align:top"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${ptCardBg};border-radius:${ptCardR}px;overflow:hidden;${plan.highlighted ? `border:2px solid ${accent}` : 'border:1px solid #E5E7EB'}">`)
          if (plan.highlighted) htmlParts.push(`<tr><td style="background-color:${accent};color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;padding:4px 0;text-transform:uppercase">Most Popular</td></tr>`)
          htmlParts.push(`<tr><td style="background-color:${ptHdrBg};padding:20px 12px;text-align:center"><div style="font-size:14px;font-weight:700;color:${ptHdrTxt};margin-bottom:8px">${escapeHtml(plan.name || 'Plan')}</div><div><span style="font-size:12px;color:${ptPriceCol}">${escapeHtml(plan.currency || '$')}</span><span style="font-size:28px;font-weight:800;color:${ptPriceCol}">${escapeHtml(plan.price || '0')}</span>${plan.period ? `<span style="font-size:12px;color:${ptFeatCol}"> /${escapeHtml(plan.period)}</span>` : ''}</div>`)
          if (plan.description) htmlParts.push(`<div style="font-size:12px;color:${ptFeatCol};margin-top:8px">${escapeHtml(plan.description)}</div>`)
          htmlParts.push('</td></tr>')
          if (data.props?.showFeatures !== false && plan.features) {
            htmlParts.push('<tr><td style="padding:12px">')
            plan.features.forEach((feat: any) => {
              const included = feat.included !== false
              htmlParts.push(`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;color:${ptFeatCol}"><span style="color:${included ? '#10B981' : '#D1D5DB'};font-size:16px">${included ? '\u2713' : '\u2013'}</span><span style="${!included ? 'text-decoration:line-through;opacity:0.5' : ''}">${escapeHtml(feat.text || '')}</span></div>`)
            })
            htmlParts.push('</td></tr>')
          }
          if (plan.ctaText && plan.ctaUrl) htmlParts.push(`<tr><td style="padding:12px;text-align:center"><a href="${escapeHtml(plan.ctaUrl)}" style="display:inline-block;background-color:${ptBtnCol};color:${ptBtnTxtCol};font-size:13px;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none">${escapeHtml(plan.ctaText)}</a></td></tr>`)
          htmlParts.push('</table></td>')
        })
        htmlParts.push('</tr></table></div>')
        break
      }
      case 'CalendarEvent': {
        const ceTitle = data.props?.title || ''
        const ceDesc = data.props?.description || ''
        const ceDate = data.props?.date || ''
        const ceTime = data.props?.time || ''
        const ceEndTime = data.props?.endTime || ''
        const ceLocation = data.props?.location || ''
        const ceShowBadge = data.props?.showDateBadge !== false
        const ceMonth = data.props?.monthName || ''
        const ceDayNum = data.props?.dateNumber || ''
        const ceDayWeek = data.props?.dayOfWeek || ''
        const ceAccent = data.props?.accentColor || '#3B82F6'
        const ceTextCol = data.props?.textColor || '#111827'
        const ceCtaText = data.props?.ctaText || ''
        const ceCtaUrl = data.props?.ctaUrl || ''
        htmlParts.push(`<div style="${cssFromStyle(style)}"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>`)
        if (ceShowBadge && (ceMonth || ceDayNum || ceDayWeek)) {
          htmlParts.push(`<td style="width:80px;vertical-align:top;padding-right:16px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${ceAccent};border-radius:8px;overflow:hidden">`)
          if (ceMonth) htmlParts.push(`<tr><td style="background-color:${ceAccent};color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;padding:4px 8px;text-transform:uppercase">${escapeHtml(ceMonth)}</td></tr>`)
          if (ceDayNum) htmlParts.push(`<tr><td style="background-color:#FFFFFF;color:${ceAccent};font-size:28px;font-weight:800;text-align:center;padding:8px">${escapeHtml(ceDayNum)}</td></tr>`)
          if (ceDayWeek) htmlParts.push(`<tr><td style="background-color:#FFFFFF;color:${ceTextCol};font-size:11px;font-weight:600;text-align:center;padding:0 8px 8px">${escapeHtml(ceDayWeek)}</td></tr>`)
          htmlParts.push('</table></td>')
        }
        htmlParts.push('<td style="vertical-align:top">')
        if (ceTitle) htmlParts.push(`<div style="font-size:18px;font-weight:700;color:${ceTextCol};margin-bottom:8px">${escapeHtml(ceTitle)}</div>`)
        if (ceDesc) htmlParts.push(`<div style="font-size:13px;color:#6B7280;margin-bottom:8px;line-height:1.4">${escapeHtml(ceDesc)}</div>`)
        let dateLine = ''
        if (ceDate) dateLine += ceDate
        if (ceTime) {
          dateLine += ceTime
          if (ceEndTime) dateLine += ` - ${ceEndTime}`
        }
        if (dateLine) htmlParts.push(`<div style="font-size:13px;color:#6B7280;margin-bottom:4px">${escapeHtml(dateLine)}</div>`)
        if (ceLocation) htmlParts.push(`<div style="font-size:13px;color:#6B7280;margin-bottom:8px">${escapeHtml(ceLocation)}</div>`)
        if (ceCtaText && ceCtaUrl) htmlParts.push(`<a href="${escapeHtml(ceCtaUrl)}" style="display:inline-block;background-color:${ceAccent};color:#FFFFFF;font-size:12px;font-weight:700;padding:8px 16px;border-radius:6px;text-decoration:none;margin-top:4px">${escapeHtml(ceCtaText)}</a>`)
        htmlParts.push('</td></tr></table></div>')
        break
      }
      case 'SocialLinks':
        const slLinks = data.props?.links || []
        const slAlignment = data.props?.alignment || 'horizontal'
        const slSize = data.props?.style?.iconSize || 24
        const slColor = data.props?.style?.iconColor || '#6B7280'
        const slGap = data.props?.style?.iconGap || 8
        const slBg = data.props?.style?.iconBackgroundColor || 'transparent'
        const slRadius = data.props?.style?.iconBorderRadius ?? 4
        const slPadding = data.props?.style?.iconPadding ?? 4
        const slBorderWidth = data.props?.style?.iconBorderWidth ?? 0
        const slBorderColor = data.props?.style?.iconBorderColor || '#E5E7EB'
        const slBorderStyle = data.props?.style?.iconBorderStyle || 'solid'
        const slDir = slAlignment === 'vertical' ? 'column' : 'row'
        htmlParts.push(`<div style="${cssFromStyle(style)}"><div style="display:flex;flex-direction:${slDir};gap:${slGap}px;align-items:center;justify-content:${style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start'}">`)
        slLinks.forEach((link: any) => {
          if (!link.enabled || !link.url) return
          const iconSize = slSize + slPadding * 2
          htmlParts.push(`<a href="${escapeHtml(link.url)}" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;width:${iconSize}px;height:${iconSize}px;background-color:${slBg};border:${slBorderWidth}px ${slBorderStyle} ${slBorderColor};border-radius:${slRadius}px;text-decoration:none" aria-label="${escapeHtml(link.platform)}"><span style="font-size:${slSize}px;color:${slColor}">${link.platform.charAt(0).toUpperCase()}</span></a>`)
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

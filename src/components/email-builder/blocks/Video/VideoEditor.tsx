import React from 'react'

import { VideoProps } from './VideoPropsSchema'

function getPadding(padding: { top: number; bottom: number; right: number; left: number } | null | undefined): string | undefined {
  return padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined
}

function getVideoId(url: string | null | undefined): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return ytMatch[1]
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (vimeoMatch) return vimeoMatch[1]
  return null
}

function getThumbnailUrl(videoUrl: string | null | undefined, thumbnailUrl: string | null | undefined): string {
  if (thumbnailUrl) return thumbnailUrl
  const id = getVideoId(videoUrl)
  if (!id) return ''
  if (videoUrl?.includes('youtube') || videoUrl?.includes('youtu.be')) {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
  }
  return ''
}

export default function VideoEditor({ style, props }: VideoProps) {
  const videoUrl = props?.videoUrl
  const alt = props?.alt ?? 'Video'
  const width = props?.width ?? 560
  const borderRadius = props?.borderRadius ?? style?.borderRadius ?? 8
  const thumbnailUrl = getThumbnailUrl(videoUrl, props?.thumbnailUrl)
  const videoId = getVideoId(videoUrl)

  let embedHtml = ''
  if (videoId) {
    if (videoUrl?.includes('youtube') || videoUrl?.includes('youtu.be')) {
      embedHtml = `<iframe src="https://www.youtube.com/embed/${videoId}" width="${width}" height="${Math.round(width * 9 / 16)}" style="border:0;border-radius:${borderRadius}px" allowfullscreen></iframe>`
    } else if (videoUrl?.includes('vimeo')) {
      embedHtml = `<iframe src="https://player.vimeo.com/video/${videoId}" width="${width}" height="${Math.round(width * 9 / 16)}" style="border:0;border-radius:${borderRadius}px" allowfullscreen></iframe>`
    }
  }

  const containerStyle: React.CSSProperties = {
    textAlign: (style?.textAlign as React.CSSProperties['textAlign']) ?? 'center',
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
  }

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    maxWidth: '100%',
    borderRadius,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  }

  return (
    <div style={containerStyle}>
      {embedHtml ? (
        <div style={wrapperStyle} dangerouslySetInnerHTML={{ __html: embedHtml }} />
      ) : thumbnailUrl ? (
        <a href={videoUrl || '#'} target="_blank" rel="noopener noreferrer" style={wrapperStyle}>
          <img
            src={thumbnailUrl}
            alt={alt}
            style={{ display: 'block', maxWidth: '100%', width, borderRadius }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          </div>
        </a>
      ) : (
        <div style={{ ...wrapperStyle, padding: '40px 20px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#9CA3AF">
            <path d="M8 5v14l11-7z" />
          </svg>
          <div style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>
            {videoUrl || 'Enter a YouTube or Vimeo URL'}
          </div>
        </div>
      )}
    </div>
  )
}

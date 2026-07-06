import { z } from 'zod'

const VideoPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({
      top: z.number(),
      bottom: z.number(),
      right: z.number(),
      left: z.number(),
    }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    videoUrl: z.string().optional().nullable(),
    thumbnailUrl: z.string().optional().nullable(),
    alt: z.string().optional().nullable(),
    width: z.number().min(100).max(800).optional().nullable(),
    borderRadius: z.number().min(0).max(40).optional().nullable(),
  }).optional().nullable(),
})

export default VideoPropsSchema

export type VideoProps = z.infer<typeof VideoPropsSchema>

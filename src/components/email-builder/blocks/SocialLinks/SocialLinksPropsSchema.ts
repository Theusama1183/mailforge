import { z } from 'zod'

const SocialLinkItemSchema = z.object({
  platform: z.string(),
  url: z.string().optional().nullable(),
  enabled: z.boolean().optional().nullable(),
})

const SocialLinksPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({
      top: z.number(),
      bottom: z.number(),
      right: z.number(),
      left: z.number(),
    }).optional().nullable(),
    iconSize: z.number().min(12).max(64).optional().nullable(),
    iconColor: z.string().optional().nullable(),
    iconGap: z.number().min(0).max(48).optional().nullable(),
    iconBackgroundColor: z.string().optional().nullable(),
    iconBorderRadius: z.number().min(0).max(30).optional().nullable(),
    iconPadding: z.number().min(0).max(20).optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    links: z.array(SocialLinkItemSchema).optional().nullable(),
    alignment: z.enum(['horizontal', 'vertical']).optional().nullable(),
  }).optional().nullable(),
})

export default SocialLinksPropsSchema

export type SocialLinksProps = z.infer<typeof SocialLinksPropsSchema>

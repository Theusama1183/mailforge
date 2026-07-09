import { z } from 'zod'

const FooterPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    copyright: z.string().optional().nullable(),
    showUnsubscribe: z.boolean().optional().nullable(),
    unsubscribeText: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    showSocialIcons: z.boolean().optional().nullable(),
    facebook: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    linkedin: z.string().optional().nullable(),
    fontSize: z.number().min(10).max(48).optional().nullable(),
    textColor: z.string().optional().nullable(),
    linkColor: z.string().optional().nullable(),
  }).optional().nullable(),
})

export default FooterPropsSchema

export type FooterProps = z.infer<typeof FooterPropsSchema>

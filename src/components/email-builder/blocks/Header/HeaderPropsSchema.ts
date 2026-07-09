import { z } from 'zod'

const FONT_FAMILY_SCHEMA = z.enum([
  'MODERN_SANS', 'BOOK_SANS', 'ORGANIC_SANS', 'GEOMETRIC_SANS',
  'HEAVY_SANS', 'ROUNDED_SANS', 'MODERN_SERIF', 'BOOK_SERIF', 'MONOSPACE',
]).nullable().optional()

const HeaderPropsSchema = z.object({
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
    logoUrl: z.string().optional().nullable(),
    logoAlt: z.string().optional().nullable(),
    logoWidth: z.number().min(20).max(600).optional().nullable(),
    logoHeight: z.number().min(20).max(600).optional().nullable(),
    text: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    layout: z.enum(['logo-left', 'logo-center', 'logo-above', 'text-only', 'logo-only']).optional().nullable(),
    textColor: z.string().optional().nullable(),
    fontSize: z.number().min(10).max(72).optional().nullable(),
    fontFamily: FONT_FAMILY_SCHEMA,
    fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
  }).optional().nullable(),
})

export default HeaderPropsSchema

export type HeaderProps = z.infer<typeof HeaderPropsSchema>

import { z } from 'zod'

import { HeadingPropsSchema as BaseHeadingPropsSchema } from '@usewaypoint/block-heading'

const COLOR_SCHEMA = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional()
const PADDING_SCHEMA = z.object({
  top: z.number(),
  bottom: z.number(),
  right: z.number(),
  left: z.number(),
}).optional().nullable()
const FONT_FAMILY_SCHEMA = z.enum([
  'MODERN_SANS',
  'BOOK_SANS',
  'ORGANIC_SANS',
  'GEOMETRIC_SANS',
  'HEAVY_SANS',
  'ROUNDED_SANS',
  'MODERN_SERIF',
  'BOOK_SERIF',
  'MONOSPACE',
]).nullable().optional()

const HeadingBlockPropsSchema = z.object({
  style: z.object({
    color: COLOR_SCHEMA,
    backgroundColor: COLOR_SCHEMA,
    fontFamily: FONT_FAMILY_SCHEMA,
    fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: PADDING_SCHEMA,
    fontSize: z.number().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
    lineHeight: z.number().min(0.5).max(3).optional().nullable(),
    letterSpacing: z.number().min(-2).max(10).optional().nullable(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    text: z.string().optional().nullable(),
    level: z.enum(['h1', 'h2', 'h3']).optional().nullable(),
  }).optional().nullable(),
})

export default HeadingBlockPropsSchema

export type HeadingBlockProps = z.infer<typeof HeadingBlockPropsSchema>

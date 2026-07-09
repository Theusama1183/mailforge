import { z } from 'zod'

const TestimonialPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    quote: z.string().optional().nullable(),
    author: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    starRating: z.number().min(0).max(5).optional().nullable(),
    showStars: z.boolean().optional().nullable(),
    quoteColor: z.string().optional().nullable(),
    authorColor: z.string().optional().nullable(),
    titleColor: z.string().optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderColor: z.string().optional().nullable(),
    fontSize: z.number().min(12).max(36).optional().nullable(),
    showQuoteMark: z.boolean().optional().nullable(),
  }).optional().nullable(),
})

export default TestimonialPropsSchema

export type TestimonialProps = z.infer<typeof TestimonialPropsSchema>

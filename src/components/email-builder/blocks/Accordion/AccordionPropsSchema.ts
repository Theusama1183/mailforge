import { z } from 'zod'

const AccordionItemSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  open: z.boolean().optional().nullable(),
})

const AccordionPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({
      top: z.number(),
      bottom: z.number(),
      right: z.number(),
      left: z.number(),
    }).optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    items: z.array(AccordionItemSchema).optional().nullable(),
    titleColor: z.string().optional().nullable(),
    contentColor: z.string().optional().nullable(),
    borderColor: z.string().optional().nullable(),
    borderRadius: z.number().min(0).max(20).optional().nullable(),
    gap: z.number().min(0).max(16).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
  }).optional().nullable(),
})

export default AccordionPropsSchema

export type AccordionProps = z.infer<typeof AccordionPropsSchema>

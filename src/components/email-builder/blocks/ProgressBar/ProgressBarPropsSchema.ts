import { z } from 'zod'

const ProgressBarPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({
      top: z.number(),
      bottom: z.number(),
      right: z.number(),
      left: z.number(),
    }).optional().nullable(),
    color: z.string().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    percentage: z.number().min(0).max(100).optional().nullable(),
    label: z.string().optional().nullable(),
    showPercentage: z.boolean().optional().nullable(),
    barColor: z.string().optional().nullable(),
    trackColor: z.string().optional().nullable(),
    height: z.number().min(4).max(40).optional().nullable(),
    borderRadius: z.number().min(0).max(20).optional().nullable(),
    labelPosition: z.enum(['above', 'below', 'inside', 'none']).optional().nullable(),
  }).optional().nullable(),
})

export default ProgressBarPropsSchema

export type ProgressBarProps = z.infer<typeof ProgressBarPropsSchema>

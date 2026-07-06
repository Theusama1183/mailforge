import { z } from 'zod'

const CountdownTimerPropsSchema = z.object({
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
    endDate: z.string().optional().nullable(),
    endText: z.string().optional().nullable(),
    digitColor: z.string().optional().nullable(),
    labelColor: z.string().nullable().optional(),
    gap: z.number().min(4).max(48).optional().nullable(),
    showLabels: z.boolean().optional().nullable(),
    labels: z.object({
      days: z.string().optional().nullable(),
      hours: z.string().optional().nullable(),
      mins: z.string().optional().nullable(),
      secs: z.string().optional().nullable(),
    }).optional().nullable(),
  }).optional().nullable(),
})

export default CountdownTimerPropsSchema

export type CountdownTimerProps = z.infer<typeof CountdownTimerPropsSchema>

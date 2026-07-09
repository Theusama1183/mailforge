import { z } from 'zod'

const CalendarEventPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    title: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    time: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    showDateBadge: z.boolean().optional().nullable(),
    dayOfWeek: z.string().optional().nullable(),
    dateNumber: z.string().optional().nullable(),
    monthName: z.string().optional().nullable(),
    ctaText: z.string().optional().nullable(),
    ctaUrl: z.string().optional().nullable(),
    googleCalendarUrl: z.string().optional().nullable(),
    outlookCalendarUrl: z.string().optional().nullable(),
    icalUrl: z.string().optional().nullable(),
    accentColor: z.string().optional().nullable(),
    textColor: z.string().optional().nullable(),
  }).optional().nullable(),
})

export default CalendarEventPropsSchema

export type CalendarEventProps = z.infer<typeof CalendarEventPropsSchema>

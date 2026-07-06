import { z } from 'zod'

const ButtonItemSchema = z.object({
  text: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  leftIcon: z.string().optional().nullable(),
  rightIcon: z.string().optional().nullable(),
})

const ButtonGroupPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({
      top: z.number(),
      bottom: z.number(),
      right: z.number(),
      left: z.number(),
    }).optional().nullable(),
    gap: z.number().min(0).max(48).optional().nullable(),
    buttonBackgroundColor: z.string().optional().nullable(),
    buttonTextColor: z.string().optional().nullable(),
    buttonBorderRadius: z.number().min(0).max(30).optional().nullable(),
    buttonFontSize: z.number().min(8).max(48).optional().nullable(),
    buttonPadding: z.object({
      top: z.number(),
      bottom: z.number(),
      right: z.number(),
      left: z.number(),
    }).optional().nullable(),
    fullWidth: z.boolean().optional().nullable(),
    buttonBorderWidth: z.number().min(0).max(10).optional().nullable(),
    buttonBorderColor: z.string().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    buttons: z.array(ButtonItemSchema).optional().nullable(),
    alignment: z.enum(['horizontal', 'vertical']).optional().nullable(),
  }).optional().nullable(),
})

export default ButtonGroupPropsSchema

export type ButtonGroupProps = z.infer<typeof ButtonGroupPropsSchema>

import { z } from 'zod'

const CouponPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    code: z.string().optional().nullable(),
    discount: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    expiry: z.string().optional().nullable(),
    disclaimer: z.string().optional().nullable(),
    couponColor: z.string().optional().nullable(),
    textColor: z.string().optional().nullable(),
    buttonText: z.string().optional().nullable(),
    buttonUrl: z.string().optional().nullable(),
    buttonColor: z.string().optional().nullable(),
    dashedBorder: z.boolean().optional().nullable(),
    showDashedBorder: z.boolean().optional().nullable(),
  }).optional().nullable(),
})

export default CouponPropsSchema

export type CouponProps = z.infer<typeof CouponPropsSchema>

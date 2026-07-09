import { z } from 'zod'

const PricingFeatureSchema = z.object({
  text: z.string().optional().nullable(),
  included: z.boolean().optional().nullable(),
})

const PricingPlanSchema = z.object({
  name: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  period: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  features: z.array(PricingFeatureSchema).optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  highlighted: z.boolean().optional().nullable(),
  accentColor: z.string().optional().nullable(),
})

const PricingTablePropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    plans: z.array(PricingPlanSchema).optional().nullable(),
    columns: z.enum(['2', '3', '4']).optional().nullable(),
    gap: z.number().min(4).max(48).optional().nullable(),
    showFeatures: z.boolean().optional().nullable(),
    buttonColor: z.string().optional().nullable(),
    buttonTextColor: z.string().optional().nullable(),
    cardBackgroundColor: z.string().optional().nullable(),
    cardBorderRadius: z.number().min(0).max(24).optional().nullable(),
    headerBackgroundColor: z.string().optional().nullable(),
    headerTextColor: z.string().optional().nullable(),
    featureColor: z.string().optional().nullable(),
    priceColor: z.string().optional().nullable(),
  }).optional().nullable(),
})

export default PricingTablePropsSchema

export type PricingTableProps = z.infer<typeof PricingTablePropsSchema>

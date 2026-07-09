import { z } from 'zod'

const ProductCardSchema = z.object({
  imageUrl: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  originalPrice: z.string().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
})

const ProductGridPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    products: z.array(ProductCardSchema).optional().nullable(),
    columns: z.enum(['2', '3']).optional().nullable(),
    gap: z.number().min(4).max(48).optional().nullable(),
    showPrice: z.boolean().optional().nullable(),
    buttonColor: z.string().optional().nullable(),
    buttonTextColor: z.string().optional().nullable(),
    cardBackgroundColor: z.string().optional().nullable(),
    titleColor: z.string().optional().nullable(),
    priceColor: z.string().optional().nullable(),
    borderRadiusSize: z.number().min(0).max(24).optional().nullable(),
  }).optional().nullable(),
})

export default ProductGridPropsSchema

export type ProductGridProps = z.infer<typeof ProductGridPropsSchema>

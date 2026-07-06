import { z } from 'zod'

const COLOR_SCHEMA = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional()
const PADDING_SCHEMA = z.object({
  top: z.number(),
  bottom: z.number(),
  right: z.number(),
  left: z.number(),
}).optional().nullable()
const GRADIENT_STOP_SCHEMA = z.object({
  color: z.string(),
  position: z.number().min(0).max(100),
})

const ContainerPropsSchema = z.object({
  style: z.object({
    backgroundColor: COLOR_SCHEMA,
    borderColor: COLOR_SCHEMA,
    borderRadius: z.number().optional().nullable(),
    padding: PADDING_SCHEMA,
    display: z.enum(['block', 'flex', 'inline-flex']).optional().nullable(),
    flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional().nullable(),
    flexWrap: z.enum(['nowrap', 'wrap']).optional().nullable(),
    alignItems: z.enum(['flex-start', 'center', 'flex-end', 'stretch', 'baseline']).optional().nullable(),
    justifyContent: z.enum(['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']).optional().nullable(),
    gap: z.number().min(0).optional().nullable(),
    backgroundType: z.enum(['solid', 'gradient']).optional().nullable(),
    gradientType: z.enum(['linear', 'radial']).optional().nullable(),
    gradientColorStops: z.array(GRADIENT_STOP_SCHEMA).min(2).max(10).optional().nullable(),
    gradientAngle: z.number().min(0).max(360).optional().nullable(),
    mobileDisplay: z.enum(['block', 'flex', 'inline-flex']).optional().nullable(),
    mobileFlexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional().nullable(),
    mobileGap: z.number().min(0).optional().nullable(),
    boxShadow: z.string().optional().nullable(),
    minHeight: z.number().min(0).optional().nullable(),
    overflow: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    childrenIds: z.array(z.string()).optional().nullable(),
  }).optional().nullable(),
})

export default ContainerPropsSchema

export type ContainerProps = z.infer<typeof ContainerPropsSchema>

export type ContainerStyle = NonNullable<ContainerProps['style']>

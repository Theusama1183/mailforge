import { z } from 'zod'

import { ColumnsContainerPropsSchema as BaseColumnsContainerPropsSchema } from '@usewaypoint/block-columns-container'

const BasePropsShape = BaseColumnsContainerPropsSchema.shape.props.unwrap().unwrap().shape

const COLOR_SCHEMA = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional()
const PADDING_SCHEMA = z.object({
  top: z.number(),
  bottom: z.number(),
  right: z.number(),
  left: z.number(),
}).optional().nullable()

const ColumnsContainerPropsSchema = z.object({
  style: z.object({
    backgroundColor: COLOR_SCHEMA,
    padding: PADDING_SCHEMA,
    borderRadius: z.number().optional().nullable(),
    borderColor: COLOR_SCHEMA,
  }).optional().nullable(),
  props: z
    .object({
      ...BasePropsShape,
      columns: z.tuple([
        z.object({ childrenIds: z.array(z.string()) }),
        z.object({ childrenIds: z.array(z.string()) }),
        z.object({ childrenIds: z.array(z.string()) }),
      ]),
    })
    .optional()
    .nullable(),
})

export type ColumnsContainerProps = z.infer<typeof ColumnsContainerPropsSchema>
export default ColumnsContainerPropsSchema

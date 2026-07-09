import { z } from 'zod'

const MenuLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

const MenuNavPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    links: z.array(MenuLinkSchema).optional().nullable(),
    alignment: z.enum(['left', 'center', 'right']).optional().nullable(),
    layout: z.enum(['horizontal', 'vertical']).optional().nullable(),
    fontSize: z.number().min(10).max(48).optional().nullable(),
    linkColor: z.string().optional().nullable(),
    hoverColor: z.string().optional().nullable(),
    separator: z.enum(['none', 'dot', 'line', 'chevron']).optional().nullable(),
    separatorColor: z.string().optional().nullable(),
  }).optional().nullable(),
})

export default MenuNavPropsSchema

export type MenuNavProps = z.infer<typeof MenuNavPropsSchema>

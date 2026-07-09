import { z } from 'zod'

const MapPropsSchema = z.object({
  style: z.object({
    textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
    padding: z.object({ top: z.number(), bottom: z.number(), right: z.number(), left: z.number() }).optional().nullable(),
    backgroundColor: z.string().optional().nullable(),
    borderRadius: z.number().optional().nullable(),
  }).optional().nullable(),
  props: z.object({
    address: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    zoom: z.number().min(1).max(20).optional().nullable(),
    width: z.number().min(100).max(1200).optional().nullable(),
    height: z.number().min(50).max(800).optional().nullable(),
    mapStyle: z.enum(['roadmap', 'satellite', 'hybrid', 'terrain']).optional().nullable(),
    markerLabel: z.string().optional().nullable(),
    linkUrl: z.string().optional().nullable(),
  }).optional().nullable(),
})

export default MapPropsSchema

export type MapProps = z.infer<typeof MapPropsSchema>

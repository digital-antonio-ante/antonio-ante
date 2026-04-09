import { z } from 'zod';
import {
  PortableTextSchema,
  SanityDocumentBaseSchema,
  SanityImageSchema,
  SanitySlugSchema,
} from './shared';

// Parroquias del Cantón Antonio Ante, Imbabura, Ecuador
export const NombreParroquiaSchema = z.enum([
  'Atuntaqui',
  'Andrade Marín',
  'Chaltura',
  'Imbaya',
  'Natabuela',
  'San Roque',
]);

export const CoordenadasSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const ParroquiaSchema = SanityDocumentBaseSchema.extend({
  _type: z.literal('parroquia'),
  nombre: NombreParroquiaSchema,
  slug: SanitySlugSchema,
  descripcion: PortableTextSchema.optional(),
  poblacion: z.number().int().positive().optional(),
  superficieKm2: z.number().positive().optional(),
  coordenadas: CoordenadasSchema.optional(),
  imagenPrincipal: SanityImageSchema.optional(),
  esCabeceraCantonal: z.boolean().default(false),
});

export type Parroquia = z.infer<typeof ParroquiaSchema>;
export type NombreParroquia = z.infer<typeof NombreParroquiaSchema>;

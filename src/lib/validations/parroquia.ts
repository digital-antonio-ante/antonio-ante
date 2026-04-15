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
  descripcion: PortableTextSchema.nullish(),
  poblacion: z.number().int().positive().nullish(),
  superficieKm2: z.number().positive().nullish(),
  coordenadas: CoordenadasSchema.nullish(),
  imagenPrincipal: SanityImageSchema.nullish(),
  esCabeceraCantonal: z.boolean().default(false),
  /** URL resuelta en GROQ con asset->url — solo disponible cuando se proyecta en la query */
  imageUrl: z.string().url().nullish(),
  /** Sanity hotspot — proyectados en GROQ como imagenPrincipal.hotspot.x/y */
  hotspotX: z.number().min(0).max(1).nullish(),
  hotspotY: z.number().min(0).max(1).nullish(),
  /** Galería de fotos — proyectada en QUERY_BY_SLUG */
  galeria: z
    .array(
      z.object({
        url: z.string().url().nullish(),
        alt: z.string().nullish(),
      })
    )
    .nullish(),
  /** Redes sociales de la parroquia */
  redesSociales: z
    .array(
      z.object({
        red: z.enum(['facebook', 'instagram', 'twitter', 'youtube', 'tiktok']),
        url: z.string().url(),
      })
    )
    .nullish(),
});

export type Parroquia = z.infer<typeof ParroquiaSchema>;
export type NombreParroquia = z.infer<typeof NombreParroquiaSchema>;

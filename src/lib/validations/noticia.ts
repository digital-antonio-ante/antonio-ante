import { z } from 'zod';
import {
  PortableTextSchema,
  SanityDocumentBaseSchema,
  SanityImageSchema,
  SanitySlugSchema,
} from './shared';

export const CategoriaNoticiaSchema = z.enum([
  'institucional',
  'social',
  'cultura',
  'deporte',
  'turismo',
  'obras',
  'otro',
]);

export const NoticiaSchema = SanityDocumentBaseSchema.extend({
  _type: z.literal('noticia'),
  titulo: z.string().min(1),
  slug: SanitySlugSchema,
  resumen: z.string().min(1).max(300),
  cuerpo: PortableTextSchema.nullish(),
  publishedAt: z.string().datetime({ offset: true }),
  categoria: CategoriaNoticiaSchema,
  imagenPortada: SanityImageSchema.nullish(),
  destacada: z.boolean().default(false),
});

export const NoticiaListItemSchema = NoticiaSchema.omit({ cuerpo: true });

export type Noticia = z.infer<typeof NoticiaSchema>;
export type NoticiaListItem = z.infer<typeof NoticiaListItemSchema>;
export type CategoriaNoticia = z.infer<typeof CategoriaNoticiaSchema>;

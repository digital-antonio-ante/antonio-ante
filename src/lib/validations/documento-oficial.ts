import { z } from 'zod';
import { SanityDocumentBaseSchema, SanitySlugSchema } from './shared';

export const CategoriaDocumentoSchema = z.enum([
  'ordenanza',
  'resolucion',
  'plan',
  'informe',
  'presupuesto',
  'rendicion-cuentas',
  'otro',
]);

export const ArchivoSanitySchema = z.object({
  _type: z.literal('file'),
  asset: z.object({
    _type: z.literal('reference'),
    _ref: z.string(),
  }),
});

export const DocumentoOficialSchema = SanityDocumentBaseSchema.extend({
  _type: z.literal('documentoOficial'),
  titulo: z.string().min(1),
  slug: SanitySlugSchema,
  categoria: CategoriaDocumentoSchema,
  fechaPublicacion: z.string().datetime({ offset: true }),
  numero: z.string().optional(),
  archivo: ArchivoSanitySchema,
  descripcion: z.string().max(500).optional(),
  vigente: z.boolean().default(true),
});

export type DocumentoOficial = z.infer<typeof DocumentoOficialSchema>;
export type CategoriaDocumento = z.infer<typeof CategoriaDocumentoSchema>;

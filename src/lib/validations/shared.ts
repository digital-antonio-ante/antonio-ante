import { z } from 'zod';

export const SanitySlugSchema = z.object({
  _type: z.literal('slug'),
  current: z.string().min(1),
});

export const SanityImageSchema = z.object({
  _type: z.literal('image'),
  asset: z.object({
    _type: z.literal('reference'),
    _ref: z.string(),
  }),
  // Sanity returns null (not undefined) for unset optional fields — use .nullish()
  alt: z.string().nullish(),
  hotspot: z
    .object({
      x: z.number(),
      y: z.number(),
      height: z.number(),
      width: z.number(),
    })
    .nullish(),
  crop: z
    .object({
      top: z.number(),
      bottom: z.number(),
      left: z.number(),
      right: z.number(),
    })
    .nullish(),
});

// Portable Text blocks: open structure, validated at the array level only.
// Trade-off: full PT schema validation is impractical without a custom Zod plugin.
export const PortableTextSchema = z.array(z.record(z.string(), z.unknown()));

export const SanityDocumentBaseSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  _createdAt: z.string().datetime({ offset: true }),
  _updatedAt: z.string().datetime({ offset: true }),
  _rev: z.string(),
});

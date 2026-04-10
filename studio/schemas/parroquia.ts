import { defineField, defineType } from 'sanity';

// Espeja exactamente NombreParroquiaSchema de src/lib/validations/parroquia.ts
const PARROQUIAS = [
  { title: 'Atuntaqui (Cabecera Cantonal)', value: 'Atuntaqui' },
  { title: 'Andrade Marín', value: 'Andrade Marín' },
  { title: 'Chaltura', value: 'Chaltura' },
  { title: 'Imbaya', value: 'Imbaya' },
  { title: 'Natabuela', value: 'Natabuela' },
  { title: 'San Roque', value: 'San Roque' },
];

export const parroquia = defineType({
  name: 'parroquia',
  title: 'Parroquias',
  type: 'document',
  icon: () => '🏘️',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Parroquia',
      type: 'string',
      options: {
        list: PARROQUIAS,
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL (slug)',
      type: 'slug',
      options: {
        source: 'nombre',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'esCabeceraCantonal',
      title: '¿Es la cabecera cantonal?',
      type: 'boolean',
      initialValue: false,
      description: 'Solo Atuntaqui es cabecera cantonal.',
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'portableText',
    }),
    defineField({
      name: 'imagenPrincipal',
      title: 'Imagen principal',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'poblacion',
      title: 'Población (habitantes)',
      type: 'number',
      validation: (Rule) => Rule.positive().integer(),
    }),
    defineField({
      name: 'superficieKm2',
      title: 'Superficie (km²)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'coordenadas',
      title: 'Coordenadas geográficas',
      type: 'object',
      fields: [
        defineField({
          name: 'lat',
          title: 'Latitud',
          type: 'number',
          validation: (Rule) => Rule.required().min(-90).max(90),
        }),
        defineField({
          name: 'lng',
          title: 'Longitud',
          type: 'number',
          validation: (Rule) => Rule.required().min(-180).max(180),
        }),
      ],
    }),
    defineField({
      name: 'redesSociales',
      title: 'Redes sociales de la parroquia',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'red',
              title: 'Red social',
              type: 'string',
              options: {
                list: [
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'X (Twitter)', value: 'twitter' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'TikTok', value: 'tiktok' },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: {
            select: { title: 'red', subtitle: 'url' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'nombre',
      subtitle: 'poblacion',
      media: 'imagenPrincipal',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `${subtitle.toLocaleString('es-EC')} habitantes` : 'Sin datos',
        media,
      };
    },
  },
});

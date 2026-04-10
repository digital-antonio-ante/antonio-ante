import { defineField, defineType } from 'sanity';

/**
 * Singleton — configuración global del sitio.
 * El _id siempre es 'configSitio', garantizado por la estructura del Studio.
 * No hay lista de documentos de este tipo.
 */
export const configSitio = defineType({
  name: 'configSitio',
  title: 'Configuración del Sitio',
  type: 'document',
  icon: () => '⚙️',
  fields: [
    defineField({
      name: 'nombreSitio',
      title: 'Nombre del sitio',
      type: 'string',
      initialValue: 'GAD Municipal de Antonio Ante',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'descripcionSitio',
      title: 'Descripción del sitio (meta description)',
      type: 'text',
      rows: 2,
      description: 'Máximo 160 caracteres. Aparece en resultados de búsqueda.',
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'logoInstitucional',
      title: 'Logo institucional',
      type: 'image',
      options: { hotspot: false },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          initialValue: 'Logo del GAD Municipal de Antonio Ante',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'ogImageDefault',
      title: 'Imagen por defecto para redes sociales (Open Graph)',
      type: 'image',
      description: 'Dimensiones recomendadas: 1200×630 píxeles.',
      options: { hotspot: false },
    }),
    defineField({
      name: 'emailContacto',
      title: 'Email de contacto',
      type: 'string',
      validation: (Rule) => Rule.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: 'email' }),
    }),
    defineField({
      name: 'telefonoContacto',
      title: 'Teléfono institucional',
      type: 'string',
    }),
    defineField({
      name: 'direccion',
      title: 'Dirección física',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'horarioAtencion',
      title: 'Horario de atención',
      type: 'string',
      placeholder: 'Lun–Vie 08h00–17h00',
    }),
    defineField({
      name: 'redesSocialesInstitucionales',
      title: 'Redes sociales institucionales',
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
    defineField({
      name: 'enlacesInstitucionales',
      title: 'Enlaces institucionales (pie de página)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'titulo',
              title: 'Título',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: 'titulo', subtitle: 'url' } },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Configuración del Sitio' };
    },
  },
});

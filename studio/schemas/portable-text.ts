import { defineArrayMember, defineType } from 'sanity';

/**
 * Portable Text con opciones de formato adecuadas para un portal institucional.
 * Se evitan opciones complejas (tablas, código) innecesarias para el personal no técnico.
 */
export const portableText = defineType({
  name: 'portableText',
  title: 'Contenido enriquecido',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Título H2', value: 'h2' },
        { title: 'Título H3', value: 'h3' },
        { title: 'Título H4', value: 'h4' },
        { title: 'Cita', value: 'blockquote' },
      ],
      lists: [
        { title: 'Viñetas', value: 'bullet' },
        { title: 'Numerada', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Negrita', value: 'strong' },
          { title: 'Cursiva', value: 'em' },
          { title: 'Subrayado', value: 'underline' },
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            type: 'object',
            title: 'Enlace',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (Rule) => Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
              },
              {
                name: 'blank',
                type: 'boolean',
                title: 'Abrir en nueva pestaña',
                initialValue: false,
              },
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Texto alternativo (accesibilidad)',
          validation: (Rule) =>
            Rule.required().warning('El texto alt es obligatorio para accesibilidad WCAG 2.1'),
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Pie de foto',
        },
      ],
    }),
  ],
});

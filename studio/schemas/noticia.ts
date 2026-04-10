import { defineField, defineType } from 'sanity';

// Espeja exactamente CategoriaNoticiaSchema de src/lib/validations/noticia.ts
const CATEGORIAS = [
  { title: 'Institucional', value: 'institucional' },
  { title: 'Social', value: 'social' },
  { title: 'Cultura', value: 'cultura' },
  { title: 'Deporte', value: 'deporte' },
  { title: 'Turismo', value: 'turismo' },
  { title: 'Obras', value: 'obras' },
  { title: 'Otro', value: 'otro' },
];

export const noticia = defineType({
  name: 'noticia',
  title: 'Noticias',
  type: 'document',
  icon: () => '📰',
  orderings: [
    {
      title: 'Más recientes',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(200),
    }),
    defineField({
      name: 'slug',
      title: 'URL (slug)',
      type: 'slug',
      options: {
        source: 'titulo',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'resumen',
      title: 'Resumen',
      type: 'text',
      rows: 3,
      description: 'Máximo 300 caracteres. Se muestra en listados y redes sociales.',
      validation: (Rule) => Rule.required().min(1).max(300),
    }),
    defineField({
      name: 'cuerpo',
      title: 'Contenido',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
      options: { dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm' },
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      options: {
        list: CATEGORIAS,
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imagenPortada',
      title: 'Imagen de portada',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          description: 'Obligatorio para accesibilidad WCAG 2.1 AA',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'destacada',
      title: '¿Noticia destacada?',
      type: 'boolean',
      description: 'Las noticias destacadas aparecen en la página principal.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'categoria',
      media: 'imagenPortada',
      date: 'publishedAt',
    },
    prepare({ title, subtitle, media, date }) {
      const cat = CATEGORIAS.find((c) => c.value === subtitle)?.title ?? subtitle;
      const fecha = date ? new Date(date).toLocaleDateString('es-EC') : '';
      return { title, subtitle: `${cat} · ${fecha}`, media };
    },
  },
});

import { defineField, defineType } from 'sanity';

// Espeja exactamente CategoriaDocumentoSchema de src/lib/validations/documento-oficial.ts
const CATEGORIAS = [
  { title: 'Ordenanza', value: 'ordenanza' },
  { title: 'Resolución', value: 'resolucion' },
  { title: 'Plan', value: 'plan' },
  { title: 'Informe', value: 'informe' },
  { title: 'Presupuesto', value: 'presupuesto' },
  { title: 'Rendición de Cuentas', value: 'rendicion-cuentas' },
  { title: 'Otro', value: 'otro' },
];

export const documentoOficial = defineType({
  name: 'documentoOficial',
  title: 'Documentos Oficiales',
  type: 'document',
  icon: () => '📄',
  orderings: [
    {
      title: 'Más recientes',
      name: 'fechaDesc',
      by: [{ field: 'fechaPublicacion', direction: 'desc' }],
    },
  ],
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título del documento',
      type: 'string',
      validation: (Rule) => Rule.required().min(1),
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
      name: 'fechaPublicacion',
      title: 'Fecha de publicación',
      type: 'datetime',
      options: { dateFormat: 'DD/MM/YYYY' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'numero',
      title: 'Número de resolución / ordenanza',
      type: 'string',
      description: 'Ej: Ord. 2024-001 o Res. 2024-015',
    }),
    defineField({
      name: 'archivo',
      title: 'Archivo (PDF)',
      type: 'file',
      options: {
        accept: 'application/pdf',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción breve',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'vigente',
      title: '¿Documento vigente?',
      type: 'boolean',
      initialValue: true,
      description: 'Desactivar si fue derogado o reemplazado.',
    }),
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'categoria',
      date: 'fechaPublicacion',
      vigente: 'vigente',
    },
    prepare({ title, subtitle, date, vigente }) {
      const cat = CATEGORIAS.find((c) => c.value === subtitle)?.title ?? subtitle;
      const fecha = date ? new Date(date).toLocaleDateString('es-EC') : '';
      const estado = vigente === false ? ' · DEROGADO' : '';
      return { title, subtitle: `${cat} · ${fecha}${estado}` };
    },
  },
});

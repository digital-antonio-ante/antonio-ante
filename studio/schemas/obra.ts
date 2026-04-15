import { defineField, defineType } from 'sanity';

const PARROQUIAS = [
  { title: 'Todo el cantón', value: 'Canton' },
  { title: 'Atuntaqui', value: 'Atuntaqui' },
  { title: 'Andrade Marín', value: 'Andrade Marín' },
  { title: 'Chaltura', value: 'Chaltura' },
  { title: 'Imbaya', value: 'Imbaya' },
  { title: 'Natabuela', value: 'Natabuela' },
  { title: 'San Roque', value: 'San Roque' },
];

const CATEGORIAS = [
  { title: '🛣️  Vialidad y transporte', value: 'vialidad' },
  { title: '💧 Agua y saneamiento', value: 'agua' },
  { title: '🏫 Educación', value: 'educacion' },
  { title: '🏥 Salud', value: 'salud' },
  { title: '🌳 Espacios públicos', value: 'espacios_publicos' },
  { title: '🏭 Productividad y empleo', value: 'productividad' },
  { title: '🎭 Cultura y deporte', value: 'cultura' },
];

export const obra = defineType({
  name: 'obra',
  title: 'Obras',
  type: 'document',
  icon: () => '🏗️',
  groups: [
    { name: 'info', title: 'Información general', default: true },
    { name: 'avance', title: 'Avance y recursos' },
    { name: 'media', title: 'Imágenes' },
  ],
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título de la obra',
      type: 'string',
      group: 'info',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL (slug)',
      type: 'slug',
      group: 'info',
      options: { source: 'titulo', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      group: 'info',
      options: { list: CATEGORIAS, layout: 'dropdown' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parroquia',
      title: 'Parroquia',
      type: 'string',
      group: 'info',
      options: { list: PARROQUIAS, layout: 'dropdown' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'resumen',
      title: 'Descripción breve',
      type: 'text',
      rows: 3,
      group: 'info',
      description: 'Máximo 200 caracteres. Aparece en las tarjetas de la página de inicio.',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'destacada',
      title: '⭐ Obra destacada del período',
      type: 'boolean',
      group: 'info',
      description:
        'Activa solo una obra a la vez. La obra destacada aparece en sección especial en la página de inicio.',
      initialValue: false,
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          if (!value) return true; // No está activa — sin problema

          const client = context.getClient({ apiVersion: '2025-01-01' });
          const currentId: string = (context.document?._id ?? '').replace(/^drafts\./, '');

          const otrasDestacadas = await client.fetch<string[]>(
            `*[_type == "obra" && destacada == true && !(_id in [$id, $draft])]._id`,
            { id: currentId, draft: `drafts.${currentId}` }
          );

          if (otrasDestacadas.length > 0) {
            return '⚠️ Ya existe otra obra marcada como destacada. Desactívala primero para evitar que aparezcan dos banners en la página de inicio.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'estado',
      title: 'Estado',
      type: 'string',
      group: 'avance',
      options: {
        list: [
          { title: '📋 Planificada', value: 'planificada' },
          { title: '🔨 En progreso', value: 'en_progreso' },
          { title: '✅ Completada', value: 'completada' },
        ],
        layout: 'radio',
      },
      initialValue: 'en_progreso',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'porcentajeAvance',
      title: 'Avance (%)',
      type: 'number',
      group: 'avance',
      description: 'De 0 a 100.',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0).max(100).integer(),
    }),
    defineField({
      name: 'presupuestoUSD',
      title: 'Presupuesto (USD)',
      type: 'number',
      group: 'avance',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'familiasBeneficiadas',
      title: 'Familias beneficiadas',
      type: 'number',
      group: 'avance',
      validation: (Rule) => Rule.positive().integer(),
    }),
    defineField({
      name: 'fechaInicio',
      title: 'Fecha de inicio',
      type: 'date',
      group: 'avance',
    }),
    defineField({
      name: 'fechaEstimadaFin',
      title: 'Fecha estimada de finalización',
      type: 'date',
      group: 'avance',
    }),
    defineField({
      name: 'imagenPrincipal',
      title: 'Imagen principal',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          description:
            'Describe lo que muestra la foto de la obra. Ejemplo: "Trabajadores colocando adoquines en la calle Bolívar de Atuntaqui". ' +
            'Lo usan los lectores de pantalla y Google para indexar la imagen.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'parroquia',
      media: 'imagenPrincipal',
      avance: 'porcentajeAvance',
      estado: 'estado',
    },
    prepare({ title, subtitle, media, avance, estado }) {
      const emoji = estado === 'completada' ? '✅' : estado === 'en_progreso' ? '🔨' : '📋';
      return {
        title: `${emoji} ${title}`,
        subtitle: `${subtitle ?? ''} · ${avance ?? 0}% completado`,
        media,
      };
    },
  },
});

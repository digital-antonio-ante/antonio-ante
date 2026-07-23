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
  { title: '🎪 Ferias y exposiciones', value: 'feria' },
  { title: '🎭 Cultura y arte', value: 'cultura' },
  { title: '🏃 Deporte y recreación', value: 'deporte' },
  { title: '🏛️ Cívico', value: 'civico' },
  { title: '🤝 Comunitario', value: 'comunitario' },
  { title: '🌾 Agropecuario', value: 'agropecuario' },
];

const EMOJIS: Record<string, string> = {
  feria: '🎪',
  cultura: '🎭',
  deporte: '🏃',
  civico: '🏛️',
  comunitario: '🤝',
  agropecuario: '🌾',
};

export const evento = defineType({
  name: 'evento',
  title: 'Eventos',
  type: 'document',
  icon: () => '📅',
  groups: [
    { name: 'info', title: 'Información general', default: true },
    { name: 'fecha', title: 'Fecha y lugar' },
    { name: 'media', title: 'Imágenes' },
  ],
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título del evento',
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
      description: 'Máximo 220 caracteres. Aparece en tarjetas y resultados de búsqueda.',
      validation: (Rule) => Rule.required().max(220),
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción completa',
      type: 'array',
      group: 'info',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Título H2', value: 'h2' },
            { title: 'Subtítulo H3', value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Negrita', value: 'strong' },
              { title: 'Cursiva', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Enlace',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule) =>
                      Rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Abrir en nueva pestaña',
                    initialValue: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'destacado',
      title: '⭐ Evento destacado',
      type: 'boolean',
      group: 'info',
      description:
        'Activa solo uno a la vez. El evento destacado aparece como banner principal en la página de inicio.',
      initialValue: false,
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          if (!value) return true;
          const client = context.getClient({ apiVersion: '2025-01-01' });
          const currentId: string = (context.document?._id ?? '').replace(/^drafts\./, '');
          const otros = await client.fetch<string[]>(
            `*[_type == "evento" && destacado == true && !(_id in [$id, $draft])]._id`,
            { id: currentId, draft: `drafts.${currentId}` }
          );
          return otros.length > 0
            ? '⚠️ Ya existe otro evento marcado como destacado. Desactívalo primero.'
            : true;
        }),
    }),

    // ── Fecha y lugar ──────────────────────────────────────────────
    defineField({
      name: 'fechaInicio',
      title: 'Fecha y hora de inicio',
      type: 'datetime',
      group: 'fecha',
      options: { dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', timeStep: 15 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'fechaFin',
      title: 'Fecha y hora de fin',
      type: 'datetime',
      group: 'fecha',
      options: { dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', timeStep: 15 },
      description: 'Opcional. Para eventos de varios días o con hora de cierre definida.',
    }),
    defineField({
      name: 'lugar',
      title: 'Lugar / Venue',
      type: 'string',
      group: 'fecha',
      description: 'Ej: Parque Central de Atuntaqui, Coliseo de San Roque.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entradaLibre',
      title: 'Entrada libre',
      type: 'boolean',
      group: 'fecha',
      description: 'Desactiva si el evento requiere inscripción, boleto o pago.',
      initialValue: true,
    }),
    defineField({
      name: 'enlaceRegistro',
      title: 'Enlace de inscripción / entradas',
      type: 'url',
      group: 'fecha',
      description:
        'Opcional. Se muestra como botón secundario "Registrarme" en el banner del evento.',
      validation: (Rule) =>
        Rule.uri({ scheme: ['http', 'https'] }).error('Debe ser una URL válida (http o https)'),
    }),

    // ── Imágenes ───────────────────────────────────────────────────
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
            'Describe la imagen para lectores de pantalla y buscadores. ' +
            'Ej: "Desfile de modas en la Expo Atuntaqui 2024, Parque Central."',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'galeria',
      title: 'Galería de fotos',
      type: 'array',
      group: 'media',
      description: 'Fotos adicionales del evento. Se muestran en la página de detalle.',
      of: [
        {
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
        },
      ],
      options: { layout: 'grid' },
    }),
  ],

  preview: {
    select: {
      title: 'titulo',
      fechaInicio: 'fechaInicio',
      media: 'imagenPrincipal',
      categoria: 'categoria',
      destacado: 'destacado',
    },
    prepare({ title, fechaInicio, media, categoria, destacado }) {
      const emoji = EMOJIS[categoria] ?? '📅';
      const star = destacado ? '⭐ ' : '';
      const fecha = fechaInicio
        ? new Date(fechaInicio).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Sin fecha';
      return {
        title: `${star}${emoji} ${title}`,
        subtitle: fecha,
        media,
      };
    },
  },
});

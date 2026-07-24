import { defineField, defineType } from 'sanity';

// Mensajes recibidos desde el formulario de contacto del sitio.
// Los crea automáticamente el endpoint /api/contact; no se editan a mano.
export const mensajeContacto = defineType({
  name: 'mensajeContacto',
  title: 'Mensajes de contacto',
  type: 'document',
  icon: () => '📬',
  orderings: [
    {
      title: 'Más recientes',
      name: 'recibidoDesc',
      by: [{ field: 'recibidoEn', direction: 'desc' }],
    },
  ],
  fields: [
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', readOnly: true }),
    defineField({ name: 'email', title: 'Correo electrónico', type: 'string', readOnly: true }),
    defineField({ name: 'telefono', title: 'Teléfono', type: 'string', readOnly: true }),
    defineField({ name: 'asunto', title: 'Asunto', type: 'string', readOnly: true }),
    defineField({ name: 'mensaje', title: 'Mensaje', type: 'text', rows: 5, readOnly: true }),
    defineField({
      name: 'recibidoEn',
      title: 'Recibido el',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'leido',
      title: 'Leído / atendido',
      type: 'boolean',
      description: 'Marca el mensaje una vez atendido.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'asunto', subtitle: 'nombre', leido: 'leido', fecha: 'recibidoEn' },
    prepare({ title, subtitle, leido, fecha }) {
      const f = fecha ? new Date(fecha).toLocaleDateString('es-EC') : '';
      return {
        title: title || '(sin asunto)',
        subtitle: `${leido ? '✓ ' : '● '}${subtitle ?? ''}${f ? ' · ' + f : ''}`,
      };
    },
  },
});

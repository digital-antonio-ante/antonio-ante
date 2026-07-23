import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemas } from './schemas';

export default defineConfig({
  name: 'antonio-ante',
  title: 'GAD Antonio Ante',
  projectId: 'lmfef6xr',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Portal GAD Antonio Ante')
          .items([
            S.listItem()
              .title('📅 Eventos')
              .child(
                S.documentTypeList('evento')
                  .title('Eventos del cantón')
                  .defaultOrdering([{ field: 'fechaInicio', direction: 'desc' }])
              ),

            S.listItem()
              .title('🏗️ Obras')
              .child(
                S.documentTypeList('obra')
                  .title('Obras municipales')
                  .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
              ),

            S.listItem()
              .title('🏘️ Parroquias')
              .child(S.documentTypeList('parroquia').title('Parroquias')),

            S.divider(),

            S.listItem()
              .title('⚙️ Configuración del Sitio')
              .child(
                S.document()
                  .schemaType('configSitio')
                  .documentId('configSitio')
                  .title('Configuración del Sitio')
              ),
          ]),
    }),

    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],

  schema: {
    types: schemas,
    // Obras y Eventos pueden crearse libremente. El resto son fijos o están fuera del portal.
    templates: (templates) =>
      templates.filter((t) => t.schemaType === 'obra' || t.schemaType === 'evento'),
  },
});

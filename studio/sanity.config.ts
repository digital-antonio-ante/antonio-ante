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
              .title('📰 Noticias')
              .child(
                S.documentTypeList('noticia')
                  .title('Noticias')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),

            S.listItem()
              .title('🏘️ Parroquias')
              .child(S.documentTypeList('parroquia').title('Parroquias')),

            S.listItem()
              .title('📄 Documentos Oficiales')
              .child(
                S.documentTypeList('documentoOficial')
                  .title('Documentos Oficiales')
                  .defaultOrdering([{ field: 'fechaPublicacion', direction: 'desc' }])
              ),

            S.divider(),

            // Singleton: un único documento de configuración
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

    // Vision: herramienta para probar consultas GROQ directamente
    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],

  schema: {
    types: schemas,
    // configSitio solo puede existir como singleton — ocultar del menú "Nuevo documento"
    templates: (templates) => templates.filter((t) => t.schemaType !== 'configSitio'),
  },
});

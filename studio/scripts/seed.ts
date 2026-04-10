/**
 * seed.ts — Carga contenido semilla en Sanity para Antonio Ante.
 *
 * Requisito: SANITY_API_TOKEN con permisos de escritura (editor o admin).
 * Uso: SANITY_API_TOKEN=sk... tsx scripts/seed.ts
 *
 * Idempotente: usa createOrReplace para no duplicar al re-ejecutar.
 */

import { createClient } from '@sanity/client';

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('[seed] Error: variable SANITY_API_TOKEN no definida.');
  console.error('       Genera un token en https://www.sanity.io/manage → API → Tokens');
  process.exit(1);
}

const client = createClient({
  projectId: 'lmfe6xr',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function block(text: string) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [] }],
  };
}

function now(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

// ─── Datos semilla ─────────────────────────────────────────────────────────────

const parroquias = [
  {
    _id: 'parroquia-atuntaqui',
    _type: 'parroquia',
    nombre: 'Atuntaqui',
    slug: { _type: 'slug', current: 'atuntaqui' },
    esCabeceraCantonal: true,
    poblacion: 23851,
    superficieKm2: 12.5,
    coordenadas: { lat: 0.3281, lng: -78.2134 },
    descripcion: [
      block(
        'Atuntaqui es la cabecera cantonal de Antonio Ante, reconocida mundialmente como la "Capital de la Moda" del Ecuador.'
      ),
      block(
        'Su industria textil es el motor económico del cantón, atrayendo turistas de todo el país y el exterior, especialmente durante las ferias de fábrica.'
      ),
    ],
  },
  {
    _id: 'parroquia-andrade-marin',
    _type: 'parroquia',
    nombre: 'Andrade Marín',
    slug: { _type: 'slug', current: 'andrade-marin' },
    esCabeceraCantonal: false,
    poblacion: 3891,
    superficieKm2: 4.2,
    coordenadas: { lat: 0.3312, lng: -78.2098 },
    descripcion: [
      block(
        'Andrade Marín es una parroquia urbana contigua a Atuntaqui, con una rica tradición artesanal y gastronómica.'
      ),
    ],
  },
  {
    _id: 'parroquia-chaltura',
    _type: 'parroquia',
    nombre: 'Chaltura',
    slug: { _type: 'slug', current: 'chaltura' },
    esCabeceraCantonal: false,
    poblacion: 3068,
    superficieKm2: 8.9,
    coordenadas: { lat: 0.3198, lng: -78.2267 },
    descripcion: [
      block(
        'Chaltura es conocida por sus hornados y el cuy asado, convirtiéndose en un destino gastronómico obligado dentro del cantón.'
      ),
    ],
  },
  {
    _id: 'parroquia-imbaya',
    _type: 'parroquia',
    nombre: 'Imbaya',
    slug: { _type: 'slug', current: 'imbaya' },
    esCabeceraCantonal: false,
    poblacion: 1279,
    superficieKm2: 35.1,
    coordenadas: { lat: 0.3456, lng: -78.1923 },
    descripcion: [
      block(
        'Imbaya es la parroquia más extensa del cantón, caracterizada por su producción agrícola y paisajes naturales.'
      ),
    ],
  },
  {
    _id: 'parroquia-natabuela',
    _type: 'parroquia',
    nombre: 'Natabuela',
    slug: { _type: 'slug', current: 'natabuela' },
    esCabeceraCantonal: false,
    poblacion: 5651,
    superficieKm2: 17.3,
    coordenadas: { lat: 0.3089, lng: -78.2345 },
    descripcion: [
      block(
        'Natabuela mantiene viva la cultura indígena del pueblo Natabuela, con traje típico, música y artesanías reconocidas a nivel nacional.'
      ),
    ],
  },
  {
    _id: 'parroquia-san-roque',
    _type: 'parroquia',
    nombre: 'San Roque',
    slug: { _type: 'slug', current: 'san-roque' },
    esCabeceraCantonal: false,
    poblacion: 10142,
    superficieKm2: 23.6,
    coordenadas: { lat: 0.2934, lng: -78.2456 },
    descripcion: [
      block(
        'San Roque es la parroquia más poblada fuera del área urbana, con una economía basada en la agricultura y el comercio.'
      ),
    ],
  },
];

const noticias = [
  {
    _id: 'noticia-feria-moda-2026',
    _type: 'noticia',
    titulo: 'Feria de Moda Atuntaqui 2026 supera las 85.000 visitas',
    slug: { _type: 'slug', current: 'feria-moda-atuntaqui-2026' },
    resumen:
      'La edición 2026 de la Feria de Moda de Atuntaqui batió récords de visitantes con más de 85.000 personas en cuatro días de exposición textil.',
    publishedAt: now(2),
    categoria: 'turismo',
    destacada: true,
    cuerpo: [
      block(
        'La Feria de Moda Atuntaqui 2026 culminó con cifras récord que posicionan al cantón como el destino turístico y comercial más importante del norte del Ecuador.'
      ),
      block(
        'Durante cuatro días, más de 200 expositores presentaron sus colecciones otoño-invierno 2026, generando ventas estimadas en 4.2 millones de dólares según datos del GAD Municipal.'
      ),
      block(
        'El alcalde destacó la inversión en infraestructura vial y señalética turística que facilitó la movilización de los visitantes desde Quito, Guayaquil y ciudades colombianas fronterizas.'
      ),
    ],
  },
  {
    _id: 'noticia-obras-parque-central',
    _type: 'noticia',
    titulo: 'Inician obras de renovación del Parque Central de Atuntaqui',
    slug: { _type: 'slug', current: 'renovacion-parque-central-atuntaqui' },
    resumen:
      'El GAD Municipal da inicio a la renovación integral del Parque Central, con una inversión de $380.000 financiada con fondos del Banco de Desarrollo del Ecuador.',
    publishedAt: now(7),
    categoria: 'obras',
    destacada: false,
    cuerpo: [
      block(
        'Las obras de renovación del Parque Central de Atuntaqui comenzaron el lunes con la instalación del cerramiento provisional y la reubicación del mobiliario urbano existente.'
      ),
      block(
        'El proyecto contempla la renovación de jardines, luminaria LED, bancas de granito, juegos infantiles inclusivos y mejoras en el sistema de drenaje pluvial.'
      ),
      block(
        'El plazo de ejecución es de 90 días calendario. Durante la obra, la circulación peatonal se desvía por las calles Bolívar y General Enríquez.'
      ),
    ],
  },
  {
    _id: 'noticia-presupuesto-2026',
    _type: 'noticia',
    titulo: 'GAD Antonio Ante aprueba Presupuesto Participativo 2026 por $8.2 millones',
    slug: { _type: 'slug', current: 'presupuesto-participativo-2026' },
    resumen:
      'El Concejo Municipal aprobó por unanimidad el presupuesto 2026 con énfasis en vialidad parroquial, agua potable rural y equipamiento del mercado municipal.',
    publishedAt: now(15),
    categoria: 'institucional',
    destacada: false,
    cuerpo: [
      block(
        'El Concejo Municipal del Cantón Antonio Ante aprobó en sesión ordinaria el Presupuesto Participativo 2026, que asciende a $8.2 millones y fue construido con la participación de representantes de las seis parroquias.'
      ),
      block(
        'El 40% del presupuesto se destina a infraestructura vial, el 25% a agua y saneamiento en sectores rurales, el 20% a desarrollo social y educación, y el 15% restante a administración y servicios institucionales.'
      ),
    ],
  },
];

// Nota: campo `archivo` omitido intencionalmente en el seed.
// Las referencias a assets de Sanity requieren subir el archivo real desde el Studio.
// Insertar una referencia falsa ({_ref: 'placeholder-pdf'}) crea una referencia rota
// que el Studio marca como error de validación para los editores.
const documentos = [
  {
    _id: 'doc-ordenanza-uso-suelo',
    _type: 'documentoOficial',
    titulo: 'Ordenanza de Uso y Ocupación del Suelo del Cantón Antonio Ante',
    slug: { _type: 'slug', current: 'ordenanza-uso-ocupacion-suelo' },
    categoria: 'ordenanza',
    fechaPublicacion: '2024-03-15T00:00:00.000Z',
    numero: 'Ord. GAD-AA-2024-001',
    descripcion:
      'Regula el uso, ocupación y zonificación del suelo en el área urbana y rural del cantón.',
    vigente: true,
  },
  {
    _id: 'doc-presupuesto-2026',
    _type: 'documentoOficial',
    titulo: 'Presupuesto General del GAD Municipal 2026',
    slug: { _type: 'slug', current: 'presupuesto-general-2026' },
    categoria: 'presupuesto',
    fechaPublicacion: '2026-01-02T00:00:00.000Z',
    numero: 'Res. GAD-AA-2026-001',
    descripcion: 'Presupuesto aprobado por el Concejo Municipal para el ejercicio fiscal 2026.',
    vigente: true,
  },
  {
    _id: 'doc-plan-desarrollo',
    _type: 'documentoOficial',
    titulo: 'Plan de Desarrollo y Ordenamiento Territorial 2023–2027',
    slug: { _type: 'slug', current: 'pdot-2023-2027' },
    categoria: 'plan',
    fechaPublicacion: '2023-06-01T00:00:00.000Z',
    numero: 'Res. GAD-AA-2023-042',
    descripcion:
      'PDOT que guía el desarrollo cantonal para el período 2023–2027 en los ejes económico, social, ambiental y de movilidad.',
    vigente: true,
  },
];

const configSitio = {
  _id: 'configSitio',
  _type: 'configSitio',
  nombreSitio: 'GAD Municipal de Antonio Ante',
  descripcionSitio:
    'Portal oficial del Gobierno Autónomo Descentralizado Municipal del Cantón Antonio Ante, Imbabura, Ecuador.',
  emailContacto: 'comunicacion@antonioante.gob.ec',
  telefonoContacto: '+593 6 2908-200',
  direccion: 'Av. Luis Leoro Franco y Olmedo, Atuntaqui, Imbabura, Ecuador',
  horarioAtencion: 'Lun–Vie 08h00–17h00',
  redesSocialesInstitucionales: [
    { _key: 'fb', red: 'facebook', url: 'https://www.facebook.com/GADAntonioAnte' },
    { _key: 'ig', red: 'instagram', url: 'https://www.instagram.com/gadantonioante' },
  ],
};

// ─── Ejecución ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log('[seed] Iniciando carga de contenido semilla...\n');

  const docs = [...parroquias, ...noticias, ...documentos, configSitio];

  for (const doc of docs) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await client.createOrReplace(doc as any);
      console.log(`  ✓ ${doc._type}: ${doc._id}`);
    } catch (err) {
      console.error(`  ✗ ${doc._type}: ${doc._id}`, err);
    }
  }

  console.log(`\n[seed] Completado. ${docs.length} documento(s) procesados.`);
  console.log(
    '[seed] Nota: Los documentos oficiales no incluyen archivo PDF — súbelos desde el Studio manualmente.'
  );
}

seed().catch((err) => {
  console.error('[seed] Error fatal:', err);
  process.exit(1);
});

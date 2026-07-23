/**
 * seed-eventos.mjs
 *
 * Crea 5 eventos reales/representativos del cantón Antonio Ante en Sanity.
 * Datos basados en eventos reales del cantón: Expo Atuntaqui, Inti Raymi,
 * Fiestas de Cantonización, Feria Gastronómica de Chaltura, etc.
 *
 * Uso:
 *   SANITY_API_TOKEN=<tu-token> node scripts/seed-eventos.mjs
 *
 * El token debe tener permisos de Editor o Administrador.
 * Créalo en: https://www.sanity.io/manage → proyecto → API → Tokens
 *
 * Idempotente: usa createOrReplace, se puede correr más de una vez sin duplicar.
 */

import { createClient } from '@sanity/client';

// ── Config ─────────────────────────────────────────────────────────────────────
const PROJECT_ID = process.env.PUBLIC_SANITY_PROJECT_ID ?? 'lmfef6xr';
const DATASET    = process.env.PUBLIC_SANITY_DATASET    ?? 'production';
const TOKEN      = process.env.SANITY_API_TOKEN;

if (!TOKEN) {
  console.error('\n❌  Falta SANITY_API_TOKEN.\n');
  console.error('   Créalo en https://www.sanity.io/manage → tu proyecto → API → Tokens');
  console.error('   Necesita permisos de Editor o Administrador.\n');
  console.error('   Luego ejecuta:');
  console.error('   SANITY_API_TOKEN=<token> node scripts/seed-eventos.mjs\n');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2025-01-01',
  useCdn:    false,
  token:     TOKEN,
});

// ── Datos reales del cantón ────────────────────────────────────────────────────
// Fechas en 2026 para que sean "próximos" al momento del seed.
const EVENTOS = [
  {
    _id:   'evento-expo-atuntaqui-2026',
    _type: 'evento',
    titulo: 'Expo Atuntaqui 2026',
    slug: { _type: 'slug', current: 'expo-atuntaqui-2026' },
    categoria: 'feria',
    parroquia: 'Atuntaqui',
    resumen:
      'La feria textil e industrial más grande del norte del Ecuador. Moda, gastronomía, artesanías y cultura durante el feriado de Carnaval en el corazón de Atuntaqui.',
    descripcion: [
      {
        _type: 'block',
        _key: 'ea1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'ea1s',
            marks: [],
            text: 'La Expo Atuntaqui es el evento emblemático del cantón Antonio Ante y la feria textil más importante del norte de Ecuador. Cada año, durante el feriado de Carnaval, las calles del centro histórico de Atuntaqui se transforman en una gran pasarela de moda, gastronomía y cultura.',
          },
        ],
      },
      {
        _type: 'block',
        _key: 'ea2',
        style: 'h3',
        markDefs: [],
        children: [
          { _type: 'span', _key: 'ea2s', marks: [], text: 'Actividades principales' },
        ],
      },
      {
        _type: 'block',
        _key: 'ea3',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'ea3s',
            marks: [],
            text: 'Desfile de modas con diseñadores locales, feria artesanal, patio gastronómico con platos típicos de la zona, música en vivo, comparsas de Carnaval y actividades recreativas para toda la familia.',
          },
        ],
      },
    ],
    fechaInicio: '2026-02-14T09:00:00.000-05:00',
    fechaFin: '2026-02-17T22:00:00.000-05:00',
    lugar: 'Centro histórico de Atuntaqui',
    entradaLibre: true,
    destacado: true,
  },
  {
    _id:   'evento-cantonizacion-2026',
    _type: 'evento',
    titulo: 'Fiestas de Cantonización de Antonio Ante',
    slug: { _type: 'slug', current: 'fiestas-cantonizacion-antonio-ante-2026' },
    categoria: 'civico',
    parroquia: 'Canton',
    resumen:
      'Celebración del aniversario de cantonización de Antonio Ante con desfile cívico-militar, sesión solemne, eventos culturales y deportivos en todas las parroquias.',
    descripcion: [
      {
        _type: 'block',
        _key: 'ca1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'ca1s',
            marks: [],
            text: 'El 2 de marzo de 1938 se creó el cantón Antonio Ante. Cada año, la semana de cantonización se celebra con un desfile cívico-militar, sesión solemne del Concejo Municipal, eventos culturales, competencias deportivas y la tradicional verbena popular.',
          },
        ],
      },
    ],
    fechaInicio: '2026-03-02T08:00:00.000-05:00',
    fechaFin: '2026-03-07T23:00:00.000-05:00',
    lugar: 'Parque Central de Atuntaqui',
    entradaLibre: true,
    destacado: false,
  },
  {
    _id:   'evento-inti-raymi-2026',
    _type: 'evento',
    titulo: 'Inti Raymi — Fiesta del Sol',
    slug: { _type: 'slug', current: 'inti-raymi-2026' },
    categoria: 'cultura',
    parroquia: 'San Roque',
    resumen:
      'Celebración ancestral del solsticio de verano con danzas rituales, música tradicional, baños ceremoniales y la toma simbólica de la plaza en las comunidades indígenas del cantón.',
    descripcion: [
      {
        _type: 'block',
        _key: 'ir1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'ir1s',
            marks: [],
            text: 'El Inti Raymi es una de las festividades más importantes de los pueblos indígenas de la sierra norte. En Antonio Ante, especialmente en las comunidades de San Roque y Natabuela, se celebra con danzas de guerreros, baños rituales en vertientes sagradas y la toma simbólica de la plaza central al ritmo de flautas y tambores.',
          },
        ],
      },
    ],
    fechaInicio: '2026-06-21T06:00:00.000-05:00',
    fechaFin: '2026-06-24T22:00:00.000-05:00',
    lugar: 'Plaza Central de San Roque',
    entradaLibre: true,
    destacado: false,
  },
  {
    _id:   'evento-feria-gastronomica-chaltura-2026',
    _type: 'evento',
    titulo: 'Feria Gastronómica de Chaltura',
    slug: { _type: 'slug', current: 'feria-gastronomica-chaltura-2026' },
    categoria: 'agropecuario',
    parroquia: 'Chaltura',
    resumen:
      'Chaltura, capital gastronómica de Imbabura, celebra su feria anual con preparaciones de cuy asado, fritada, helados de paila y productos agrícolas de la zona.',
    descripcion: [
      {
        _type: 'block',
        _key: 'fg1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'fg1s',
            marks: [],
            text: 'Chaltura es reconocida a nivel nacional como la capital gastronómica de Imbabura, famosa por sus restaurantes de cuy asado y fritada. La feria reúne a productores locales, cocineros tradicionales y emprendedores gastronómicos en una jornada de sabores, música y cultura.',
          },
        ],
      },
    ],
    fechaInicio: '2026-09-12T10:00:00.000-05:00',
    fechaFin: '2026-09-13T20:00:00.000-05:00',
    lugar: 'Parque Central de Chaltura',
    entradaLibre: true,
    destacado: false,
  },
  {
    _id:   'evento-carrera-atletica-2026',
    _type: 'evento',
    titulo: 'Carrera Atlética 10K Antonio Ante',
    slug: { _type: 'slug', current: 'carrera-atletica-10k-antonio-ante-2026' },
    categoria: 'deporte',
    parroquia: 'Canton',
    resumen:
      'Carrera pedestre de 10 kilómetros que recorre las principales parroquias del cantón. Categorías: élite, máster, juvenil y familiar (3K). Premios en efectivo y trofeos.',
    descripcion: [
      {
        _type: 'block',
        _key: 'ca1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'ca1s',
            marks: [],
            text: 'La Carrera Atlética 10K Antonio Ante une deporte y turismo con un recorrido que atraviesa Atuntaqui, Andrade Marín y Natabuela, mostrando los paisajes más emblemáticos del cantón. Incluye una carrera familiar de 3K abierta a todas las edades.',
          },
        ],
      },
    ],
    fechaInicio: '2026-11-15T07:00:00.000-05:00',
    lugar: 'Estadio Municipal de Atuntaqui',
    entradaLibre: false,
    enlaceRegistro: 'https://www.antonioante.gob.ec',
    destacado: false,
  },
];

// ── Helper: publish a document ─────────────────────────────────────────────────
async function publishEvento(evento) {
  await client.createOrReplace(evento);
  try {
    await client.delete(`drafts.${evento._id}`);
  } catch {
    // No había borrador — ignorar
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📅  Seeding ${EVENTOS.length} eventos en Sanity (${PROJECT_ID}/${DATASET})...\n`);

  for (const evento of EVENTOS) {
    try {
      await publishEvento(evento);
      console.log(`  ✅  ${evento.titulo}`);
    } catch (err) {
      console.error(`  ❌  ${evento.titulo}\n     ${err.message}`);
    }
  }

  console.log('\n✨  Listo. Recarga el frontend para ver los eventos.\n');
}

main().catch((err) => {
  console.error('\n💥  Error inesperado:', err.message);
  process.exit(1);
});

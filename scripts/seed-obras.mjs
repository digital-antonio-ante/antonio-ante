/**
 * seed-obras.mjs
 *
 * Crea 5 obras municipales reales en Sanity (publicadas, no solo drafts).
 * Datos extraídos del sitio oficial: https://www.antonioante.gob.ec/AntonioAnte/
 *
 * Uso:
 *   SANITY_API_TOKEN=<tu-token> node scripts/seed-obras.mjs
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
  console.error('   SANITY_API_TOKEN=<token> node scripts/seed-obras.mjs\n');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2025-01-01',
  useCdn:    false,
  token:     TOKEN,
});

// ── Datos reales ────────────────────────────────────────────────────────────────
// Fuente: antonioante.gob.ec/AntonioAnte — obras públicas y noticias oficiales
const OBRAS = [
  {
    _id:   'obra-adoquinado-gral-enriquez',
    _type: 'obra',
    titulo: 'Adoquinado y bordillos — Calle General Enríquez',
    slug: { _type: 'slug', current: 'adoquinado-calle-general-enriquez' },
    categoria: 'vialidad',
    parroquia: 'Andrade Marín',
    estado: 'completada',
    porcentajeAvance: 100,
    presupuestoUSD: 96422,
    familiasBeneficiadas: 320,
    resumen:
      'Adoquinado de 2 099 m² e instalación de bordillos en 884 metros lineales en la Calle General Enríquez, mejorando la conectividad vial de la parroquia Andrade Marín.',
    destacada: false,
    fechaInicio: '2023-06-01',
    fechaEstimadaFin: '2023-11-30',
  },
  {
    _id:   'obra-adoquinado-calle-dalmau',
    _type: 'obra',
    titulo: 'Adoquinado decorativo y veredas — Calle Dalmau',
    slug: { _type: 'slug', current: 'adoquinado-calle-dalmau' },
    categoria: 'vialidad',
    parroquia: 'Andrade Marín',
    estado: 'completada',
    porcentajeAvance: 100,
    presupuestoUSD: 31567,
    familiasBeneficiadas: 95,
    resumen:
      'Instalación de adoquinado decorativo en 656 m², veredas en 128 m² y bordillo pesado en 92 metros lineales en la Calle Dalmau, mejorando la imagen urbana del sector.',
    destacada: false,
    fechaInicio: '2023-06-01',
    fechaEstimadaFin: '2023-10-31',
  },
  {
    _id:   'obra-adoquinado-calle-penaherrera',
    _type: 'obra',
    titulo: 'Adoquinado, veredas y canal de aguas lluvia — Calle Peñaherrera',
    slug: { _type: 'slug', current: 'adoquinado-calle-penaherrera' },
    categoria: 'vialidad',
    parroquia: 'Andrade Marín',
    estado: 'completada',
    porcentajeAvance: 100,
    presupuestoUSD: 79834,
    familiasBeneficiadas: 280,
    resumen:
      'Adoquinado de 1 866 m², veredas en 721 m², bordillos en 461 m lineales y canal de aguas lluvias con tubería de cemento de 800 mm en la Calle Peñaherrera.',
    destacada: false,
    fechaInicio: '2023-07-01',
    fechaEstimadaFin: '2023-12-15',
  },
  {
    _id:   'obra-sistema-riego-estadio-gangotena',
    _type: 'obra',
    titulo: 'Sistema de riego para el estadio de La Gangotena',
    slug: { _type: 'slug', current: 'sistema-riego-estadio-gangotena' },
    categoria: 'espacios_publicos',
    parroquia: 'San Roque',
    estado: 'completada',
    porcentajeAvance: 100,
    familiasBeneficiadas: 450,
    resumen:
      'Instalación de sistema de riego tecnificado en el estadio de La Gangotena, resultado de una alianza comunitaria que garantiza el mantenimiento del área deportiva durante todo el año.',
    destacada: true,
    fechaInicio: '2024-01-15',
    fechaEstimadaFin: '2024-04-30',
  },
  {
    _id:   'obra-nomenclatura-vial-canton',
    _type: 'obra',
    titulo: 'Instalación de nomenclatura vial en el cantón Antonio Ante',
    slug: { _type: 'slug', current: 'nomenclatura-vial-canton-antonio-ante' },
    categoria: 'vialidad',
    parroquia: 'Canton',
    estado: 'completada',
    porcentajeAvance: 100,
    familiasBeneficiadas: 12000,
    resumen:
      'Colocación de señalética y nomenclatura vial almacenada en bodega por más de 5 años, ejecutada por los departamentos de Planificación y Obras Públicas para mejorar la orientación ciudadana en todo el cantón.',
    destacada: false,
    fechaInicio: '2023-05-01',
    fechaEstimadaFin: '2023-08-31',
  },
];

// ── Helper: publish a document (makes _id canonical, no "drafts." prefix) ───────
async function publishObra(obra) {
  // Upsert como documento publicado (sin prefijo "drafts.")
  await client.createOrReplace(obra);

  // Si existiera un borrador del mismo ID, lo eliminamos para no dejar basura
  try {
    await client.delete(`drafts.${obra._id}`);
  } catch {
    // No había borrador — ignorar
  }
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏗️  Seeding ${OBRAS.length} obras en Sanity (${PROJECT_ID}/${DATASET})...\n`);

  for (const obra of OBRAS) {
    try {
      await publishObra(obra);
      console.log(`  ✅  ${obra.titulo}`);
    } catch (err) {
      console.error(`  ❌  ${obra.titulo}\n     ${err.message}`);
    }
  }

  console.log('\n✨  Listo. Recarga el frontend para ver las obras.\n');
}

main().catch((err) => {
  console.error('\n💥  Error inesperado:', err.message);
  process.exit(1);
});

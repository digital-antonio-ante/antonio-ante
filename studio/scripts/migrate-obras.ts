/**
 * migrate-obras.ts — Reemplaza el listado de obras.
 *
 * Conserva la obra de la Comuna Pukara, ELIMINA el resto y crea las obras
 * entregadas en junio–julio (fuente: página oficial del Municipio).
 *
 * Uso:
 *   npx tsx studio/scripts/migrate-obras.ts              # DRY-RUN (no cambia nada)
 *   SANITY_API_TOKEN=xxx npx tsx studio/scripts/migrate-obras.ts --apply
 *
 * El token debe tener permiso de escritura (rol Editor). El dry-run solo lee
 * (el dataset es público) y muestra exactamente qué se eliminaría y crearía.
 */
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const projectId = 'lmfef6xr';
const dataset = 'production';
const apiVersion = '2025-01-01';

const readClient = createClient({ projectId, dataset, apiVersion, useCdn: false });

// ── Obras nuevas (orden cronológico: la más reciente se crea al final y queda
//    primera por _createdAt en la grilla del sitio). ────────────────────────────
type NuevaObra = {
  _id: string;
  titulo: string;
  slug: string;
  categoria: string;
  parroquia: string;
  estado: 'planificada' | 'en_progreso' | 'completada';
  porcentajeAvance: number;
  resumen: string;
};

const NUEVAS: NuevaObra[] = [
  {
    _id: 'obra-cancha-barrio-san-jose-atuntaqui',
    titulo: 'Renovación de la cancha del Barrio San José – Atuntaqui',
    slug: 'cancha-barrio-san-jose-atuntaqui',
    categoria: 'espacios_publicos',
    parroquia: 'Atuntaqui',
    estado: 'en_progreso',
    porcentajeAvance: 80,
    resumen:
      'Renovación del espacio deportivo del Barrio San José: nuevo césped sintético, caminerías de hormigón y pintura general. Están por entregarse las canchas de vóley y básquet.',
  },
  {
    _id: 'obra-adoquinado-pablo-rivera-napo-chaltura',
    titulo: 'Aceras, bordillos y adoquinado de las calles Pablo Rivera y Napo – Chaltura',
    slug: 'adoquinado-pablo-rivera-napo-chaltura',
    categoria: 'vialidad',
    parroquia: 'Chaltura',
    estado: 'completada',
    porcentajeAvance: 100,
    resumen:
      'Construcción de aceras, bordillos y adoquinado de las calles Pablo Rivera y Napo, con adecuación de canales de riego y conexiones de alcantarillado sanitario y pluvial.',
  },
  {
    _id: 'obra-iluminacion-parque-central-andrade-marin',
    titulo: 'Mejoramiento de la iluminación del Parque Central de Andrade Marín',
    slug: 'iluminacion-parque-central-andrade-marin',
    categoria: 'espacios_publicos',
    parroquia: 'Andrade Marín',
    estado: 'completada',
    porcentajeAvance: 100,
    resumen:
      'Arreglo y mejoramiento de la iluminación del Parque Central: luces wall washer con cambio de colores e instalación de postes y luminarias adicionales para un disfrute nocturno seguro.',
  },
  {
    _id: 'obra-calles-progreso-general-enriquez-atuntaqui',
    titulo: 'Renovación de las calles El Progreso y General Enríquez – Barrio San José, Atuntaqui',
    slug: 'calles-progreso-general-enriquez-atuntaqui',
    categoria: 'vialidad',
    parroquia: 'Atuntaqui',
    estado: 'completada',
    porcentajeAvance: 100,
    resumen:
      'Vías renovadas en las calles El Progreso y General Enríquez, en el Barrio San José de Atuntaqui, para que las familias se movilicen con mayor seguridad y comodidad.',
  },
  {
    _id: 'obra-parque-familia-chaltura',
    titulo:
      'Repotenciación e iluminación de la cancha y mejoramiento del Parque de la Familia de Chaltura',
    slug: 'parque-familia-chaltura',
    categoria: 'espacios_publicos',
    parroquia: 'Chaltura',
    estado: 'completada',
    porcentajeAvance: 100,
    resumen:
      'Nuevo césped sintético e iluminación LED en la cancha, graderíos y juegos infantiles restaurados, nuevas bancas y jardineras, y baterías sanitarias reparadas.',
  },
];

function esPukara(o: { titulo?: string; slug?: { current?: string }; _id: string }): boolean {
  const hay = `${o.titulo ?? ''} ${o.slug?.current ?? ''} ${o._id}`.toLowerCase();
  return hay.includes('pukara');
}

async function main() {
  console.log(`\n=== MIGRACIÓN DE OBRAS — ${APPLY ? 'APLICAR' : 'DRY-RUN (sin cambios)'} ===\n`);

  // Validar longitud de resúmenes (schema: máx 200)
  const largos = NUEVAS.filter((o) => o.resumen.length > 200);
  if (largos.length) {
    console.error('✘ Resúmenes que superan 200 caracteres:');
    largos.forEach((o) => console.error(`   - ${o.slug} (${o.resumen.length})`));
    process.exit(1);
  }

  const existentes = await readClient.fetch<
    Array<{ _id: string; titulo?: string; slug?: { current?: string }; destacada?: boolean }>
  >(`*[_type == "obra"]{_id, titulo, slug, destacada}`);

  const pukara = existentes.filter(esPukara);
  const aEliminar = existentes.filter((o) => !esPukara(o));

  // Guarda de seguridad: si no aparece la de Pukara, NO borrar nada.
  if (pukara.length === 0) {
    console.error(
      '✘ ABORTADO: no se encontró la obra de la Comuna Pukara. No se elimina nada por seguridad.'
    );
    process.exit(1);
  }

  console.log(`Se CONSERVA (${pukara.length}):`);
  pukara.forEach((o) => console.log(`   ✅ ${o.titulo} ${o.destacada ? '⭐' : ''}  [${o._id}]`));

  console.log(`\nSe ELIMINAN (${aEliminar.length}):`);
  aEliminar.forEach((o) => console.log(`   🗑️  ${o.titulo ?? '(sin título)'}  [${o._id}]`));

  console.log(`\nSe CREAN (${NUEVAS.length}):`);
  NUEVAS.forEach((o) => console.log(`   ➕ ${o.titulo}  [${o.estado} ${o.porcentajeAvance}%]`));

  if (!APPLY) {
    console.log(
      '\n(DRY-RUN) No se hizo ningún cambio. Vuelve a ejecutar con --apply para aplicar.\n'
    );
    return;
  }

  const token = process.env.SANITY_API_TOKEN;
  if (!token) {
    console.error('\n✘ Falta SANITY_API_TOKEN (con permiso de escritura) para aplicar.');
    process.exit(1);
  }
  const writeClient = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

  // Eliminar (incluye posibles borradores drafts.<id>)
  for (const o of aEliminar) {
    await writeClient.delete(o._id);
    console.log(`   eliminada ${o._id}`);
  }

  // Crear / reemplazar
  for (const o of NUEVAS) {
    await writeClient.createOrReplace({
      _id: o._id,
      _type: 'obra',
      titulo: o.titulo,
      slug: { _type: 'slug', current: o.slug },
      categoria: o.categoria,
      parroquia: o.parroquia,
      estado: o.estado,
      porcentajeAvance: o.porcentajeAvance,
      resumen: o.resumen,
      destacada: false,
    });
    console.log(`   creada ${o.slug}`);
  }

  console.log(
    '\n✔ Migración aplicada. Recuerda subir la imagen principal de cada obra en el Studio.\n'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

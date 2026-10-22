import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';
import { inicioDelDiaEcuador } from '@shared/utils/fecha';

// ── Schemas ──────────────────────────────────────────────────────────────────

const GaleriaItemSchema = z.object({
  url: z.string().url().nullish(),
  alt: z.string().nullish(),
});

export const EventoSchema = z.object({
  _id: z.string(),
  titulo: z.string(),
  slug: z.object({ current: z.string() }),
  categoria: z.string(),
  parroquia: z.string(),
  resumen: z.string(),
  /** PortableText blocks — se renderiza en la página de detalle */
  descripcion: z.array(z.unknown()).nullish(),
  fechaInicio: z.string(),
  fechaFin: z.string().nullish(),
  lugar: z.string(),
  entradaLibre: z.boolean().nullish(),
  enlaceRegistro: z.string().url().nullish(),
  imageUrl: z.string().url().nullish(),
  imageAlt: z.string().nullish(),
  imageDims: z.object({ width: z.number(), height: z.number() }).nullish(),
  /** Punto focal elegido en el Studio (hotspot), de 0 a 1 */
  imageFoco: z.object({ x: z.number(), y: z.number() }).nullish(),
  destacado: z.boolean().nullish(),
  galeria: z.array(GaleriaItemSchema).nullish(),
});

export type Evento = z.infer<typeof EventoSchema>;

// ── Proyección GROQ ──────────────────────────────────────────────────────────

const FIELDS = `
  _id, titulo, slug, categoria, parroquia, resumen, descripcion,
  fechaInicio, fechaFin, lugar, entradaLibre, enlaceRegistro, destacado,
  "imageUrl": imagenPrincipal.asset->url,
  "imageAlt": imagenPrincipal.alt,
  "imageDims": imagenPrincipal.asset->metadata.dimensions{width, height},
  "imageFoco": imagenPrincipal.hotspot{x, y},
  "galeria": galeria[]{
    "url": asset->url,
    "alt": alt
  }
`;

// ── Queries ──────────────────────────────────────────────────────────────────

// Un evento está vigente hasta que TERMINA, no hasta que empieza: una feria de
// tres días sigue siendo "próxima" mientras dura, y uno sin fechaFin, hasta el
// final de su día en Ecuador. Mismo criterio que `haTerminado()`.
const VIGENTE = `(
  (defined(fechaFin) && dateTime(fechaFin) >= dateTime($now)) ||
  (!defined(fechaFin) && dateTime(fechaInicio) >= dateTime($hoy))
)`;

/** Parámetros de fecha que usan todas las consultas por vigencia. */
const ahoraParams = () => ({ now: new Date().toISOString(), hoy: inicioDelDiaEcuador() });

/** Eventos próximos o en curso (aún no terminan), orden cronológico asc */
export async function getEventosProximos(limit = 10): Promise<Evento[]> {
  const query = `
    *[_type == "evento" && ${VIGENTE}]
    | order(fechaInicio asc) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema), { ...ahoraParams(), limit });
}

/** Eventos ya terminados, orden cronológico desc */
export async function getEventosPasados(limit = 20): Promise<Evento[]> {
  const query = `
    *[_type == "evento" && !${VIGENTE}]
    | order(fechaInicio desc) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema), { ...ahoraParams(), limit });
}

/**
 * Evento destacado para la home: el más cercano de los marcados que aún no
 * terminan. Uno ya realizado no se destaca —la home anunciaba en octubre la
 * Expo de febrero con un flyer de "faltan 15 días"—; sin vigentes, la sección
 * no se muestra.
 */
export async function getEventoDestacado(): Promise<Evento | null> {
  const query = `
    *[_type == "evento" && destacado == true && ${VIGENTE}]
    | order(fechaInicio asc) [0] { ${FIELDS} }
  `;
  return fetchSanity(query, EventoSchema.nullable(), ahoraParams());
}

/** Evento por slug — para la página de detalle */
export async function getEventoBySlug(slug: string): Promise<Evento | null> {
  const query = `*[_type == "evento" && slug.current == $slug][0] { ${FIELDS} }`;
  return fetchSanity(query, EventoSchema.nullable(), { slug });
}

/** Todos los eventos — para el listado /eventos (SSR) */
export async function getTodosLosEventos(): Promise<Evento[]> {
  const query = `
    *[_type == "evento"] | order(fechaInicio desc) { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema));
}

/** Próximos eventos de una parroquia — para la ficha de parroquia (máx 3) */
export async function getEventosByParroquia(parroquia: string, limit = 3): Promise<Evento[]> {
  const query = `
    *[_type == "evento" && parroquia == $parroquia && ${VIGENTE}]
    | order(fechaInicio asc) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema), { ...ahoraParams(), parroquia, limit });
}

import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';

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
  "galeria": galeria[]{
    "url": asset->url,
    "alt": alt
  }
`;

// ── Queries ──────────────────────────────────────────────────────────────────

/** Eventos próximos (fechaInicio >= ahora), orden cronológico asc */
export async function getEventosProximos(limit = 10): Promise<Evento[]> {
  const now = new Date().toISOString();
  const query = `
    *[_type == "evento" && fechaInicio >= $now]
    | order(fechaInicio asc) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema), { now, limit });
}

/** Eventos pasados (fechaInicio < ahora), orden cronológico desc */
export async function getEventosPasados(limit = 20): Promise<Evento[]> {
  const now = new Date().toISOString();
  const query = `
    *[_type == "evento" && fechaInicio < $now]
    | order(fechaInicio desc) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema), { now, limit });
}

/** Evento marcado como destacado — para el homepage (máx uno activo) */
export async function getEventoDestacado(): Promise<Evento | null> {
  const query = `
    *[_type == "evento" && destacado == true]
    | order(_createdAt desc) [0] { ${FIELDS} }
  `;
  return fetchSanity(query, EventoSchema.nullable());
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
  const now = new Date().toISOString();
  const query = `
    *[_type == "evento" && parroquia == $parroquia && fechaInicio >= $now]
    | order(fechaInicio asc) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(EventoSchema), { parroquia, now, limit });
}

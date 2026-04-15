import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';

const ObraSchema = z.object({
  _id: z.string(),
  titulo: z.string(),
  slug: z.object({ current: z.string() }),
  categoria: z.string(),
  parroquia: z.string(),
  estado: z.enum(['planificada', 'en_progreso', 'completada']),
  porcentajeAvance: z.number().min(0).max(100),
  presupuestoUSD: z.number().nullish(),
  familiasBeneficiadas: z.number().nullish(),
  resumen: z.string(),
  imageUrl: z.string().url().nullish(),
  imageAlt: z.string().nullish(),
  destacada: z.boolean().nullish(),
  fechaInicio: z.string().nullish(),
  fechaEstimadaFin: z.string().nullish(),
});

export type Obra = z.infer<typeof ObraSchema>;

const FIELDS = `
  _id, titulo, slug, categoria, parroquia, estado,
  porcentajeAvance, presupuestoUSD, familiasBeneficiadas,
  resumen, destacada, fechaInicio, fechaEstimadaFin,
  "imageUrl": imagenPrincipal.asset->url,
  "imageAlt": imagenPrincipal.alt
`;

/** Obras visibles en el homepage — excluye la destacada (tiene su propia sección) */
export async function getObrasRecientes(limit = 6): Promise<Obra[]> {
  const query = `
    *[_type == "obra" && destacada != true] | order(
      select(estado == "en_progreso" => 0, estado == "completada" => 1, 2) asc,
      _createdAt desc
    ) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(ObraSchema), { limit });
}

/** Todas las obras — para la página /obras (incluye la destacada) */
export async function getTodasLasObras(): Promise<Obra[]> {
  const query = `
    *[_type == "obra"] | order(
      select(estado == "en_progreso" => 0, estado == "completada" => 1, 2) asc,
      _createdAt desc
    ) { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(ObraSchema));
}

/** Obra por slug — para la página de detalle */
export async function getObraBySlug(slug: string): Promise<Obra | null> {
  const query = `*[_type == "obra" && slug.current == $slug][0] { ${FIELDS} }`;
  return fetchSanity(query, ObraSchema.nullable(), { slug });
}

/** Obra marcada como destacada — solo una a la vez */
export async function getObraDestacada(): Promise<Obra | null> {
  const query = `*[_type == "obra" && destacada == true] | order(_createdAt desc) [0] { ${FIELDS} }`;
  return fetchSanity(query, ObraSchema.nullable());
}

/** Obras vinculadas a una parroquia — para la ficha de cada parroquia (máx 3) */
export async function getObrasByParroquia(nombre: string, limit = 3): Promise<Obra[]> {
  const query = `
    *[_type == "obra" && parroquia == $nombre] | order(
      select(estado == "en_progreso" => 0, estado == "completada" => 1, 2) asc,
      _createdAt desc
    ) [0...$limit] { ${FIELDS} }
  `;
  return fetchSanity(query, z.array(ObraSchema), { nombre, limit });
}

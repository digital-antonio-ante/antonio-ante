import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';
import {
  NoticiaListItemSchema,
  NoticiaSchema,
  type CategoriaNoticia,
  type Noticia,
  type NoticiaListItem,
} from '../../lib/validations';

/**
 * Filtro base: solo artículos con todos los campos requeridos por NoticiaListItemSchema.
 * Protege contra borradores incompletos que romperían la validación Zod (fail-fast).
 */
const COMPLETE_FILTER = `
  _type == "noticia"
  && defined(titulo) && length(titulo) > 0
  && defined(slug.current) && length(slug.current) > 0
  && defined(resumen) && length(resumen) > 0
  && defined(publishedAt)
  && defined(categoria)
`;

const NOTICIA_FIELDS = `
  _id, _type, _createdAt, _updatedAt, _rev,
  titulo, slug, resumen, publishedAt,
  categoria, imagenPortada, destacada
`;

const QUERY_LIST = `
  *[${COMPLETE_FILTER}] | order(publishedAt desc) { ${NOTICIA_FIELDS} }
`;

const QUERY_BY_SLUG = `
  *[${COMPLETE_FILTER} && slug.current == $slug][0] {
    ${NOTICIA_FIELDS}, cuerpo
  }
`;

const QUERY_BY_CATEGORIA = `
  *[${COMPLETE_FILTER} && categoria == $categoria] | order(publishedAt desc) { ${NOTICIA_FIELDS} }
`;

const QUERY_DESTACADAS = `
  *[${COMPLETE_FILTER} && destacada == true] | order(publishedAt desc) [0...$limit] { ${NOTICIA_FIELDS} }
`;

const QUERY_RECIENTES = `
  *[${COMPLETE_FILTER}] | order(publishedAt desc) [0...$limit] { ${NOTICIA_FIELDS} }
`;

export async function getNoticias(): Promise<NoticiaListItem[]> {
  return fetchSanity(QUERY_LIST, z.array(NoticiaListItemSchema));
}

export async function getNoticiasDestacadas(limit = 3): Promise<NoticiaListItem[]> {
  return fetchSanity(QUERY_DESTACADAS, z.array(NoticiaListItemSchema), { limit });
}

export async function getNoticiasRecientes(limit = 6): Promise<NoticiaListItem[]> {
  return fetchSanity(QUERY_RECIENTES, z.array(NoticiaListItemSchema), { limit });
}

export async function getNoticia(slug: string): Promise<Noticia | null> {
  return fetchSanity(QUERY_BY_SLUG, NoticiaSchema.nullable(), { slug });
}

export async function getNoticiasByCategoria(
  categoria: CategoriaNoticia
): Promise<NoticiaListItem[]> {
  return fetchSanity(QUERY_BY_CATEGORIA, z.array(NoticiaListItemSchema), {
    categoria,
  });
}

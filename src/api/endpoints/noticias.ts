import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';
import {
  NoticiaListItemSchema,
  NoticiaSchema,
  type CategoriaNoticia,
  type Noticia,
  type NoticiaListItem,
} from '../../lib/validations';

const QUERY_LIST = `
  *[_type == "noticia"] | order(publishedAt desc) {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, resumen, publishedAt,
    categoria, imagenPortada, destacada
  }
`;

const QUERY_BY_SLUG = `
  *[_type == "noticia" && slug.current == $slug][0] {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, resumen, cuerpo, publishedAt,
    categoria, imagenPortada, destacada
  }
`;

const QUERY_BY_CATEGORIA = `
  *[_type == "noticia" && categoria == $categoria] | order(publishedAt desc) {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, resumen, publishedAt,
    categoria, imagenPortada, destacada
  }
`;

const QUERY_DESTACADAS = `
  *[_type == "noticia" && destacada == true] | order(publishedAt desc) [0...$limit] {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, resumen, publishedAt,
    categoria, imagenPortada, destacada
  }
`;

const QUERY_RECIENTES = `
  *[_type == "noticia"] | order(publishedAt desc) [0...$limit] {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, resumen, publishedAt,
    categoria, imagenPortada, destacada
  }
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

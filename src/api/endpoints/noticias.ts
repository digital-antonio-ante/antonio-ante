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

export async function getNoticias(): Promise<NoticiaListItem[]> {
  return fetchSanity(QUERY_LIST, z.array(NoticiaListItemSchema));
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

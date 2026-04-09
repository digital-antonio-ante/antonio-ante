import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';
import {
  DocumentoOficialSchema,
  type CategoriaDocumento,
  type DocumentoOficial,
} from '../../lib/validations';

const QUERY_LIST = `
  *[_type == "documentoOficial"] | order(fechaPublicacion desc) {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, categoria, fechaPublicacion,
    numero, archivo, descripcion, vigente
  }
`;

const QUERY_VIGENTES = `
  *[_type == "documentoOficial" && vigente == true] | order(fechaPublicacion desc) {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, categoria, fechaPublicacion,
    numero, archivo, descripcion, vigente
  }
`;

const QUERY_BY_SLUG = `
  *[_type == "documentoOficial" && slug.current == $slug][0] {
    _id, _type, _createdAt, _updatedAt, _rev,
    titulo, slug, categoria, fechaPublicacion,
    numero, archivo, descripcion, vigente
  }
`;

export async function getDocumentos(): Promise<DocumentoOficial[]> {
  return fetchSanity(QUERY_LIST, z.array(DocumentoOficialSchema));
}

export async function getDocumentosVigentes(): Promise<DocumentoOficial[]> {
  return fetchSanity(QUERY_VIGENTES, z.array(DocumentoOficialSchema));
}

export async function getDocumento(slug: string): Promise<DocumentoOficial | null> {
  return fetchSanity(QUERY_BY_SLUG, DocumentoOficialSchema.nullable(), {
    slug,
  });
}

export async function getDocumentosByCategoria(
  categoria: CategoriaDocumento
): Promise<DocumentoOficial[]> {
  const query = `
    *[_type == "documentoOficial" && categoria == $categoria] | order(fechaPublicacion desc) {
      _id, _type, _createdAt, _updatedAt, _rev,
      titulo, slug, categoria, fechaPublicacion,
      numero, archivo, descripcion, vigente
    }
  `;
  return fetchSanity(query, z.array(DocumentoOficialSchema), { categoria });
}

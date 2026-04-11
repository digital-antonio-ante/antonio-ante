import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';
import {
  NombreParroquiaSchema,
  ParroquiaSchema,
  type NombreParroquia,
  type Parroquia,
} from '../../lib/validations';

/**
 * Schema mínimo para resolver image URLs en build time.
 * Deliberadamente leniente — no requiere slug ni campos opcionales,
 * para que documentos incompletos en Sanity no rompan la query entera.
 */
const ParroquiaImageSchema = z.object({
  nombre: NombreParroquiaSchema,
  imageUrl: z.string().url().nullish(),
});
export type ParroquiaImage = z.infer<typeof ParroquiaImageSchema>;

const QUERY_IMAGES = `
  *[_type == "parroquia" && defined(imagenPrincipal.asset)] {
    nombre,
    "imageUrl": imagenPrincipal.asset->url
  }
`;

export async function getParroquiasImageUrls(): Promise<ParroquiaImage[]> {
  return fetchSanity(QUERY_IMAGES, z.array(ParroquiaImageSchema));
}

const QUERY_LIST = `
  *[_type == "parroquia"] | order(nombre asc) {
    _id, _type, _createdAt, _updatedAt, _rev,
    nombre, slug, poblacion, superficieKm2,
    coordenadas, imagenPrincipal, esCabeceraCantonal,
    "imageUrl": imagenPrincipal.asset->url
  }
`;

const QUERY_BY_SLUG = `
  *[_type == "parroquia" && slug.current == $slug][0] {
    _id, _type, _createdAt, _updatedAt, _rev,
    nombre, slug, descripcion, poblacion, superficieKm2,
    coordenadas, imagenPrincipal, esCabeceraCantonal
  }
`;

export async function getParroquias(): Promise<Parroquia[]> {
  return fetchSanity(QUERY_LIST, z.array(ParroquiaSchema));
}

export async function getParroquia(slug: string): Promise<Parroquia | null> {
  return fetchSanity(QUERY_BY_SLUG, ParroquiaSchema.nullable(), { slug });
}

export async function getCabeceraCantonal(): Promise<Parroquia | null> {
  const query = `*[_type == "parroquia" && esCabeceraCantonal == true][0] {
    _id, _type, _createdAt, _updatedAt, _rev,
    nombre, slug, descripcion, poblacion, superficieKm2,
    coordenadas, imagenPrincipal, esCabeceraCantonal
  }`;
  return fetchSanity(query, ParroquiaSchema.nullable());
}

export async function getParroquiaByNombre(nombre: NombreParroquia): Promise<Parroquia | null> {
  const query = `*[_type == "parroquia" && nombre == $nombre][0] {
    _id, _type, _createdAt, _updatedAt, _rev,
    nombre, slug, descripcion, poblacion, superficieKm2,
    coordenadas, imagenPrincipal, esCabeceraCantonal
  }`;
  return fetchSanity(query, ParroquiaSchema.nullable(), { nombre });
}

import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';
import { ParroquiaSchema, type NombreParroquia, type Parroquia } from '../../lib/validations';

const QUERY_LIST = `
  *[_type == "parroquia"] | order(nombre asc) {
    _id, _type, _createdAt, _updatedAt, _rev,
    nombre, slug, poblacion, superficieKm2,
    coordenadas, imagenPrincipal, esCabeceraCantonal
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

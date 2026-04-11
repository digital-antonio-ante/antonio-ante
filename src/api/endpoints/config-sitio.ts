import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';

const SocialRedSchema = z.object({
  red: z.enum(['facebook', 'instagram', 'twitter', 'youtube', 'tiktok']),
  url: z.string().url(),
});

const EnlaceSchema = z.object({
  titulo: z.string(),
  url: z.string().url(),
});

const HighlightCantonSchema = z.object({
  icono: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
});

/**
 * Singleton configSitio — todo lo que el frontend necesita en build time.
 * asset->url resuelve el CDN URL directamente en GROQ, sin @sanity/image-url.
 */
const ConfigSitioSchema = z.object({
  logoUrl: z.string().url().nullish(),
  logoAlt: z.string().nullish(),
  cantonImageUrl: z.string().url().nullish(),
  cantonImageAlt: z.string().nullish(),
  sloganCanton: z.string().nullish(),
  descripcionCanton: z.string().nullish(),
  highlightsCanton: z.array(HighlightCantonSchema).nullish(),
  ogImageUrl: z.string().url().nullish(),
  emailContacto: z.string().nullish(),
  telefonoContacto: z.string().nullish(),
  direccion: z.string().nullish(),
  horarioAtencion: z.string().nullish(),
  redesSociales: z.array(SocialRedSchema).nullish(),
  enlacesInstitucionales: z.array(EnlaceSchema).nullish(),
});

export type ConfigSitio = z.infer<typeof ConfigSitioSchema>;
export type SocialRed = z.infer<typeof SocialRedSchema>;
export type EnlaceInstitucional = z.infer<typeof EnlaceSchema>;
export type HighlightCanton = z.infer<typeof HighlightCantonSchema>;

const QUERY = `
  *[_type == "configSitio"][0] {
    "logoUrl": logoInstitucional.asset->url,
    "logoAlt": logoInstitucional.alt,
    "cantonImageUrl": imagenCanton.asset->url,
    "cantonImageAlt": imagenCanton.alt,
    sloganCanton,
    descripcionCanton,
    "highlightsCanton": highlightsCanton[]{icono, titulo, subtitulo},
    "ogImageUrl": ogImageDefault.asset->url,
    emailContacto,
    telefonoContacto,
    direccion,
    horarioAtencion,
    "redesSociales": redesSocialesInstitucionales[]{red, url},
    "enlacesInstitucionales": enlacesInstitucionales[]{titulo, url}
  }
`;

export async function getConfigSitio(): Promise<ConfigSitio | null> {
  return fetchSanity(QUERY, ConfigSitioSchema.nullable());
}

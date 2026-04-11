import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';

/**
 * Singleton configSitio — todo lo que el frontend necesita en build time.
 * asset->url resuelve el CDN URL directamente en GROQ, sin @sanity/image-url.
 */
const ConfigSitioSchema = z.object({
  logoUrl: z.string().url().nullish(),
  logoAlt: z.string().nullish(),
  cantonImageUrl: z.string().url().nullish(),
  cantonImageAlt: z.string().nullish(),
  ogImageUrl: z.string().url().nullish(),
});

export type ConfigSitio = z.infer<typeof ConfigSitioSchema>;

const QUERY = `
  *[_type == "configSitio"][0] {
    "logoUrl": logoInstitucional.asset->url,
    "logoAlt": logoInstitucional.alt,
    "cantonImageUrl": imagenCanton.asset->url,
    "cantonImageAlt": imagenCanton.alt,
    "ogImageUrl": ogImageDefault.asset->url
  }
`;

export async function getConfigSitio(): Promise<ConfigSitio | null> {
  return fetchSanity(QUERY, ConfigSitioSchema.nullable());
}

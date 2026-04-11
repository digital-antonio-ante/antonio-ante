import { z } from 'zod';
import { fetchSanity } from '../../lib/fetcher';

/**
 * Singleton configSitio — solo lo que el frontend necesita en build time.
 * asset->url resuelve el CDN URL directamente en GROQ, sin @sanity/image-url.
 */
const ConfigSitioSchema = z.object({
  cantonImageUrl: z.string().url().nullish(),
  cantonImageAlt: z.string().nullish(),
});

export type ConfigSitio = z.infer<typeof ConfigSitioSchema>;

const QUERY = `
  *[_type == "configSitio"][0] {
    "cantonImageUrl": imagenCanton.asset->url,
    "cantonImageAlt": imagenCanton.alt
  }
`;

export async function getConfigSitio(): Promise<ConfigSitio | null> {
  return fetchSanity(QUERY, ConfigSitioSchema.nullable());
}

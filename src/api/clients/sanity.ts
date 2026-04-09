import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

if (!projectId) {
  throw new Error(
    '[antonio-ante] Missing env var: PUBLIC_SANITY_PROJECT_ID\n' +
      'Copy .env.example → .env.local and set your Sanity project ID.'
  );
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  useCdn: import.meta.env.PROD,
  token: import.meta.env.SANITY_API_TOKEN,
});

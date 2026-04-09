import { z } from 'zod';
import { sanityClient } from '../api/clients/sanity';

export class SchemaValidationError extends Error {
  readonly query: string;
  readonly fieldErrors: Record<string, string[]>;
  readonly formErrors: string[];

  constructor(query: string, error: z.ZodError) {
    const flat = error.flatten();
    const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>;
    const fieldSummary = Object.entries(fieldErrors)
      .map(([field, msgs]) => `  [${field}]: ${msgs?.join(', ') ?? ''}`)
      .join('\n');
    const formSummary = flat.formErrors.join(', ');

    super(
      `[antonio-ante] Schema validation failed\n` +
        `Query: ${query}\n` +
        (formSummary ? `Form errors: ${formSummary}\n` : '') +
        (fieldSummary ? `Field errors:\n${fieldSummary}` : '')
    );

    this.name = 'SchemaValidationError';
    this.query = query;
    this.fieldErrors = fieldErrors as Record<string, string[]>;
    this.formErrors = flat.formErrors;
  }
}

/**
 * Fetches data from Sanity and validates it against a Zod schema.
 * Fail-Fast: throws SchemaValidationError in both dev and prod.
 * In production this fails the build (SSG) or returns a 500 (SSR) — never silently corrupts data.
 */
export async function fetchSanity<TData>(
  query: string,
  schema: z.ZodType<TData>,
  params: Record<string, unknown> = {}
): Promise<TData> {
  const raw: unknown = await sanityClient.fetch(query, params);
  const result = schema.safeParse(raw);

  if (!result.success) {
    throw new SchemaValidationError(query, result.error);
  }

  return result.data;
}

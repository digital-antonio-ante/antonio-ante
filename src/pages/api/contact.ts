import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { env as cfEnv } from 'cloudflare:workers';
import { ContactFormSchema } from '../../lib/validations/contact';
import { sanitizeFormField } from '../../shared/utils/sanitize';
import { ORIGENES_PERMITIDOS } from '../../shared/config/site';

// Token de escritura de Sanity: en Cloudflare llega como secret en el runtime
// del Worker (cloudflare:workers → env); en dev/build se toma de import.meta.env.
function getSanityWriteToken(): string | undefined {
  const runtimeEnv = cfEnv as Record<string, string | undefined>;
  return runtimeEnv?.SANITY_API_TOKEN ?? import.meta.env.SANITY_API_TOKEN;
}

const ALLOWED_ORIGINS: readonly string[] = ORIGENES_PERMITIDOS;

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  return false;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonOk(message: string): Response {
  return new Response(JSON.stringify({ ok: true, message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // ── 1. CORS / Origin check ─────────────────────────────────────────────────
  const origin = request.headers.get('origin') ?? '';
  if (import.meta.env.PROD && !ALLOWED_ORIGINS.includes(origin)) {
    return jsonError('Origen no permitido.', 403);
  }

  // ── 2. Content-Type ────────────────────────────────────────────────────────
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return jsonError('Content-Type debe ser application/json.', 415);
  }

  // ── 3. Rate limiting ───────────────────────────────────────────────────────
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return jsonError('Demasiadas solicitudes. Intenta en un minuto.', 429);
  }

  // ── 4. Parse body ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido.', 400);
  }

  // ── 5. Validación Zod ──────────────────────────────────────────────────────
  const parsed = ContactFormSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return new Response(JSON.stringify({ ok: false, errors }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── 6. Honeypot ────────────────────────────────────────────────────────────
  if (parsed.data._honeypot) {
    // Responder 200 para no revelar la detección al bot
    return jsonOk('Mensaje recibido.');
  }

  // ── 7. Sanitización post-validación ───────────────────────────────────────
  const safe = {
    nombre: sanitizeFormField(parsed.data.nombre, 100),
    email: parsed.data.email.toLowerCase().trim(),
    telefono: parsed.data.telefono ? sanitizeFormField(parsed.data.telefono, 20) : undefined,
    asunto: sanitizeFormField(parsed.data.asunto, 150),
    mensaje: sanitizeFormField(parsed.data.mensaje, 2000),
  };

  // ── 8. Persistencia: se guarda como documento en Sanity ────────────────────
  // El mensaje llega al Studio (sección "Mensajes de contacto") donde el GAD
  // gestiona el resto del contenido. Requiere SANITY_API_TOKEN con permiso de
  // escritura (secret en Cloudflare).
  const token = getSanityWriteToken();
  if (!token) {
    // eslint-disable-next-line no-console
    console.error('[contact] Falta SANITY_API_TOKEN: no se pudo registrar el mensaje.');
    return jsonError(
      'No pudimos registrar tu mensaje en este momento. Por favor intenta más tarde o ' +
        'escríbenos a comunicacion@antonioante.gob.ec.',
      503
    );
  }

  try {
    const writeClient = createClient({
      projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: '2025-01-01',
      token,
      useCdn: false,
    });
    await writeClient.create({
      _type: 'mensajeContacto',
      nombre: safe.nombre,
      email: safe.email,
      telefono: safe.telefono,
      asunto: safe.asunto,
      mensaje: safe.mensaje,
      recibidoEn: new Date().toISOString(),
      leido: false,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contact] Error al guardar el mensaje en Sanity:', err);
    return jsonError(
      'No pudimos registrar tu mensaje en este momento. Por favor intenta más tarde o ' +
        'escríbenos a comunicacion@antonioante.gob.ec.',
      503
    );
  }

  return jsonOk('Tu mensaje fue enviado. Te responderemos pronto.');
};

// Rechazar explícitamente todos los demás métodos HTTP
export const GET: APIRoute = () => jsonError('Método no permitido.', 405);
export const PUT: APIRoute = () => jsonError('Método no permitido.', 405);
export const DELETE: APIRoute = () => jsonError('Método no permitido.', 405);
export const PATCH: APIRoute = () => jsonError('Método no permitido.', 405);

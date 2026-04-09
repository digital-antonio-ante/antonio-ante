import type { APIRoute } from 'astro';
import { ContactFormSchema } from '../../lib/validations/contact';
import { sanitizeFormField } from '../../shared/utils/sanitize';

const ALLOWED_ORIGINS = [import.meta.env.SITE ?? '', 'https://antonio-ante.gob.ec'].filter(Boolean);

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

  // ── 8. Envío (aquí conectar con el servicio de email o Sanity) ─────────────
  // TODO: integrar Resend / SendGrid / Sanity webhook en siguiente sprint
  if (!import.meta.env.PROD) {
    // eslint-disable-next-line no-console
    console.log('[contact] New submission from', ip, { ...safe, mensaje: '[REDACTED]' });
  }

  return jsonOk('Tu mensaje fue enviado. Te responderemos pronto.');
};

// Rechazar explícitamente todos los demás métodos HTTP
export const GET: APIRoute = () => jsonError('Método no permitido.', 405);
export const PUT: APIRoute = () => jsonError('Método no permitido.', 405);
export const DELETE: APIRoute = () => jsonError('Método no permitido.', 405);
export const PATCH: APIRoute = () => jsonError('Método no permitido.', 405);

import { z } from 'zod';

// Filtra caracteres de control ASCII (excluyendo tab \x09 y newline \x0A y CR \x0D)
// Se usa unicode property en lugar de rangos de control para satisfacer no-control-regex
const CONTROL_CHARS_RE = /\p{Cc}/u;
const safeString = (min: number, max: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine((val) => !CONTROL_CHARS_RE.test(val.replace(/[\t\n\r]/g, '')), {
      message: 'El campo contiene caracteres no permitidos.',
    });

export const ContactFormSchema = z.object({
  nombre: safeString(2, 100).regex(/^[\p{L}\p{M}\s'-]+$/u, {
    message: 'El nombre solo puede contener letras, espacios, guiones y apóstrofes.',
  }),
  email: z.email({ message: 'Ingresa un correo electrónico válido.' }),
  telefono: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, {
      message: 'Formato de teléfono inválido.',
    })
    .optional()
    .or(z.literal('')),
  asunto: safeString(5, 150),
  mensaje: safeString(10, 2000),
  // Honeypot — debe estar vacío; los bots tienden a llenarlo
  _honeypot: z.string().max(0, { message: 'Solicitud rechazada.' }).optional(),
});

export type ContactForm = z.infer<typeof ContactFormSchema>;

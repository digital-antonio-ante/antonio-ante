/**
 * fecha.ts — Fechas de eventos en hora de Ecuador.
 *
 * El Worker de Cloudflare corre en UTC: cualquier `getDate()` o
 * `toLocaleTimeString()` sin zona horaria pinta los eventos 5 horas tarde (y a
 * veces en el día siguiente). Todo formateo de fechas pasa por aquí.
 */

export const ZONA_ECUADOR = 'America/Guayaquil';

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-EC', { timeZone: ZONA_ECUADOR, ...opts });

const F_DIA = fmt({ day: '2-digit' });
const F_MES_CORTO = fmt({ month: 'short' });
const F_MES_LARGO = fmt({ month: 'long' });
const F_AÑO = fmt({ year: 'numeric' });
const F_HORA = fmt({ hour: '2-digit', minute: '2-digit' });
const F_DIA_SEMANA = fmt({ weekday: 'long' });
// en-CA formatea como AAAA-MM-DD: sirve de clave para comparar días locales.
const F_CLAVE = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_ECUADOR });

export interface PartesFecha {
  /** "05" */
  dia: string;
  /** "NOV" — siempre tres letras */
  mesCorto: string;
  /** "noviembre" */
  mesLargo: string;
  año: number;
  /** "07:00 a. m." */
  hora: string;
  /** "domingo" */
  diaSemana: string;
  /** "domingo, 15 de noviembre de 2026" */
  fechaLarga: string;
  /** "2026-11-15" — para saber si dos instantes caen el mismo día local */
  claveDia: string;
}

export function partesFecha(iso: string): PartesFecha {
  const d = new Date(iso);
  const dia = F_DIA.format(d);
  const mesLargo = F_MES_LARGO.format(d);
  const año = Number(F_AÑO.format(d));
  const diaSemana = F_DIA_SEMANA.format(d);
  return {
    dia,
    mesCorto: F_MES_CORTO.format(d).replace('.', '').slice(0, 3).toUpperCase(),
    mesLargo,
    año,
    hora: F_HORA.format(d),
    diaSemana,
    fechaLarga: `${diaSemana}, ${Number(dia)} de ${mesLargo} de ${año}`,
    claveDia: F_CLAVE.format(d),
  };
}

interface ConFechas {
  fechaInicio: string;
  fechaFin?: string | null;
}

/**
 * Instante en que el evento deja de estar vigente: su fecha de fin o, si no
 * tiene, el final de su día en Ecuador (una carrera a las 07:00 sigue "en
 * curso" esa mañana). Ecuador no tiene horario de verano: el desfase es fijo.
 */
export function finDelEvento(evento: ConFechas): Date {
  if (evento.fechaFin) return new Date(evento.fechaFin);
  return new Date(`${partesFecha(evento.fechaInicio).claveDia}T23:59:59.999-05:00`);
}

/** Inicio (00:00) del día en curso en Ecuador, en ISO — parámetro de las consultas GROQ. */
export function inicioDelDiaEcuador(ahora: Date = new Date()): string {
  return `${F_CLAVE.format(ahora)}T00:00:00.000-05:00`;
}

export function haTerminado(evento: ConFechas, ahora: Date = new Date()): boolean {
  return finDelEvento(evento) < ahora;
}

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { partesFecha, haTerminado } from '@shared/utils/fecha';

// Intl separa "a. m." con un espacio duro (U+00A0); para comparar basta el normal.
const plano = (s: string) => s.replace(/\u00a0/g, ' ');

/**
 * El sitio corre en un Worker de Cloudflare, cuyo reloj está en UTC. Formatear
 * con `toLocaleTimeString` / `getDate()` sin zona horaria pintaba cada evento
 * 5 horas tarde: la Carrera 10K de las 07:00 salía a las "12:00 p. m." y el
 * cierre de la Expo (martes 17, 22:00) como "miércoles 18, 03:00 a. m.".
 * Las fechas se fijan aquí en hora de Ecuador, sea cual sea la zona del proceso.
 */
describe('partesFecha — siempre en hora de Ecuador', () => {
  it('una mañana se muestra a la hora local, no en UTC', () => {
    const p = partesFecha('2026-11-15T07:00:00.000-05:00');
    expect(plano(p.hora)).toBe('07:00 a. m.');
    expect(p.dia).toBe('15');
    expect(p.mesCorto).toBe('NOV');
    expect(p.año).toBe(2026);
  });

  it('una noche no salta al día siguiente', () => {
    const p = partesFecha('2026-02-17T22:00:00.000-05:00');
    expect(p.dia).toBe('17');
    expect(p.diaSemana).toBe('martes');
    expect(plano(p.hora)).toBe('10:00 p. m.');
  });

  it('la fecha larga va en minúsculas, como se escribe en español', () => {
    expect(partesFecha('2026-11-15T07:00:00.000-05:00').fechaLarga).toBe(
      'domingo, 15 de noviembre de 2026'
    );
  });

  it('el mes corto siempre tiene tres letras (septiembre incluido)', () => {
    expect(partesFecha('2026-09-12T10:00:00.000-05:00').mesCorto).toBe('SEP');
  });

  it('claveDia agrupa por día local, para saber si un evento dura varios días', () => {
    expect(partesFecha('2026-02-14T09:00:00.000-05:00').claveDia).toBe('2026-02-14');
    expect(partesFecha('2026-02-17T22:00:00.000-05:00').claveDia).toBe('2026-02-17');
  });
});

describe('haTerminado', () => {
  const ahora = new Date('2026-09-13T12:00:00.000-05:00');

  it('un evento de varios días sigue vigente hasta su fecha de fin', () => {
    const feria = {
      fechaInicio: '2026-09-12T10:00:00.000-05:00',
      fechaFin: '2026-09-13T20:00:00.000-05:00',
    };
    expect(haTerminado(feria, ahora)).toBe(false);
  });

  it('sin fecha de fin, sigue vigente hasta el final de su día en Ecuador', () => {
    // La Carrera 10K (07:00, sin fechaFin) no puede pasar a "realizado" en el
    // instante en que empieza, con la gente corriendo.
    const carrera = { fechaInicio: '2026-11-15T07:00:00.000-05:00', fechaFin: null };
    expect(haTerminado(carrera, new Date('2026-11-15T07:30:00.000-05:00'))).toBe(false);
    expect(haTerminado(carrera, new Date('2026-11-15T23:30:00.000-05:00'))).toBe(false);
    expect(haTerminado(carrera, new Date('2026-11-16T00:00:01.000-05:00'))).toBe(true);
    expect(haTerminado({ fechaInicio: '2026-09-12T10:00:00.000-05:00' }, ahora)).toBe(true);
  });
});

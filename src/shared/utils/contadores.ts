/**
 * contadores.ts — Las cifras con `data-contar` suben de 0 a su valor cuando
 * entran en pantalla.
 *
 * El HTML ya trae el valor final (sin JS, o con "reducir movimiento", se ve
 * tal cual). Atributos: data-contar="2406", data-prefijo="+", data-sufijo=" m".
 */
const formato = new Intl.NumberFormat('es-EC');
const DURACION_MS = 1200;

function animar(el: HTMLElement): void {
  const hasta = Number(el.dataset.contar);
  const prefijo = el.dataset.prefijo ?? '';
  const sufijo = el.dataset.sufijo ?? '';
  const inicio = performance.now();
  const paso = (t: number) => {
    const avance = Math.min((t - inicio) / DURACION_MS, 1);
    const suave = 1 - (1 - avance) ** 3;
    el.textContent = `${prefijo}${formato.format(Math.round(hasta * suave))}${sufijo}`;
    if (avance < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

export function iniciarContadores(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        animar(e.target as HTMLElement);
      }
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll<HTMLElement>('[data-contar]').forEach((el) => io.observe(el));
}

/**
 * parish-strip.ts — Tira «Conoce cada parroquia» del inicio.
 *
 * - Entrada escalonada: las tarjetas arrancan ocultas (solo con JS) y aparecen
 *   cuando la tira entra en pantalla.
 * - Flechas y puntos: mucha gente no sabe que un carrusel se desliza; las
 *   flechas pasan de tarjeta en tarjeta y los puntos marcan cuáles se ven.
 *
 * Se importa desde canton-hero.ts para salir en el mismo bundle externo
 * (la CSP no admite scripts en línea).
 */

const strip = document.querySelector<HTMLElement>('.parish-strip-section');
const track = strip?.querySelector<HTMLElement>('.strip-track');

if (strip && track) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      strip.classList.add('is-visible');
      io.disconnect();
    },
    { threshold: 0.2 }
  );
  io.observe(strip);

  const cards = [...track.querySelectorAll<HTMLElement>('.pcard')];
  const prev = strip.querySelector<HTMLButtonElement>('[data-strip-nav="-1"]');
  const next = strip.querySelector<HTMLButtonElement>('[data-strip-nav="1"]');
  const dots = [...strip.querySelectorAll<HTMLButtonElement>('[data-strip-dot]')];
  const suave = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

  const visibles = () => {
    const vista = track.getBoundingClientRect();
    return cards.map((card) => {
      const r = card.getBoundingClientRect();
      const dentro = Math.min(r.right, vista.right) - Math.max(r.left, vista.left);
      return dentro / r.width > 0.6;
    });
  };

  const irA = (i: number) => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
    // Respeta scroll-padding-inline del track (el margen lateral del hero).
    const padding = Number.parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
    // El rect viene escalado por la animación de los bordes: se parte del centro.
    const r = card.getBoundingClientRect();
    const left =
      r.left + r.width / 2 - card.offsetWidth / 2 - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollTo({ left: left - padding, behavior: suave });
  };

  const actualizar = () => {
    const vis = visibles();
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(vis[i])));
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };

  const paso = (dir: number) => {
    const vis = visibles();
    const primera = Math.max(0, vis.indexOf(true));
    irA(primera + dir);
  };
  prev?.addEventListener('click', () => paso(-1));
  next?.addEventListener('click', () => paso(1));
  dots.forEach((dot) => dot.addEventListener('click', () => irA(Number(dot.dataset.stripDot))));

  let pendiente = false;
  track.addEventListener(
    'scroll',
    () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        actualizar();
      });
    },
    { passive: true }
  );
  window.addEventListener('resize', actualizar);
  actualizar();
}

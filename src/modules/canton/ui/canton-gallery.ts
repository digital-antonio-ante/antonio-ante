/**
 * canton-gallery.ts — Lightbox gallery logic.
 *
 * Imported by canton-hero.ts so Astro bundles both into an external .js file
 * served from 'self', satisfying the CSP (no 'unsafe-inline' needed).
 *
 * Exports openGallery / closeGallery so canton-hero.ts can call them directly
 * instead of going through window globals.
 */

let galleryImgs: string[] = [];
let cur = 0;
let accentColor = '#DC2626';
let touchStartX = 0;

const overlay = document.getElementById('gallery-overlay');
const imgEl = document.getElementById('g-img') as HTMLImageElement | null;
const spinner = document.getElementById('g-spinner');
const thumbsEl = document.getElementById('g-thumbs');
const counterEl = document.getElementById('g-counter');
const nameEl = document.getElementById('g-name');
const dotEl = document.getElementById('g-dot') as HTMLElement | null;
const prevBtn = document.getElementById('g-prev') as HTMLButtonElement | null;
const nextBtn = document.getElementById('g-next') as HTMLButtonElement | null;

function show(index: number): void {
  if (!overlay || !imgEl || !spinner || !thumbsEl || !counterEl || !nameEl) return;
  if (index < 0 || index >= galleryImgs.length) return;
  cur = index;

  imgEl.classList.add('fading');
  spinner.classList.add('visible');

  const tmp = new Image();
  tmp.onload = () => {
    imgEl.src = galleryImgs[cur];
    imgEl.alt = `${nameEl.textContent ?? ''} · foto ${cur + 1}`;
    imgEl.classList.remove('fading');
    spinner.classList.remove('visible');
  };
  tmp.onerror = () => {
    spinner.classList.remove('visible');
  };
  tmp.src = galleryImgs[cur];

  counterEl.textContent = `${cur + 1} / ${galleryImgs.length}`;
  if (prevBtn) prevBtn.disabled = cur === 0;
  if (nextBtn) nextBtn.disabled = cur === galleryImgs.length - 1;

  document.querySelectorAll<HTMLElement>('.g-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === cur);
    t.style.borderColor = i === cur ? accentColor : 'transparent';
  });
}

function buildThumbs(): void {
  if (!thumbsEl) return;
  thumbsEl.innerHTML = '';
  if (galleryImgs.length <= 1) return;
  galleryImgs.forEach((src, i) => {
    const btn = document.createElement('button');
    btn.className = 'g-thumb' + (i === 0 ? ' active' : '');
    btn.style.borderColor = i === 0 ? accentColor : 'transparent';
    btn.setAttribute('aria-label', `Ver foto ${i + 1}`);
    // src comes from Sanity CDN — controlled, not user input
    btn.innerHTML = `<img src="${src}" alt="Miniatura ${i + 1}" loading="lazy">`;
    btn.addEventListener('click', () => show(i));
    thumbsEl.appendChild(btn);
  });
}

export function closeGallery(): void {
  overlay?.classList.remove('open');
  overlay?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

export function openGallery(name: string, images: string[], color: string): void {
  if (!images.length || !overlay) return;
  galleryImgs = images;
  cur = 0;
  accentColor = color;
  if (nameEl) nameEl.textContent = name;
  if (dotEl) dotEl.style.background = color;
  buildThumbs();
  show(0);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('g-close')?.focus();
}

// ── DOM event listener setup (runs once on module load) ──────────────────────
if (overlay && imgEl && spinner && thumbsEl && counterEl && nameEl) {
  document.getElementById('g-close')?.addEventListener('click', closeGallery);
  document.getElementById('g-backdrop')?.addEventListener('click', closeGallery);

  prevBtn?.addEventListener('click', () => show(cur - 1));
  nextBtn?.addEventListener('click', () => show(cur + 1));

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });

  overlay.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  overlay.addEventListener(
    'touchend',
    (e) => {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 45) show(delta > 0 ? cur + 1 : cur - 1);
    },
    { passive: true }
  );
}

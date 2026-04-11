/**
 * canton-hero.ts — Parish selection and info-panel interaction for the homepage.
 *
 * The import of PARISHES (a real runtime value) causes Astro/Vite to bundle
 * this file — and canton-gallery.ts — into an external _astro/*.js file served
 * from 'self', satisfying CSP without 'unsafe-inline'.
 *
 * Data flow:
 *   Server-side: CantonHero.astro builds `parishes` with Sanity CDN image URLs
 *                and serialises it to a <script id="parish-data" type="application/json">.
 *   Client-side: This module reads that JSON; falls back to the static PARISHES
 *                import if the element is missing or unparseable.
 */

import { PARISHES } from '../data/parishes';
import type { ParishData } from '../data/parishes';
import { openGallery } from './canton-gallery';

// ── Parish data (server-injected JSON wins, static PARISHES as fallback) ─────
const dataEl = document.getElementById('parish-data');
let parishes: Record<string, ParishData> = { ...PARISHES };
if (dataEl?.textContent) {
  try {
    parishes = JSON.parse(dataEl.textContent) as Record<string, ParishData>;
  } catch {
    // fallback to static PARISHES already assigned above
  }
}

// ── DOM references ────────────────────────────────────────────────────────────
const panelEmpty = document.getElementById('panel-empty');
const panelContent = document.getElementById('panel-content');
const panelColorBar = document.getElementById('panel-color-bar');
const panelImageContainer = document.getElementById('panel-image-container');
const elImage = document.getElementById('panel-image') as HTMLImageElement | null;
const elTitle = document.getElementById('panel-title');
const elType = document.getElementById('panel-type') as HTMLElement | null;
const elDesc = document.getElementById('panel-desc');
const elPop = document.getElementById('panel-population');
const elAlt = document.getElementById('panel-altitude');
const elActivities = document.getElementById('panel-activities');
const elProjects = document.getElementById('panel-projects');
const elParishLink = document.getElementById('panel-parish-link') as HTMLAnchorElement | null;
const elGalleryBtn = document.getElementById('panel-gallery-btn') as HTMLButtonElement | null;

// ── Main selection function ───────────────────────────────────────────────────
function selectParish(id: string): void {
  const data = parishes[id];
  if (!data) return;

  // Mark active on map polygons and parish cards
  document.querySelectorAll<HTMLElement>('[data-select-parish]').forEach((el) => {
    el.classList.toggle('active', el.dataset.selectParish === id);
  });

  // Show parish panel
  panelEmpty?.classList.add('hidden');
  panelContent?.classList.remove('hidden');

  // Re-trigger fade-up animation on the panel container
  if (panelContent) {
    const panel = panelContent.closest('.glass-panel') as HTMLElement | null;
    if (panel) {
      panel.classList.remove('animate-fade-up');
      void panel.offsetWidth; // force reflow
      panel.classList.add('animate-fade-up');
    }
  }

  // Accent color
  if (panelColorBar) panelColorBar.style.background = data.color;
  if (panelImageContainer) panelImageContainer.style.setProperty('--pc', data.color);

  // Cover image
  if (elImage) {
    if (data.imageSrc) {
      elImage.src = data.imageSrc;
      elImage.alt = `Parroquia ${data.name}`;
      elImage.style.display = '';
      elImage.onerror = () => {
        elImage.style.display = 'none';
      };
    } else {
      elImage.style.display = 'none';
    }
  }

  // Text content
  if (elTitle) elTitle.textContent = data.name;
  if (elType) {
    elType.textContent = data.type;
    elType.style.background = data.color;
  }
  if (elDesc) elDesc.textContent = data.description;
  if (elPop) elPop.textContent = data.population ?? 'N/D';
  if (elAlt) elAlt.textContent = data.altitude ?? 'N/D';

  // Activity chips
  if (elActivities) {
    elActivities.innerHTML = '';
    data.activities.forEach((act) => {
      const chip = document.createElement('span');
      chip.className = 'activity-chip';
      chip.textContent = act;
      elActivities.appendChild(chip);
    });
  }

  // Project list
  if (elProjects) {
    elProjects.innerHTML = '';
    data.projects.forEach((proj) => {
      const li = document.createElement('li');
      li.textContent = proj;
      elProjects.appendChild(li);
    });
  }

  // Deep-link to parish page
  if (elParishLink) {
    elParishLink.href = `/parroquias/${id.replace('_', '-')}`;
  }

  // Gallery button — shown only if the parish has photos
  if (elGalleryBtn) {
    const hasGallery = data.gallery && data.gallery.length > 0;
    elGalleryBtn.style.display = hasGallery ? '' : 'none';
    elGalleryBtn.onclick = () => openGallery(data.name, data.gallery, data.color);
  }

  // Smooth-scroll to panel on mobile
  if (window.innerWidth < 769) {
    panelContent?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ── Event delegation — single listener covers SVG map + parish card strip ────
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-select-parish]');
  if (!btn) return;
  const id = btn.dataset.selectParish;
  if (id) selectParish(id);
});

// Keyboard support for SVG map zones (Enter / Space)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const btn = (e.target as Element).closest<HTMLElement>('[data-select-parish]');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.selectParish;
  if (id) selectParish(id);
});

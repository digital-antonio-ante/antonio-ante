/**
 * canton-map-widget.ts — Parish selection for the /parroquias interactive map.
 *
 * Used by CantonMapWidget.astro. Importing canton-gallery here (same import as
 * canton-hero.ts) means Vite shares the gallery chunk between both entry points
 * and emits this file as an external bundle — satisfying CSP 'script-src self'.
 *
 * Uses static PARISHES data (no Sanity URL merging — parroquias page uses the
 * parish detail pages for individual photos, not the widget cover image).
 */

import { PARISHES } from '../data/parishes';
import type { ParishData } from '../data/parishes';
import { openGallery } from './canton-gallery';

// ── Parish data ──────────────────────────────────────────────────────────────
// Prefer server-injected JSON (may include Sanity image URLs in future), fall
// back to the static import so the widget works even without the data element.
const dataEl = document.getElementById('parish-data');
let parishes: Record<string, ParishData> = { ...PARISHES };
if (dataEl?.textContent) {
  try {
    parishes = JSON.parse(dataEl.textContent) as Record<string, ParishData>;
  } catch {
    // fallback already set above
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

  document.querySelectorAll<HTMLElement>('[data-select-parish]').forEach((el) => {
    el.classList.toggle('active', el.dataset.selectParish === id);
  });

  panelEmpty?.classList.add('hidden');
  panelContent?.classList.remove('hidden');

  if (panelColorBar) panelColorBar.style.background = data.color;
  if (panelImageContainer) panelImageContainer.style.setProperty('--pc', data.color);

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

  if (elTitle) elTitle.textContent = data.name;
  if (elType) {
    elType.textContent = data.type;
    elType.style.background = data.color;
  }
  if (elDesc) elDesc.textContent = data.description;
  if (elPop) elPop.textContent = data.population ?? 'N/D';
  if (elAlt) elAlt.textContent = data.altitude ?? 'N/D';

  if (elActivities) {
    elActivities.innerHTML = '';
    data.activities.forEach((act) => {
      const chip = document.createElement('span');
      chip.className = 'activity-chip';
      chip.textContent = act;
      elActivities.appendChild(chip);
    });
  }

  if (elProjects) {
    elProjects.innerHTML = '';
    data.projects.forEach((proj) => {
      const li = document.createElement('li');
      li.textContent = proj;
      elProjects.appendChild(li);
    });
  }

  if (elParishLink) {
    elParishLink.href = `/parroquias/${id.replace('_', '-')}`;
  }

  if (elGalleryBtn) {
    const hasGallery = data.gallery && data.gallery.length > 0;
    elGalleryBtn.style.display = hasGallery ? '' : 'none';
    elGalleryBtn.onclick = () => openGallery(data.name, data.gallery, data.color);
  }

  if (window.innerWidth < 769) {
    panelContent?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ── Event delegation ──────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-select-parish]');
  if (!btn) return;
  const id = btn.dataset.selectParish;
  if (id) selectParish(id);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const btn = (e.target as Element).closest<HTMLElement>('[data-select-parish]');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.selectParish;
  if (id) selectParish(id);
});

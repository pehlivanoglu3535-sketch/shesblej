/**
 * Kategori görselleri ve fotoğrafsız ilanlar için yer tutucular.
 *
 * Dışarıdan görsel çekmiyoruz: hepsi satır içi SVG data URI, yani sıfır ağ
 * isteği ve sıfır depolama maliyeti. Tasarım bilinçli olarak sitenin koyu
 * siyah + altın kimliğine bağlı — önceki çizgi film tarzı renkli sahneler
 * marka ile çelişiyordu.
 */
import type { CategoryId } from './constants';

function svgToDataUri(svg: string): string {
  return 'data:image/svg+xml,' + encodeURIComponent(svg.replace(/\s+/g, ' ').trim());
}

const GOLD = '#fdd202';

/** Ortak zemin: koyu degrade + üst-orta bölgede yumuşak altın parıltı. */
function frame(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#231f16"/>
        <stop offset="0.55" stop-color="#141209"/>
        <stop offset="1" stop-color="#0a0a08"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.34" r="0.62">
        <stop offset="0" stop-color="${GOLD}" stop-opacity="0.18"/>
        <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)"/>
    <rect width="400" height="300" fill="url(#glow)"/>
    <g fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${inner}
    </g>
    <line x1="96" y1="232" x2="304" y2="232" stroke="${GOLD}" stroke-opacity="0.22" stroke-width="2"/>
  </svg>`;
}

function emlakScene(): string {
  return frame(`
    <path d="M150 210 V128 l34 -22 34 22 V210"/>
    <path d="M218 210 V150 h42 v60"/>
    <rect x="167" y="146" width="16" height="16" rx="2" stroke-opacity="0.75"/>
    <rect x="193" y="146" width="16" height="16" rx="2" stroke-opacity="0.75"/>
    <rect x="167" y="174" width="16" height="16" rx="2" stroke-opacity="0.45"/>
    <rect x="231" y="166" width="14" height="14" rx="2" stroke-opacity="0.6"/>
    <path d="M190 210 v-22 h12 v22" stroke-opacity="0.85"/>
  `);
}

function vasitaScene(): string {
  return frame(`
    <path d="M118 188 v-18 q0 -8 9 -11 l24 -8 18 -22 q4 -5 11 -5 h48 q7 0 11 5 l18 22 24 8 q9 3 9 11 v18"/>
    <path d="M160 149 h80" stroke-opacity="0.55"/>
    <circle cx="154" cy="190" r="17"/>
    <circle cx="246" cy="190" r="17"/>
    <path d="M171 190 h58" stroke-opacity="0.35"/>
    <path d="M124 164 h14 M262 164 h14" stroke-opacity="0.6"/>
  `);
}

function esyaScene(): string {
  return frame(`
    <path d="M140 156 l60 -28 60 28 v56 l-60 28 -60 -28 z"/>
    <path d="M140 156 l60 28 60 -28" stroke-opacity="0.8"/>
    <path d="M200 184 v56" stroke-opacity="0.8"/>
    <path d="M170 142 l60 28" stroke-opacity="0.4"/>
  `);
}

const CATEGORY_PHOTO_CACHE: Record<string, string> = {};
export function categoryPhotoUri(catId: CategoryId): string {
  if (CATEGORY_PHOTO_CACHE[catId]) return CATEGORY_PHOTO_CACHE[catId];
  const svg = catId === 'emlak' ? emlakScene() : catId === 'vasita' ? vasitaScene() : esyaScene();
  return (CATEGORY_PHOTO_CACHE[catId] = svgToDataUri(svg));
}

/**
 * Fotoğrafsız ilanlar arasında hafif bir renk farkı bırakır.
 *
 * Eskiden 0-359° arasıydı; altın tonlu tek renk tasarımda bu, kartları rastgele
 * mor/yeşil yapıp marka bütünlüğünü bozuyor. Dar bir aralık, kartların birbirinin
 * kopyası görünmesini engellerken altın tonunda kalmalarını sağlıyor.
 */
export function listingHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 25) - 12;
}

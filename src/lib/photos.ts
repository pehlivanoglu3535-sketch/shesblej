/** Self-contained SVG placeholder 'photos' per category — no external image requests, ported from the prototype. */
import type { CategoryId } from './constants';

function svgToDataUri(svg: string): string { return 'data:image/svg+xml,' + encodeURIComponent(svg); }

function buildEmlakScene(){
  let windows = '';
  for(let r=0;r<4;r++) for(let c=0;c<3;c++){
    const x=66+c*28, y=118+r*38, lit=(r+c)%3===0;
    windows += `<rect x="${x}" y="${y}" width="16" height="20" rx="1" fill="${lit?'#ffd76a':'#7fa8c9'}"/>`;
  }
  for(let r=0;r<5;r++) for(let c=0;c<4;c++){
    const x=196+c*32, y=80+r*32, lit=(r*c)%4===0;
    windows += `<rect x="${x}" y="${y}" width="18" height="20" rx="1" fill="${lit?'#ffd76a':'#8bb4d6'}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs><linearGradient id="skyE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ed0f2"/><stop offset="1" stop-color="#eef8ff"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#skyE)"/>
    <circle cx="345" cy="50" r="26" fill="#ffe27a"/>
    <rect x="0" y="240" width="400" height="60" fill="#cddccf"/>
    <rect x="50" y="110" width="120" height="150" fill="#f2ebe0"/>
    <rect x="190" y="70" width="160" height="190" fill="#e5d9c4"/>
    ${windows}
    <circle cx="30" cy="255" r="16" fill="#7fae7a"/>
    <circle cx="378" cy="258" r="12" fill="#7fae7a"/>
  </svg>`;
}

function buildVasitaScene(){
  let dashes = '';
  for(let i=0;i<6;i++) dashes += `<rect x="${20+i*70}" y="253" width="34" height="6" rx="3" fill="#fff"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs><linearGradient id="skyV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#fff3e0"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#skyV)"/>
    <polygon points="0,220 90,140 180,220" fill="#e3b98f" opacity="0.6"/>
    <polygon points="140,220 250,120 360,220" fill="#d7ad82" opacity="0.6"/>
    <rect x="0" y="220" width="400" height="80" fill="#556472"/>
    ${dashes}
    <rect x="90" y="160" width="200" height="50" rx="14" fill="#3f6fb0"/>
    <path d="M115,160 Q140,120 190,120 L230,120 Q265,120 280,160 Z" fill="#3f6fb0"/>
    <rect x="150" y="130" width="35" height="26" rx="4" fill="#cfe8ff"/>
    <rect x="190" y="130" width="45" height="26" rx="4" fill="#cfe8ff"/>
    <circle cx="130" cy="212" r="22" fill="#22303e"/>
    <circle cx="130" cy="212" r="9" fill="#c9d2d8"/>
    <circle cx="255" cy="212" r="22" fill="#22303e"/>
    <circle cx="255" cy="212" r="9" fill="#c9d2d8"/>
  </svg>`;
}

function buildEsyaScene(){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9e6"/><stop offset="1" stop-color="#fff5f8"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#skyG)"/>
    <rect x="0" y="235" width="400" height="65" fill="#e7c9b7"/>
    <rect x="150" y="150" width="100" height="90" rx="6" fill="#e08a7d"/>
    <rect x="150" y="150" width="100" height="18" fill="#c96b5e"/>
    <rect x="192" y="150" width="16" height="90" fill="#c96b5e"/>
    <polygon points="150,150 200,120 250,150" fill="#f4a99a"/>
    <circle cx="80" cy="190" r="34" fill="#f6c667"/>
    <rect x="66" y="220" width="28" height="40" rx="4" fill="#e0a94c"/>
    <rect x="280" y="170" width="60" height="70" rx="8" fill="#7fb3c9"/>
    <circle cx="310" cy="195" r="14" fill="#e9f5fa"/>
  </svg>`;
}


const CATEGORY_PHOTO_CACHE: Record<string, string> = {};
export function categoryPhotoUri(catId: CategoryId): string {
  if (CATEGORY_PHOTO_CACHE[catId]) return CATEGORY_PHOTO_CACHE[catId];
  const svg = catId === 'emlak' ? buildEmlakScene() : catId === 'vasita' ? buildVasitaScene() : buildEsyaScene();
  return (CATEGORY_PHOTO_CACHE[catId] = svgToDataUri(svg));
}

/** Deterministic hue-rotate per listing (works off a UUID string) so cards in the same
 *  category don't all look visually identical while still using the shared base scene. */
export function listingHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

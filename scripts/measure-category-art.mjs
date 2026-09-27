/**
 * Kategori görsellerinin gerçek "mürekkep" sınırlarını ölçer.
 *
 * Yol verisine bakarak ölçmek yanıltıcı: `v`, `h`, `l`, `q` göreli komutlar ve
 * sayıları x/y çiftleri sanan kaba bir okuma saçma kutular veriyor. Tek doğru
 * yol SVG'yi çizip opak piksellere bakmak.
 *
 * Amaç: üç görselin aynı kutuya oturup oturmadığını doğrulamak. Kartlar yan
 * yana duruyor, farklı boyuttaki çizimler gözü rahatsız ediyor.
 *
 * photos.ts'teki place() ile aynı hesabı tekrarlıyor, çünkü betik TypeScript
 * modülünü doğrudan çağıramıyor. İkisi ayrışırsa ölçüm yanlış olur — sayılar
 * burada da orada da aynı yerden (MAX_W/MAX_H/CENTER_X/BASE_Y) geliyor.
 */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const MAX_W = 160;
const MAX_H = 106;
const CENTER_X = 200;
const BASE_Y = 212;
const STROKE = 2.6;
const GOLD = '#fdd202';

const src = await readFile('src/lib/photos.ts', 'utf8');

function scene(name) {
  const re = new RegExp(
    'function ' + name + '\\(\\): string \\{\\s*return frame\\(place\\(`([\\s\\S]*?)`,\\s*(\\{[^}]*\\})\\)\\);',
  );
  const m = src.match(re);
  if (!m) throw new Error(name + ' bulunamadi');
  const box = JSON.parse(m[2].replace(/(\w+):/g, '"$1":'));
  return { inner: m[1], box };
}

function placed(inner, box) {
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const s = Math.min(MAX_W / w, MAX_H / h);
  const tx = CENTER_X - s * ((box.minX + box.maxX) / 2);
  const ty = BASE_Y - s * box.maxY;
  return `<g transform="translate(${tx} ${ty}) scale(${s})" stroke-width="${STROKE / s}">${inner}</g>`;
}

/** Zemin ve parıltı olmadan, sadece çizgiler — ölçüm için. */
function bare(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#000"/>
    <g fill="none" stroke="${GOLD}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
      ${inner}
    </g>
  </svg>`;
}

const rows = [];
for (const name of ['emlakScene', 'vasitaScene', 'esyaScene']) {
  const { inner, box } = scene(name);
  const svg = bare(placed(inner, box));
  const { data, info } = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels } = info;

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Altın çizgi siyah zeminde; kırmızı kanalı yüksek olan piksel = çizgi.
      if (data[(y * W + x) * channels] > 60) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  rows.push({
    ad: name.replace('Scene', ''),
    gen: maxX - minX + 1,
    yuk: maxY - minY + 1,
    merkezX: Math.round((minX + maxX) / 2),
    alt: maxY,
  });
}

console.table(rows);

const xs = new Set(rows.map((r) => r.merkezX));
const alts = new Set(rows.map((r) => r.alt));
console.log('yatay merkezler hizali mi :', xs.size === 1 ? 'EVET' : 'HAYIR -> ' + [...xs]);
console.log('alt kenarlar hizali mi    :', alts.size === 1 ? 'EVET' : 'HAYIR -> ' + [...alts]);
console.log('zemin cizgisini asan var mi:', rows.some((r) => r.alt > 232) ? 'EVET' : 'HAYIR');
console.log('en genis / en dar oran    :',
  (Math.max(...rows.map((r) => r.gen)) / Math.min(...rows.map((r) => r.gen))).toFixed(2));

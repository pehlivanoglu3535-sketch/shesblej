// Bir ilanin tum karelerini tek bir kontak sayfasinda birlestirir.
// Tek gorsele bakip filigranli (Encar markali) kareleri isaretleyebilmek icin.
import sharp from 'sharp';
import fs from 'node:fs';

const prefix = process.argv[2];
const id = process.argv[3];
const outPath = process.argv[4];

const HQ = '?impolicy=widthRate&rw=1200';
const TW = 300, TH = 169, COLS = 5, PAD = 6, LABEL = 18;

const tiles = [];
for (let i = 1; i <= 40; i++) {
  const n = String(i).padStart(3, '0');
  const url = `https://ci.encar.com/carpicture/${prefix}/${id}_${n}.jpg${HQ}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) continue;
  const buf = Buffer.from(await res.arrayBuffer());
  const img = await sharp(buf).resize(TW, TH, { fit: 'cover' }).toBuffer();
  const label = Buffer.from(
    `<svg width="${TW}" height="${LABEL}"><rect width="${TW}" height="${LABEL}" fill="#000"/>` +
    `<text x="6" y="14" font-family="monospace" font-size="14" fill="#fdd202">${n}</text></svg>`
  );
  const tile = await sharp({
    create: { width: TW, height: TH + LABEL, channels: 3, background: '#000' },
  })
    .composite([{ input: label, top: 0, left: 0 }, { input: img, top: LABEL, left: 0 }])
    .png()
    .toBuffer();
  tiles.push(tile);
}

const rows = Math.ceil(tiles.length / COLS);
const W = COLS * TW + (COLS + 1) * PAD;
const H = rows * (TH + LABEL) + (rows + 1) * PAD;

const composites = tiles.map((input, i) => ({
  input,
  left: PAD + (i % COLS) * (TW + PAD),
  top: PAD + Math.floor(i / COLS) * (TH + LABEL + PAD),
}));

await sharp({ create: { width: W, height: H, channels: 3, background: '#111' } })
  .composite(composites)
  .jpeg({ quality: 78 })
  .toFile(outPath);

console.log(`${tiles.length} kare -> ${outPath}  (${W}x${H}, ${Math.round(fs.statSync(outPath).size / 1024)} KB)`);

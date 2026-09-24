// 14 ilanin kapak karesini tek bir sayfada toplar -- secimin her ilanda
// gercekten tanitici bir gorunum verdigini tek bakista dogrulamak icin.
import sharp from 'sharp';

const HQ = '?impolicy=widthRate&rw=1200';
const CARS = [
  ['carpicture02/pic4242', '42424422', 'BMW 5-Series'],
  ['carpicture07/pic4247', '42475521', 'BMW 3-Series'],
  ['carpicture04/pic4214', '42143073', 'BMW X5'],
  ['carpicture03/pic4233', '42337568', 'BMW X6'],
  ['carpicture10/pic4260', '42604126', 'BMW i5'],
  ['carpicture09/pic4239', '42393284', 'MB S-Class'],
  ['carpicture01/pic4271', '42715413', 'MB GLC'],
  ['carpicture03/pic4273', '42735966', 'Hyundai Santa Fe'],
  ['carpicture03/pic4273', '42734234', 'Hyundai Palisade'],
  ['carpicture05/pic4275', '42758902', 'Hyundai Grandeur'],
  ['carpicture05/pic4265', '42659275', 'Kia Seltos'],
  ['carpicture03/pic4243', '42430028', 'Kia Sportage'],
  ['carpicture09/pic4259', '42594238', 'Kia Tasman'],
  ['carpicture08/pic4268', '42688509', 'Kia Ray'],
];

const TW = 300, TH = 169, COLS = 4, PAD = 6, LABEL = 20;
const tiles = [];

for (const [prefix, id, name] of CARS) {
  const url = `https://ci.encar.com/carpicture/${prefix}/${id}_010.jpg${HQ}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.log(`${name}: _010 YOK (${res.status})`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  const img = await sharp(buf).resize(TW, TH, { fit: 'cover' }).toBuffer();
  const label = Buffer.from(
    `<svg width="${TW}" height="${LABEL}"><rect width="${TW}" height="${LABEL}" fill="#000"/>` +
    `<text x="6" y="15" font-family="sans-serif" font-size="13" fill="#fdd202">${name}</text></svg>`
  );
  tiles.push(await sharp({ create: { width: TW, height: TH + LABEL, channels: 3, background: '#000' } })
    .composite([{ input: label, top: 0, left: 0 }, { input: img, top: LABEL, left: 0 }])
    .png().toBuffer());
}

const rows = Math.ceil(tiles.length / COLS);
await sharp({
  create: {
    width: COLS * TW + (COLS + 1) * PAD,
    height: rows * (TH + LABEL) + (rows + 1) * PAD,
    channels: 3, background: '#111',
  },
})
  .composite(tiles.map((input, i) => ({
    input,
    left: PAD + (i % COLS) * (TW + PAD),
    top: PAD + Math.floor(i / COLS) * (TH + LABEL + PAD),
  })))
  .jpeg({ quality: 80 })
  .toFile(process.argv[2]);

console.log(`${tiles.length} kapak -> ${process.argv[2]}`);

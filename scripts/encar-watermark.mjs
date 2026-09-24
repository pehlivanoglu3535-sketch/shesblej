// Sag ust kosedeki "Trust Encar" filigranini tespit eder.
//
// Filigran, koyu studyo fonu uzerine acik gri yazidir: o bolgedeki parlaklik
// standart sapmasi, duz fon veya duz karoser yuzeyine gore belirgin yuksektir.
// Burada her kare icin bu bolgenin istatistigini yazdirip esigi gozle belirliyoruz.
import sharp from 'sharp';

const prefix = process.argv[2];
const id = process.argv[3];
const HQ = '?impolicy=widthRate&rw=1200';

async function stats(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const img = sharp(buf);
  const m = await img.metadata();
  // sag ust bolge: genisligin %58-%92'si, yuksekligin %3-%22'si
  const left = Math.round(m.width * 0.58);
  const top = Math.round(m.height * 0.03);
  const w = Math.round(m.width * 0.34);
  const h = Math.round(m.height * 0.19);
  const s = await sharp(buf).extract({ left, top, width: w, height: h }).greyscale().stats();
  const ch = s.channels[0];
  return { mean: ch.mean, sd: ch.stdev };
}

for (let i = 1; i <= 40; i++) {
  const n = String(i).padStart(3, '0');
  const url = `https://ci.encar.com/carpicture/${prefix}/${id}_${n}.jpg${HQ}`;
  try {
    const r = await stats(url);
    if (!r) continue;
    console.log(`${n}  ortalama ${r.mean.toFixed(1).padStart(6)}   sapma ${r.sd.toFixed(1).padStart(6)}`);
  } catch {
    // yok say
  }
}

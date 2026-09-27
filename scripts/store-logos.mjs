/**
 * Partner mağaza logolarını tek bir tuvalde normalleştirir.
 *
 * NEDEN NORMALLEŞTİRME GEREKİYOR
 * Kaynak logoların hiçbiri aynı ölçüde değil: Alberti 708x211 PNG, RE/MAX
 * 176x48 SVG, Encar ise hiç dosya değil (siteye canlı metin olarak basılıyor,
 * bkz. store-logo-src/encar.svg). Bunları olduğu gibi bir kutuya koymak
 * yetmiyor, çünkü her birinin çevresinde farklı miktarda boşluk var —
 * `object-contain` bu boşluğu da içerik sayıp logoları farklı büyüklükte
 * gösteriyor. Bu yüzden her logo önce kendi saydam kenarlarından kırpılıyor
 * (gerçek mürekkep sınırı), sonra ortak bir içerik kutusuna sığdırılıp
 * hepsi için aynı olan tuvalin tam ortasına konuyor.
 *
 * Sonuç: üç dosya da aynı piksel ölçüsünde çıkıyor ve içerikleri optik olarak
 * aynı ağırlıkta. Sitede sabit ölçüde göstermek yeterli, ek hizalama gerekmez.
 *
 * KOYU ZEMİN
 * Üç logo da açık renkli (Alberti beyaz çizim, RE/MAX beyaz kelime markası +
 * renkli balon, Encar kırmızı + beyaz). Hepsi koyu zemin için tasarlanmış ve
 * sitemizin teması da koyu, o yüzden zemin PNG'ye gömülmüyor — dosyalar
 * saydam kalıyor, zemini kart veriyor.
 *
 * NEDEN SUPABASE DEĞİL
 * Logolar `public/stores/` altında duruyor. Supabase Storage'a koymak
 * `next.config.ts` remotePatterns'a bağımlılık ekler; bu projede yapılandırması
 * eksik bir görsel sunucusu `next/image` ile 500 veriyor. Statik dosya
 * uygulamayla birlikte dağıtıldığı için bu risk hiç doğmuyor.
 *
 * Kullanım: node scripts/store-logos.mjs
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.join(import.meta.dirname, 'store-logo-src');
const OUT_DIR = path.join(import.meta.dirname, '..', 'public', 'stores');

// Tuval 600x160 (3.75:1). Üç kelime markasının da en-boy oranı 3.3-3.9
// aralığında, bu yüzden bu oran boşluğu en az bırakan ortak çerçeve.
const W = 600;
const H = 160;
const PAD_X = 20;
const PAD_Y = 16;

/** Saydamlığa göre gerçek içerik sınırını bulur. */
function inkBox(data, info) {
  const ch = info.channels;
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      // Eşik 16: yumuşatma (anti-alias) kenarlarını içeride tutar ama
      // neredeyse tamamen saydam pikselleri sınıra katmaz.
      if (data[(y * info.width + x) * ch + 3] < 16) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('logo tamamen saydam');
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => /\.(png|svg)$/i.test(f)).sort();
if (!files.length) throw new Error(`kaynak yok: ${SRC_DIR}`);

for (const file of files) {
  const slug = file.replace(/\.(png|svg)$/i, '');
  const src = path.join(SRC_DIR, file);

  // SVG'ler yüksek yoğunlukta taranıyor; sonra küçültüldükleri için kenarlar
  // keskin kalıyor. Yoğunluk düşük olursa kelime markası bulanıklaşıyor.
  const loaded = sharp(src, { density: 600 }).ensureAlpha();
  const { data, info } = await loaded.clone().raw().toBuffer({ resolveWithObject: true });
  const box = inkBox(data, info);

  const boxW = W - PAD_X * 2;
  const boxH = H - PAD_Y * 2;
  const scale = Math.min(boxW / box.width, boxH / box.height);
  const w = Math.max(1, Math.round(box.width * scale));
  const h = Math.max(1, Math.round(box.height * scale));

  const art = await loaded
    .clone()
    .extract(box)
    .resize(w, h, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();

  const out = path.join(OUT_DIR, `${slug}.png`);
  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: art, left: Math.round((W - w) / 2), top: Math.round((H - h) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(
    '%s  kaynak %dx%d  mürekkep %dx%d  yerleşti %dx%d  -> public/stores/%s.png',
    slug.padEnd(22),
    info.width,
    info.height,
    box.width,
    box.height,
    w,
    h,
    slug,
  );
}

console.log('\ntuval: %dx%d  ic kutu: %dx%d  (hepsi ayni)', W, H, W - PAD_X * 2, H - PAD_Y * 2);

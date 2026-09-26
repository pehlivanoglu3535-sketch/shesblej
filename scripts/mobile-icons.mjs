/**
 * ShesBlej logosundan mobil uygulama simgelerini üretir.
 *
 * Üç farklı biçim gerekiyor ve hiçbiri logoyu olduğu gibi kullanamıyor:
 *
 * 1. iOS (icon.png): saydamlık YASAK ve köşeler yuvarlatılmış olmamalı — iOS
 *    kendi maskesini uyguluyor. Logoyu olduğu gibi verirsek çift yuvarlatma
 *    ve köşelerde siyah leke oluyor. Bu yüzden logo düz altın bir zemine
 *    oturtuluyor; logonun saydam köşeleri altınla dolduğu için sonuç düz bir
 *    altın kare + siyah SB oluyor.
 *
 * 2. Android uyarlanır simge (foreground): ön katman saydam olmalı ve içerik
 *    ortadaki %66'ya sığmalı, çünkü üretici maskeleri kenarları kırpıyor.
 *    Siyah SB, parlaklık eşiğiyle ayıklanıp ortaya yerleştiriliyor; zemin
 *    rengi app.json'da altın.
 *
 * 3. Açılış ekranı: koyu zemin üzerinde logo olduğu gibi iyi duruyor, sadece
 *    küçültülüyor.
 *
 * Kullanım: node scripts/mobile-icons.mjs <hedef-assets-klasoru>
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/logo.png';
const GOLD = { r: 253, g: 210, b: 2 };
const OUT = process.argv[2];

if (!OUT) {
  console.error('hedef klasor gerekli');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

/**
 * Siyah SB'yi saydam zemine ayıklar.
 *
 * Logo altın zemin üzerine siyah harf; parlaklığı eşikten düşük pikselleri
 * opak siyah, gerisini saydam yapıyoruz.
 *
 * Logoyu olduğu gibi altın zemine oturtmak da denendi, ama logonun kendi
 * eğim/parlama kenarı altın üstünde soluk bir yuvarlak çerçeve olarak
 * görünüyor. Harfi ayıklayıp temiz zemine koymak o hayaleti tamamen kaldırıyor.
 */
async function extractGlyph() {
  const src = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels } = src.info;
  const out = Buffer.alloc(W * H * 4, 0);

  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * channels;
      const a = src.data[i + 3];
      // Alfa eşiği şart: logonun altındaki yumuşak gölge de koyu, ama yarı
      // saydam. Yalnız parlaklığa bakınca gölge de "harf" sayılıyor ve kırpım
      // kutusu logonun tamamına genişleyip SB'yi merkezden kaydırıyor
      // (ölçüldü: 1254x1130 yerine olması gereken ~1000x560).
      if (a < 230) continue;
      const lum = 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
      if (lum < 90) {
        const o = (y * W + x) * 4;
        out[o] = 17;
        out[o + 1] = 17;
        out[o + 2] = 10;
        out[o + 3] = 255;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('SB kirpimi:', (maxX - minX + 1) + 'x' + (maxY - minY + 1));
  return sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer();
}

/** Ölçeklenmiş SB'yi verilen kutuya sığdırır ve ortalar. */
async function centred(glyph, size, fraction, background) {
  const box = Math.round(size * fraction);
  const scaled = await sharp(glyph)
    .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const meta = await sharp(scaled).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([
      {
        input: scaled,
        top: Math.round((size - (meta.height ?? box)) / 2),
        left: Math.round((size - (meta.width ?? box)) / 2),
      },
    ])
    .png();
}

/** iOS: saydamlık yasak, köşe yuvarlatma yasak — düz altın kare. */
async function iosIcon(glyph) {
  const buf = await (await centred(glyph, 1024, 0.64, { ...GOLD, alpha: 1 })).removeAlpha().png().toBuffer();
  await writeFile(path.join(OUT, 'icon.png'), buf);
  const m = await sharp(buf).metadata();
  console.log('icon.png', m.width + 'x' + m.height, 'alpha:', m.hasAlpha);
}

/** Android uyarlanır simge: ön katman saydam, içerik ortadaki %60'ta. */
async function androidForeground(glyph) {
  const make = () => centred(glyph, 1024, 0.56, { r: 0, g: 0, b: 0, alpha: 0 });
  await writeFile(path.join(OUT, 'android-icon-foreground.png'), await (await make()).toBuffer());
  await writeFile(path.join(OUT, 'android-icon-monochrome.png'), await (await make()).toBuffer());
  console.log('android foreground + monochrome yazildi');
}

async function splashAndFavicon() {
  await writeFile(
    path.join(OUT, 'splash-icon.png'),
    await sharp(SRC).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
  );
  await writeFile(
    path.join(OUT, 'favicon.png'),
    await sharp(SRC).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
  );
  console.log('splash-icon.png 512x512, favicon.png 48x48');
}

const glyph = await extractGlyph();
await iosIcon(glyph);
await androidForeground(glyph);
await splashAndFavicon();
console.log('\nbitti ->', OUT);

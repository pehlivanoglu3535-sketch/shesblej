/**
 * Sitenin kanonik adresi.
 *
 * Neden ayrı bir fonksiyon: `NEXT_PUBLIC_SITE_URL` yerelde
 * `http://localhost:3000` olarak duruyor. Bu değer Vercel'e kopyalanırsa
 * robots.txt, sitemap.xml ve canonical etiketleri canlıda da localhost
 * gösterir — Google için site tamamen görünmez olur.
 *
 * Bu yüzden localhost/127.0.0.1 değerleri yok sayılıyor ve yayın adresine
 * düşülüyor. Canlıda doğru adresi kullanmak için Vercel'de (Production)
 * NEXT_PUBLIC_SITE_URL değişkenini gerçek alan adına ayarlayın.
 */
const FALLBACK_SITE_URL = 'https://shesblejks.com';

function isLocal(value: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(value);
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && !isLocal(explicit)) return explicit.replace(/\/+$/, '');
  return FALLBACK_SITE_URL;
}

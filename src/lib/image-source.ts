/**
 * Hangi görselin Next'in görsel iyileştiricisinden geçeceğine karar verir.
 *
 * NEDEN BÖYLE BİR AYRIM GEREKİYOR
 * 01.10.2026'da site Vercel tarafından durduruldu: Hobby planının aylık
 * görsel dönüşüm hakkı (5.000) aşılmıştı — 5,2K. Sebep tek tek ilanlar değil,
 * partner envanteriydi: veritabanındaki 1.217 fotoğrafın 1.186'sı Encar ve
 * Auto Salloni Alberti'nin kendi CDN'lerinde duruyor ve hepsi bizim
 * iyileştiricimizden geçiyordu. Her (görsel, genişlik) çifti ayrı bir dönüşüm
 * sayıldığı için bir ayda kota doldu.
 *
 * Partner görsellerinde iyileştirmenin karşılığı da yoktu:
 *   - Alberti zaten 1600px WebP veriyor.
 *   - Encar'ın CDN'i `impolicy` parametresiyle kendi yeniden boyutlandırıyor.
 * Yani ikisi de bizim yapacağımız işi kendi tarafında yapmış durumda; araya
 * girmek sadece kotadan yiyordu.
 *
 * Kendi depomuzdaki (Supabase) kullanıcı fotoğrafları iyileştirmeden geçmeye
 * devam ediyor: onlar telefon kamerasından geliyor, 4-5 MB olabiliyor ve
 * küçültülmezse hem sayfa ağırlaşıyor hem Supabase çıkış kotası eriyor.
 */
const PARTNER_IMAGE_HOSTS = ['autoalberti.com', 'autosallonialberti.net', 'ci.encar.com'];

export function isPartnerImage(src: string): boolean {
  return PARTNER_IMAGE_HOSTS.some((host) => src.includes(host));
}

/**
 * Partner görselinin küçük varyantını verir.
 *
 * NEDEN GEREKİYOR
 * İlan kartı 228 piksel genişliğinde ama veritabanındaki yollar 1600
 * pikselli kareyi gösteriyor ve partner görselleri iyileştiriciden
 * geçmediği için tarayıcı o 1600 pikseli olduğu gibi indirip çözüyor.
 * Bir kare diskte 69 KB, ama bellekte çözülmüş hâli 1600x1067x4 ≈ 6,8 MB.
 *
 * Ölçüldü: ana sayfada yalnız sekiz kartın üzerinden geçmek 291 MB
 * çözülmüş bitmap yapıyordu. 86 kartlık bir ızgarada fareyi gezdirmek
 * sekmeyi öldürüyor ve Chrome "Hay aksi!" ekranını gösteriyordu.
 *
 * Bayinin CDN'i aynı kareyi 480 ve 960 piksel olarak da yayınlıyor
 * (hepsi kontrol edildi, her indeks için mevcut). 480 piksel, 228
 * piksellik bir kutuya iki kat yoğunlukta ekranda bile yetiyor ve
 * bellekte ~0,6 MB tutuyor — on kat daha az.
 *
 * Encar görsellerine dokunulmuyor: onların CDN'i zaten `impolicy`
 * parametresiyle 640 piksel veriyor (28 KB).
 */
export function partnerThumb(src: string, width: 480 | 960 = 480): string {
  if (!/autoalberti\.com|autosallonialberti\.net/.test(src)) return src;
  return src.replace(/\.(480|960|1600)\.webp$/, `.${width}.webp`);
}

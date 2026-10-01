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
const PARTNER_IMAGE_HOSTS = ['autosallonialberti.net', 'ci.encar.com'];

export function isPartnerImage(src: string): boolean {
  return PARTNER_IMAGE_HOSTS.some((host) => src.includes(host));
}

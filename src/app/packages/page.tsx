import { redirect } from 'next/navigation';

/**
 * Paketler sayfası kaldırıldı; sayfa yalnız yönlendirme olarak duruyor.
 *
 * Silinmemesinin sebebi eski bağlantılar: bu adres arama motorlarında
 * indekslendi ve tanıtım e-postalarında geçti. Rotayı tamamen kaldırmak
 * gelen ziyaretçiye 404 gösterirdi; ana sayfaya almak daha iyi.
 */
export default function PackagesPage() {
  redirect('/');
}

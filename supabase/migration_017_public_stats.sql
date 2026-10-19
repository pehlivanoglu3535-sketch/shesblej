-- ============================================================
-- Migration 017: ana sayfa sayaçları için güvenli sayım
--
-- SORUN
-- Ana sayfaya konan sayaç "0 Aktif Kullanıcı" gösteriyordu. Sebep hata
-- değil, doğru çalışan güvenlik: migration_002 `profiles` okumasını kendi
-- satırına kısıtladı, yani oturum açmamış ziyaretçinin saydırabileceği
-- profil yok. Sayı 11 olduğu hâlde 0 görünüyordu.
--
-- "0 kullanıcı" yazan bir pazar yeri boş görünür; bu, olmayan sayaçtan
-- daha kötü.
--
-- ÇÖZÜM
-- Tek satır döndüren bir sayım fonksiyonu. Yalnızca üç toplam veriyor,
-- hiçbir satır içeriği dışarı çıkmıyor — yani profil tablosunun gizliliği
-- aynen duruyor. Fonksiyonun SECURITY DEFINER olması şart: aksi halde
-- çağıranın RLS'ine takılıp yine 0 dönerdi.
--
-- Kullanıcı sayısı zaten herkese açık bir bilgi; kimin kayıtlı olduğu
-- değil, kaç kişi olduğu söyleniyor.
-- ============================================================

create or replace function public.public_stats()
returns table (listings bigint, users bigint, cities bigint)
language sql
security definer
stable
set search_path = public
as $fn$
  select
    (select count(*) from public.listings where expires_at > now()),
    (select count(*) from public.profiles),
    (select count(distinct city) from public.listings where expires_at > now());
$fn$;

revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;

select * from public.public_stats();

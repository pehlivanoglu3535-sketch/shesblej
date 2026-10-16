-- ============================================================
-- Migration 015: profiles_public görünümünü salt okunur yap
--
-- AÇIK (kritik, anonim olarak sömürülebilir)
-- `profiles_public`, migration_002'de `profiles` tablosunun yalnızca dört
-- zararsız sütununu dışarı açmak için yazıldı ve bilinçli olarak
-- `security_invoker` ayarlanmadı: görünüm sahibinin haklarıyla çalışsın ki
-- ilan sahibinin adı herkese görünebilsin.
--
-- Gözden kaçan şey şu: Supabase, public şemasındaki nesnelere `anon` ve
-- `authenticated` rolleri için öntanımlı olarak TÜM yetkileri veriyor.
-- Tek tablolu basit bir görünüm Postgres'te otomatik olarak güncellenebilir
-- (`information_schema.views.is_updatable = YES`). İkisi bir araya gelince
-- sonuç şu oluyor:
--
--   * Görünümün üzerinden yapılan UPDATE/DELETE alttaki `profiles` tablosuna
--     yazıyor,
--   * ve görünüm sahibin haklarıyla çalıştığı için `profiles` üzerindeki RLS
--     tamamen atlanıyor.
--
-- Yani tarayıcı paketinde zaten bulunan genel anon anahtarıyla, oturum
-- açmadan, tek bir HTTP isteğiyle bütün kullanıcıların adı değiştirilebilir
-- ya da bütün profil satırları silinebilirdi. Silme, yabancı anahtarlar
-- üzerinden mesajlara, favorilere, siparişlere ve şikâyetlere de yayılırdı.
--
-- Denetimde yıkıcı bir kanıt çalıştırılmadı; yetki tablosu, görünümün
-- güncellenebilirliği ve PostgREST'in 401 yerine 200 dönmesi yeterince
-- kesindi.
--
-- ÇÖZÜM
-- Görünümü salt okunur bırakmak. Uygulama bu görünümden yalnızca `select`
-- yapıyor (altı kullanım, hepsi okuma), bu yüzden yazma yetkisini almanın
-- işlevsel etkisi yok.
--
-- `security_invoker` bilinçli olarak AÇILMIYOR: açılsaydı görünüm `profiles`
-- RLS'ine tabi olur ve anonim ziyaretçi ilan sahibinin adını göremezdi.
-- Görünümün tek işi o dört sütunu güvenle yayınlamak.
-- ============================================================

revoke insert, update, delete, truncate, references, trigger
  on public.profiles_public from anon, authenticated;

-- Doğrulama: yalnızca SELECT kalmalı.
select grantee,
       string_agg(distinct privilege_type, ', ' order by privilege_type) as yetkiler
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profiles_public'
  and grantee in ('anon', 'authenticated')
group by grantee;

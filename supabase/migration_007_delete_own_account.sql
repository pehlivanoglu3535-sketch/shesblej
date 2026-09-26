-- Kullanıcının kendi hesabını silmesi.
--
-- NEDEN GEREKLİ
-- İki sebep var. Birincisi App Store kuralı 5.1.1(v): üyelik açılabilen her
-- uygulamada hesabın uygulama içinden silinebilmesi şart, yoksa uygulama
-- reddediliyor. İkincisi kendi gizlilik politikamız (shesblejks.com/privacy)
-- zaten "delete your account directly" diyor — söz verip yapmıyorduk.
--
-- NEDEN RPC
-- auth.users tablosundan silme yetkisi `anon`/`authenticated` rollerinde yok
-- ve istemcide service_role anahtarı tutmak güvenlik açığı olur. Bu yüzden
-- silmeyi SECURITY DEFINER bir fonksiyon yapıyor: yetkiyi fonksiyon taşıyor,
-- istemci taşımıyor. Fonksiyon yalnız auth.uid() üzerinde çalışıyor, yani
-- kullanıcı başkasının hesabını silemez.
--
-- NE SİLİNİYOR
-- auth.users satırı silinince profiles cascade ile gidiyor, profiles'a bağlı
-- listings.owner_id ise `on delete set null` olduğu için ilanlar sahipsiz
-- kalıyor. Sahipsiz ilan kimsenin yönetemediği ve kimsenin mesaj atamadığı
-- bir kayıt olur, o yüzden hesapla birlikte ilanları da açıkça siliyoruz.
-- Mesajlar ve favoriler profiles'a cascade bağlı, onlar kendiliğinden gidiyor.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- İlanlar owner_id'de `set null` olduğu için cascade ile gitmiyor.
  delete from public.listings where owner_id = uid;

  -- profiles, messages, favorites, reports: auth.users'a cascade bağlı.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ============================================================
-- Migration 016: ayrıcalıklı sütunları kilitle
--
-- İKİ AÇIK
--
-- 1) Yetki yükseltmesi. `profiles` UPDATE politikası şöyleydi:
--        USING (auth.uid() = id)   --  WITH CHECK yok, sütun kısıtı yok
--    Giriş yapmış herhangi biri kendi satırında `is_admin = true` yazıp
--    yönetici olabiliyordu: yönetici paneli, bütün profiller, bütün
--    mesajlar, bütün şikâyetler, her ilanı silme yetkisi. Aynı delikten
--    `plan` ve `credit_*` de yazılabildiği için ücretli ne varsa bedavaydı.
--
-- 2) İlanlarda ücretli alanlar. `listings` UPDATE politikasında da WITH CHECK
--    yoktu; ayrıca INSERT politikası yalnızca `owner_id`'ye bakıyordu. Yani
--    rozetler (`is_urgent`, `is_highlighted`, `uses_showcase`) kredi
--    harcamadan açılabiliyor, `expires_at` sonsuza uzatılabiliyor, `store_id`
--    bir partner mağazaya çevrilip ilan o mağazanın altında gösterilebiliyor
--    ve `owner_id` başkasına atanabiliyordu.
--
-- NEDEN SÜTUN YETKİSİ, NEDEN TRIGGER DEĞİL
-- RLS politikaları satır seçer, sütun seçemez. Postgres'in bunun için hazır
-- aracı sütun düzeyinde GRANT. Bildirimsel, tek yerde duruyor ve her yoldan
-- (PostgREST, doğrudan SQL, ileride eklenecek herhangi bir istemci) aynı
-- şekilde uygulanıyor. Trigger ile "eski değere geri çevir" yapmak da
-- mümkündü ama o, yasak yazmayı sessizce yutar; GRANT açıkça reddeder.
--
-- KORUNAN SÜTUNLARI MEŞRU AKIŞLAR NASIL YAZACAK
-- Kredi düşme ve yeniden yayınlama şu ana kadar kullanıcının kendi
-- oturumuyla yazıyordu; sütunlar kilitlenince bunlar çalışamaz. İkisi de
-- aşağıdaki SECURITY DEFINER fonksiyonlara taşınıyor. Bu arada eski kodda
-- duran bir yarış durumu da kapanıyor: kredi "önce oku, sonra yaz" ile
-- düşülüyordu, iki eşzamanlı ilan aynı krediyi iki kez harcayabilirdi.
-- Fonksiyonlar tek ifadede, satırı kilitleyerek düşüyor.
-- ============================================================


-- ---------- 1) profiles: yalnız kendi bilgilerini düzenleyebilsin ----------

drop policy if exists "users can update own profile" on public.profiles;

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);   -- satırını başkasının üstüne taşıyamasın

revoke update, insert on public.profiles from anon, authenticated;
-- INSERT de aliniyor: profil satirini yalniz handle_new_user trigger'i
-- olusturuyor ve o SECURITY DEFINER oldugu icin bu yetkiye ihtiyac duymuyor.

-- Kullanıcının kendi düzenleyebileceği alanlar. is_admin, plan,
-- plan_expires_at, credit_*, email, created_at ve consent_given listede YOK.
grant update (name, phone, company_name, account_type, company_logo_url, push_token)
  on public.profiles to authenticated;


-- ---------- 2) listings: içerik serbest, ücretli/sistem alanları kilitli ----------

drop policy if exists "users can update own listings" on public.listings;

create policy "users can update own listings"
  on public.listings for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);   -- ilanı başkasına devredemesin

revoke insert, update on public.listings from anon, authenticated;

-- INSERT: owner_id gerekiyor (politika onu doğruluyor). expires_at, store_id
-- ve rozetler listede yok -- varsayılanlarıyla (29 gün / null / false)
-- oluşuyorlar.
grant insert (
  owner_id, category, subcategory, title, price, city, district,
  map_lat, map_lng, phone, description, photos, brand,
  model, year, mileage_km, fuel, engine_cc, power_hp,
  transmission, drivetrain, body_type, color_exterior, color_interior, features
) on public.listings to authenticated;

-- UPDATE: owner_id de listede yok, yani düzenlerken sahip değiştirilemiyor.
grant update (
  category, subcategory, title, price, city, district,
  map_lat, map_lng, phone, description, photos, brand,
  model, year, mileage_km, fuel, engine_cc, power_hp,
  transmission, drivetrain, body_type, color_exterior, color_interior, features
) on public.listings to authenticated;


-- ---------- 3) Plan sınırı: tek doğru kaynak ----------
-- src/lib/plan.ts ile aynı hesap. Yeniden yayınlama fonksiyonu sınırı
-- burada okuyor; aksi halde kullanıcı fonksiyonu doğrudan çağırıp
-- uygulamadaki kontrolü atlayabilirdi.

create or replace function public.listing_limit(p_user uuid)
returns int
language sql
security definer
stable
set search_path = public
as $fn$
  select case
           when p.plan = 'standard' then 20
           when p.plan_expires_at is not null and p.plan_expires_at < now() then 20
           when p.plan = 'premium' then 10
           when p.plan = 'enterprise' then 100
           else 20
         end + coalesce(p.credit_extra_listing, 0)
  from public.profiles p
  where p.id = p_user;
$fn$;

revoke all on function public.listing_limit(uuid) from public, anon;
grant execute on function public.listing_limit(uuid) to authenticated;


-- ---------- 4) Rozetleri krediyle al ----------
-- İlan oluşturulduktan sonra çağrılıyor. Krediyi aynı ifadede düşürüp
-- rozeti açıyor; kredi yoksa rozet de açılmıyor.

create or replace function public.claim_listing_badges(
  p_listing_id uuid,
  p_urgent     boolean default false,
  p_highlight  boolean default false,
  p_showcase   boolean default false
)
returns table (urgent boolean, highlight boolean, showcase boolean)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user       uuid := auth.uid();
  v_urgent     boolean := false;
  v_highlight  boolean := false;
  v_showcase   boolean := false;
  v_showcase_limit int;
  v_showcase_used  int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  -- İlan gerçekten bu kullanıcının mı? Fonksiyon DEFINER olduğu için bu
  -- kontrol şart: aksi halde herkes herkesin ilanını öne çıkarabilirdi.
  if not exists (
    select 1 from public.listings
    where id = p_listing_id and owner_id = v_user
  ) then
    raise exception 'listing not found or not owned by caller';
  end if;

  if p_urgent then
    update public.profiles
      set credit_urgent_tag = credit_urgent_tag - 1
      where id = v_user and credit_urgent_tag > 0;
    v_urgent := found;
  end if;

  if p_highlight then
    update public.profiles
      set credit_highlight = credit_highlight - 1
      where id = v_user and credit_highlight > 0;
    v_highlight := found;
  end if;

  if p_showcase then
    select case
             when p.plan = 'standard' then 1
             when p.plan_expires_at is not null and p.plan_expires_at < now() then 1
             when p.plan = 'premium' then 3
             when p.plan = 'enterprise' then 20
             else 1
           end + coalesce(p.credit_extra_showcase, 0)
      into v_showcase_limit
      from public.profiles p where p.id = v_user;

    select count(*) into v_showcase_used
      from public.listings
      where owner_id = v_user and uses_showcase and expires_at > now();

    v_showcase := coalesce(v_showcase_used, 0) < coalesce(v_showcase_limit, 1);
  end if;

  update public.listings
    set is_urgent      = v_urgent,
        is_highlighted = v_highlight,
        uses_showcase  = v_showcase
    where id = p_listing_id and owner_id = v_user;

  return query select v_urgent, v_highlight, v_showcase;
end;
$fn$;

revoke all on function public.claim_listing_badges(uuid, boolean, boolean, boolean) from public, anon;
grant execute on function public.claim_listing_badges(uuid, boolean, boolean, boolean) to authenticated;


-- ---------- 5) Yeniden yayınlama ----------
-- `expires_at` artık kullanıcıya kapalı. Sahiplik ve plan sınırı burada,
-- SQL içinde doğrulanıyor: fonksiyon doğrudan PostgREST üzerinden de
-- çağrılabildiği için kontrolleri yalnızca TypeScript tarafında bırakmak
-- yetmezdi.

create or replace function public.republish_listing(p_listing_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user   uuid := auth.uid();
  v_active int;
  v_limit  int;
  v_new    timestamptz;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.listings
    where id = p_listing_id and owner_id = v_user
  ) then
    raise exception 'listing not found or not owned by caller';
  end if;

  -- Hâlâ yayındaysa dokunma; yoksa süresi dolmamış ilanlar tekrar tekrar
  -- uzatılabilirdi.
  select expires_at into v_new from public.listings where id = p_listing_id;
  if v_new > now() then
    return v_new;
  end if;

  select count(*) into v_active
    from public.listings
    where owner_id = v_user and expires_at > now();

  v_limit := public.listing_limit(v_user);

  if v_active >= v_limit then
    raise exception 'listing limit reached';
  end if;

  v_new := now() + interval '29 days';
  update public.listings set expires_at = v_new where id = p_listing_id and owner_id = v_user;
  return v_new;
end;
$fn$;

revoke all on function public.republish_listing(uuid) from public, anon;
grant execute on function public.republish_listing(uuid) to authenticated;


-- ---------- 6) SECURITY DEFINER fonksiyonlara sabit search_path ----------
-- Şu an sömürülebilir değil (anon ve authenticated rollerinin public
-- şemasında CREATE yetkisi yok, kontrol edildi) ama DEFINER bir fonksiyonun
-- arama yolunu çağırana bırakması standart bir sertleştirme eksiği.

alter function public.is_admin()        set search_path = public;
alter function public.handle_new_user() set search_path = public, auth;


-- ---------- 7) Depolama: herkes yalnız kendi klasörüne yüklesin ----------
-- Eski kural yalnızca "kova doğru mu, kullanıcı giriş yapmış mı" diye
-- bakıyordu; silme kendi klasörüyle sınırlıyken yükleme değildi, yani bir
-- kullanıcı başkasının klasörüne dosya bırakabiliyordu.

drop policy if exists "authenticated users can upload listing photos" on storage.objects;

create policy "users upload into their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ---------- Doğrulama ----------
select 'profiles yazilabilir sutunlar' as kontrol,
       coalesce(string_agg(column_name, ', ' order by column_name), 'YOK') as sonuc
from information_schema.column_privileges
where table_schema='public' and table_name='profiles'
  and grantee='authenticated' and privilege_type='UPDATE'
union all
select 'listings guncellenebilir sutunlar',
       coalesce(string_agg(column_name, ', ' order by column_name), 'YOK')
from information_schema.column_privileges
where table_schema='public' and table_name='listings'
  and grantee='authenticated' and privilege_type='UPDATE';

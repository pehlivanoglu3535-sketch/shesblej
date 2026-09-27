-- Araç ilanlarının yapılandırılmış künyesi.
--
-- Şimdiye kadar yıl, kilometre, yakıt, şanzıman gibi her şey serbest metin
-- açıklamanın içindeydi: ne süzülebiliyor ne de düzgün bir tabloda
-- gösterilebiliyordu. Her biri kendi sütununa çıkıyor.
--
-- Hepsi null kabul ediyor. Mevcut 95 araç ilanının hiçbirinde bu alanlar
-- yok; zorunlu yapmak tüm tabloyu geçersiz kılardı. İlan detayı boş alanı
-- zaten atlıyor.

alter table public.listings
  add column if not exists model            text,
  add column if not exists year             int,
  add column if not exists mileage_km       int,
  add column if not exists fuel             text,
  add column if not exists engine_cc        int,
  add column if not exists power_hp         int,
  add column if not exists transmission     text,
  add column if not exists drivetrain       text,
  add column if not exists body_type        text,
  add column if not exists color_exterior   text,
  add column if not exists color_interior   text,
  add column if not exists features         text[] not null default '{}';

-- Sağlık kontrolleri: uygulama zaten doğruluyor ama içe aktarma betikleri
-- doğrudan insert ediyor ve oradan saçma bir değer girmesi mümkün.
alter table public.listings drop constraint if exists listings_year_range;
alter table public.listings add constraint listings_year_range
  check (year is null or (year between 1950 and 2100));

alter table public.listings drop constraint if exists listings_mileage_range;
alter table public.listings add constraint listings_mileage_range
  check (mileage_km is null or (mileage_km between 0 and 2000000));

-- Alıcı çoğunlukla "şu yıldan yeni, şu kilometrenin altında" diye arıyor.
create index if not exists listings_vehicle_idx
  on public.listings (category, year desc, mileage_km)
  where category = 'vasita';

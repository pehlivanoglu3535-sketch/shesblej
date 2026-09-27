-- Kullanıcı kendi ilanlarını süresi dolsa da görebilsin.
--
-- SORUN
-- listings tablosunda iki okuma kuralı vardı: "expires_at > now()" (herkese)
-- ve adminler. Sahibi için kural yoktu. Sonuç: süresi dolan ilan sahibinden de
-- gizleniyordu.
--
-- "İlanlarım" sayfası `includeExpired: true` ile sorgu atıyor ve kodda
-- "süresi doldu" etiketi ile yeniden yayınlama düğmesi var — ama RLS satırı
-- hiç döndürmediği için bunların hiçbiri görünmüyordu. Kullanıcı açısından
-- ilan sessizce yok olmuş gibiydi.
--
-- ÇÖZÜM
-- Sahibine kendi satırlarını okuma izni. Politikalar OR'lanır, yani bu kural
-- mevcut "herkese açık" kuralını genişletmiyor; yalnız sahibine kendi
-- ilanlarını açıyor. Başkasının süresi dolmuş ilanı hâlâ görünmez.

create policy "users can view own listings"
  on public.listings for select
  using (auth.uid() = owner_id);

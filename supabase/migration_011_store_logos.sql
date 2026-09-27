-- Partner mağaza logoları.
--
-- Yol Supabase Storage değil, uygulamanın kendi `public/stores/` klasörü.
-- Nedeni: yapılandırılmamış bir görsel sunucusu bu projede `next/image` ile
-- sayfayı 500'e düşürüyor (ölçüldü), yani uzak bir kaynak eklemek her zaman
-- "önce görsel sunucusunu yayına al, sonra kayıtları ekle" sırasına bağımlı.
-- Statik dosya uygulamayla birlikte dağıtıldığı için o sıra hiç gerekmiyor.
--
-- Dosyalar scripts/store-logos.mjs ile üretiliyor; üçü de 600x160 saydam PNG
-- ve içerikleri aynı iç kutuya ortalanmış durumda.

update public.stores set logo_url = '/stores/auto-salloni-alberti.png'
where slug = 'auto-salloni-alberti';

update public.stores set logo_url = '/stores/encar.png'
where slug = 'encar';

update public.stores set logo_url = '/stores/remax-kosova.png'
where slug = 'remax-kosova';

select slug, name, logo_url from public.stores order by name;

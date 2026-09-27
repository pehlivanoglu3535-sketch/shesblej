-- İçe aktarılan araç ilanlarının künyesini açıklamadan çıkarır.
--
-- 92 araç ilanı Encar ve Auto Salloni Alberti içe aktarmalarından geliyor.
-- Teknik bilgileri kaybolmadı, açıklamanın içinde duruyor — üstelik sabit
-- bir kalıpla, çünkü açıklamaları biz ürettik (scripts/alberti-listings.py,
-- scripts/encar-listings.py):
--
--   Viti: 2022
--   Kilometrazhi: 150.000 km
--   Fuqia: 190 PS
--   Karburanti: Diesel
--   Transmisioni: Automatike
--
-- Yani ayrıştırma tahmin değil, kendi kalıbımızı geri okumak. Doldurma
-- yapılmasaydı yeni künye tablosu 92 ilanda boş görünecek, özellik bozuk
-- sanılacaktı.
--
-- Yalnız boş alanlar dolduruluyor (`is null` koşulu): elle düzeltilmiş bir
-- ilan varsa üzerine yazılmıyor ve betik tekrar çalıştırılabilir.

-- 1) Kilometre. Binlik ayracı nokta; sayıya çevirmeden önce atılıyor.
update public.listings
set mileage_km = nullif(replace(substring(description from 'Kilometrazhi: ([0-9.]+) km'), '.', ''), '')::int
where category = 'vasita'
  and mileage_km is null
  and description ~ 'Kilometrazhi: [0-9.]+ km';

-- 2) Motor gücü (yalnız Alberti veriyor).
update public.listings
set power_hp = substring(description from 'Fuqia: ([0-9]+) PS')::int
where category = 'vasita'
  and power_hp is null
  and description ~ 'Fuqia: [0-9]+ PS';

-- 3) Üretim yılı. Alberti hem açıklamada hem başlıkta veriyor, Encar
--    hiçbirinde vermiyor — o 37 ilanda yıl boş kalıyor.
update public.listings
set year = substring(description from 'Viti: ([0-9]{4})')::int
where category = 'vasita'
  and year is null
  and description ~ 'Viti: [0-9]{4}';

update public.listings
set year = substring(title from '[(]([0-9]{4})[)][ ]*$')::int
where category = 'vasita'
  and year is null
  and title ~ '[(][0-9]{4}[)][ ]*$';

-- 4) Yakıt ve 5) şanzıman.
--
-- Ham değer doğrudan karşılaştırılamıyor, iki nedenle:
--
--   * Encar açıklamalarının her satırı bir satır başı karakteriyle (CR)
--     bitiyor — SQL dosyası Windows'ta metin kipinde yazıldığı için satır
--     sonları çift karaktere dönüşmüş ve bu, dize sabitlerinin içine
--     girmiş. Yani "Benzin" aslında "Benzin"+CR olarak duruyor. İlk
--     denemede 92 ilandan 37'si tam bu yüzden hiçbir eşleşmeye takılmadı.
--   * Alberti kaynağında şanzıman Arnavutça: "Automatike", "Automatic"
--     değil. İlk denemede şanzıman 0 ilanda eşleşti.
--
-- Bu yüzden değer önce sondaki boşluklardan temizlenip küçük harfe
-- çevriliyor; eşleme tablosu da her iki dildeki yazımı taşıyor.

update public.listings l
set fuel = m.id
from (values
  ('diesel','diesel'),('nafte','diesel'),('naftë','diesel'),
  ('benzin','benzin'),('gasoline','benzin'),('petrol','benzin'),
  ('hibrid plug-in','hibrid-plug-in'),('plug-in hybrid','hibrid-plug-in'),
  ('hibrid','hibrid'),('hybrid','hibrid'),
  ('elektrik','elektrik'),('electric','elektrik'),
  ('lpg','gaz'),('gaz','gaz')
) as m(src, id)
where l.category = 'vasita'
  and l.fuel is null
  and lower(btrim(substring(l.description from 'Karburanti: ([^' || chr(10) || ']+)'))) = m.src;

update public.listings l
set transmission = m.id
from (values
  ('automatic','automatik'),('automatik','automatik'),('automatike','automatik'),('automatik dsg','automatik'),
  ('manual','manual'),('manuel','manual'),('manuale','manual'),
  ('semi-automatic','gjysme-automatik'),('gjysme-automatik','gjysme-automatik')
) as m(src, id)
where l.category = 'vasita'
  and l.transmission is null
  and lower(btrim(substring(l.description from 'Transmisioni: ([^' || chr(10) || ']+)'))) = m.src;

-- 6) Kasa tipi yalnız SUV alt kategorisinden güvenle çıkarılabiliyor.
--    "otomobil" alt kategorisi sedan mı hatchback mi söylemiyor, orada
--    tahmin yürütülmüyor.
update public.listings
set body_type = 'suv'
where category = 'vasita' and body_type is null and subcategory = 'arazi-suv';

-- 7) Model adı. Başlıktan marka öneki ve sondaki yıl parantezi düşülüyor:
--    "Audi Q3 35TDI (2020)" -> "Q3 35TDI".
update public.listings
set model = nullif(btrim(regexp_replace(
      regexp_replace(title, '[ ]*[(][0-9]{4}[)][ ]*$', ''),
      '^' || brand || '[ ]*', '', 'i'
    )), '')
where category = 'vasita'
  and model is null
  and brand is not null;

-- 8) Açıklamalardaki taşınmış satır başı karakterleri.
--    Künye artık ayrı sütunlarda, ama açıklama metni de ekranda fazladan
--    boşluk üretiyordu.
update public.listings
set description = replace(description, chr(13), '')
where description like '%' || chr(13) || '%';

select
  count(*) filter (where year is not null)         as viti,
  count(*) filter (where mileage_km is not null)   as km,
  count(*) filter (where fuel is not null)         as karburanti,
  count(*) filter (where transmission is not null) as transmisioni,
  count(*) filter (where power_hp is not null)     as fuqia,
  count(*) filter (where body_type is not null)    as karroceria,
  count(*) filter (where model is not null)        as modeli,
  count(*)                                         as gjithsej
from public.listings
where category = 'vasita';

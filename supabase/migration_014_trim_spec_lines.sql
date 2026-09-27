-- Açıklamalardaki künye satırlarını siler.
--
-- migration_013 bu satırları kendi sütunlarına taşıdı, ama metinde de
-- bırakmıştı. Sonuç ilan sayfasında aynı bilginin iki kez görünmesiydi:
-- bir kez "Teknik bilgiler" tablosunda, bir kez açıklamanın ilk beş
-- satırında. Referans aldığımız düzende açıklama düz metin, teknik veri
-- tablo; ikisinin çakışmaması gerekiyor.
--
-- Yalnız tam olarak sütuna taşınan beş alan siliniyor. Encar ilanlarındaki
-- "Lokacioni aktual: Kore e Jugut" satırı duruyor — o bilginin tabloda
-- karşılığı yok ve alıcı için kritik (araç Kosova'da değil).
--
-- Veri kaybı yok: beş alanın hepsi artık sütunlarda ve açıklamalar zaten
-- içe aktarma betikleriyle üretiliyor.

update public.listings
set description = btrim(regexp_replace(
  -- Künye satırlarını, başındaki satır sonuyla birlikte at.
  regexp_replace(description, '(^|\n)(Viti|Kilometrazhi|Fuqia|Karburanti|Transmisioni): [^\n]*', '', 'g'),
  -- Silme üç ve daha fazla ardışık satır sonu bırakabiliyor; paragraf
  -- aralığına indir.
  '\n{3,}', chr(10) || chr(10), 'g'))
where category = 'vasita'
  and description ~ '(^|\n)(Viti|Kilometrazhi|Fuqia|Karburanti|Transmisioni): ';

select count(*) as kalan_tekrar
from public.listings
where category = 'vasita'
  and description ~ '(^|\n)(Viti|Kilometrazhi|Fuqia|Karburanti|Transmisioni): ';

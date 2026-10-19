-- Bayinin stogunda olmayan / fiyati cekilen Alberti ilanlari.
-- Silinmiyor, suresi doldurularak pasife aliniyor: arac geri gelirse
-- ilan fotograflariyla ve mesaj gecmisiyle geri acilabiliyor.
update public.listings set expires_at = now()
where id in ('f73ecc10-9499-42f6-b707-76108b6a45a5', 'b9850f80-4ec6-433b-afb6-513b8fcc3a71', 'bd8511a7-373f-4b90-a044-9d9cf0c1ff6c', 'ae2ec430-6a29-4665-a6dd-8a987cbec019', 'ef2387d5-6ee9-48bd-b206-6a8eb95c2a88', 'd797f669-c1bf-4061-b8d7-1383501c2fba', 'ef9ac9a4-4575-4671-86fc-9f62c337cc3f', '707dd887-c2e5-44f2-b646-9659e2f9fec4', '073d4526-1083-403f-b939-02ae26333ea0', 'aa7ab0ce-6c34-42e0-99d0-a149da89d63c', '34aae7ea-b86a-40b2-9c9c-883eb235d17c');

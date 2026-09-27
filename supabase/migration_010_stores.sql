-- Partner mağazaları.
--
-- SORUN
-- İçe aktarılan ilanların hepsi tek bir hesaba ait. Mağazayı ilan sahibinden
-- türeten mevcut yapı (/gallery ve /gallery/[id]) bu yüzden onları ayıramıyor
-- ve mağaza adı başlığa yazılmak zorunda kalınmıştı: "[Auto Salloni Alberti]
-- Audi Q3 35TDI (2021)". Bu hem çirkin hem arama sonuçlarını kirletiyor.
--
-- NEDEN AYRI TABLO
-- Mağazayı bir profile bağlamak için her partnere auth kullanıcısı açmak
-- gerekirdi; partnerin sitemizde hesabı yok ve olmasına da gerek yok. `stores`
-- tablosu "bizim içe aktardığımız partner envanteri" kavramını olduğu gibi
-- modelliyor. Kendi kaydolan bir işletmenin profili olmaya devam ediyor —
-- ikisi birbirini dışlamıyor, ileride bir mağaza bir profile bağlanabilir.

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  -- Mağaza sayfasında gösterilecek kısa tanıtım; dil başına değil, tek metin.
  about text,
  logo_url text,
  website text,
  phone text,
  city text,
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;

create policy "stores are viewable by everyone"
  on public.stores for select
  using (true);

alter table public.listings
  add column if not exists store_id uuid references public.stores(id) on delete set null;

create index if not exists listings_store_idx on public.listings (store_id);

-- Mağazalar
insert into public.stores (slug, name, about, website, phone, city) values
  ('auto-salloni-alberti', 'Auto Salloni Alberti',
   'Sallon automjetesh në Prishtinë, me vetura të gatshme për shikim në vend. Partner i ShesBlej.',
   'https://autosallonialberti.net', '+38344435435', 'Prishtinë'),
  ('encar', 'Encar — Import nga Korea e Jugut',
   'Automjete nga inventari zyrtar i Encar në Korenë e Jugut, të sjella me porosi. Partner i ShesBlej.',
   'https://global.encar.com', '+38349154218', 'Prishtinë'),
  ('remax-kosova', 'RE/MAX Kosova',
   'Prona rezidenciale dhe afariste në Kosovë. Partner i ShesBlej.',
   'https://www.remax-kosovo.com', '+38349154218', 'Prishtinë')
on conflict (slug) do nothing;

-- İlanları mağazalara bağla.
--
-- Eşleştirme başlık önekinden yapılıyor çünkü içe aktarma sırasında mağaza
-- bilgisini taşıyan tek alan oydu. RE/MAX ilanlarında önek yok; onlar
-- açıklamadaki kaynak satırından bulunuyor.
update public.listings l
set store_id = s.id
from public.stores s
where s.slug = 'auto-salloni-alberti'
  and l.title like '[Auto Salloni Alberti]%';

update public.listings l
set store_id = s.id
from public.stores s
where s.slug = 'encar'
  and l.title like '[IMPORT KORE]%';

update public.listings l
set store_id = s.id
from public.stores s
where s.slug = 'remax-kosova'
  and l.description like '%RE/MAX Kosova%';

-- Artık mağaza ayrı bir alanda; başlıktaki önek gereksiz ve çirkin.
update public.listings
set title = trim(substring(title from '^\[[^\]]+\]\s*(.*)$'))
where title ~ '^\[[^\]]+\]';

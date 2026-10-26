-- ============================================================
-- Migration 018: kullanıcı engelleme
--
-- NEDEN
-- Google Play'in Kullanıcı Tarafından Oluşturulan İçerik politikası (ve
-- App Store kuralı 1.2) kullanıcılar arası mesajlaşma barındıran
-- uygulamalarda DÖRT şeyi birlikte istiyor:
--   1. uygunsuz içeriği süzme,
--   2. içeriği şikayet etme,                  -> `reports` tablosu (var)
--   3. taciz eden kullanıcıyı ENGELLEME,      -> bu migration
--   4. yayınlanmış iletişim adresi.           -> info@shesblejks.com (var)
-- Üçüncüsü eksikti; mağaza incelemesinin en sık red sebeplerinden biri.
--
-- NEDEN SADECE MESAJLAR
-- Engelleme, engelleyenin o kullanıcıyla yazışmasını iki yönlü kesiyor.
-- İlanları gizlemeye BİLEREK dokunulmuyor: `listings` okuma politikası
-- oturum açmamış ziyaretçi dahil her sayfa isteğinde her satır için
-- çalışıyor, oraya bir alt sorgu koymak ana sayfayı yavaşlatırdı. Mağaza
-- politikası da zaten iletişimin kesilmesini istiyor, kataloğun
-- süzülmesini değil.
--
-- RLS TUZAĞI — BU YÜZDEN FONKSİYON VAR
-- Politikanın içine düz bir `not exists (select from blocks ...)` yazmak
-- İŞE YARAMAZ: o alt sorgu da çağıranın RLS'ine tabi olur. `blocks`
-- okuması kendi satırlarına kısıtlı olduğundan, engellenen kullanıcı
-- kendisini engelleyen satırı GÖREMEZ, `not exists` doğru döner ve mesaj
-- yine gider. Yani kural sessizce hiçbir şey yapmaz.
--
-- Çözüm, RLS'i atlayan bir SECURITY DEFINER fonksiyonu. Fonksiyon dışarıya
-- ikili listesi vermiyor: tek parametre alıyor ve diğer tarafı her zaman
-- `auth.uid()` ile eşleştiriyor. Yani çağıran yalnızca kendisini ilgilendiren
-- bir ilişkiyi sorabiliyor — bunu zaten mesaj gönderemeyerek öğrenecekti.
-- ============================================================

-- Tek işlem. Betik `messages` politikalarını DÜŞÜRÜP yeniden kuruyor;
-- ortada bir hata olursa politikalar düşmüş hâlde kalır ve RLS açık bir
-- tabloda politika yokluğu "hiçbir satıra erişilemez" demektir — üretimde
-- mesajlaşma tamamen kilitlenirdi. PostgreSQL'de DDL işlemsel olduğu için
-- blok, hata hâlinde her şeyi eski hâline döndürüyor.
begin;

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

-- Kullanıcı yalnız kendi engel listesini görür ve yönetir. Engellenen
-- kişinin kendisinin engellendiğini listeden okuması mümkün değil.
drop policy if exists "users manage own blocks" on public.blocks;
create policy "users manage own blocks"
  on public.blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);


-- ---------- Politikalarda kullanılan yardımcı ----------
create or replace function public.is_blocked_with(other uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $fn$
  select exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other and blocked_id = auth.uid())
  );
$fn$;

revoke all on function public.is_blocked_with(uuid) from public, anon;
grant execute on function public.is_blocked_with(uuid) to authenticated;


-- ---------- Mesaj politikaları yeniden yazılıyor ----------
-- Okuma: engellenen tarafla olan konuşma tamamen görünmez oluyor.
-- `receiver_id` boş olabilen bir sütun; o durumda karşı taraf yok, ilgili
-- kontrol de yok (null karşılaştırması exists'i boş bırakır).
drop policy if exists "participants can view their messages" on public.messages;
create policy "participants can view their messages"
  on public.messages for select
  using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and not public.is_blocked_with(
      case when auth.uid() = sender_id then receiver_id else sender_id end
    )
  );

-- Yazma: iki yönlü. Engelleyen kişi de engellediğine yazamıyor — tek yönlü
-- olsaydı engelleyen yazmaya devam edip karşı taraf cevap veremezdi, bu da
-- engellemeyi bir tacize dönüştürürdü.
drop policy if exists "users can send messages as themselves" on public.messages;
create policy "users can send messages as themselves"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and not public.is_blocked_with(receiver_id)
  );


-- ---------- Doğrulama ----------
-- Beklenen: tablo var, iki politika yerinde, fonksiyon yetkisi yalnız
-- authenticated rolünde.
select
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'messages') as message_policies,
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'blocks') as block_policies,
  has_function_privilege('authenticated', 'public.is_blocked_with(uuid)', 'execute')
    as authenticated_can_execute,
  has_function_privilege('anon', 'public.is_blocked_with(uuid)', 'execute')
    as anon_can_execute;

commit;

-- Mesaj geldiğinde telefona push bildirim.
--
-- NEDEN VERİTABANINDA
-- Bildirimi göndermek için bir yerin "yeni mesaj" olayını duyması gerekiyor.
-- Seçenekler: (a) ayrı bir sunucu, (b) Supabase Edge Function, (c) doğrudan
-- veritabanı tetikleyicisi. (c) seçildi çünkü işletilecek fazladan bir servis
-- doğurmuyor ve mesaj eklemesiyle aynı işlemde tetikleniyor.
--
-- pg_net, isteği eşzamansız kuyruğa atıyor: Expo'nun servisi yavaşsa ya da
-- yanıt vermezse mesaj eklemesi yavaşlamıyor veya geri alınmıyor. Bildirim
-- kaybolabilir ama mesaj her zaman kaydedilir — doğru takas bu, çünkü mesajın
-- kendisi kritik, bildirim değil.

create extension if not exists pg_net;

-- Cihazın Expo push jetonu. Kullanıcı başına tek cihaz destekliyoruz; birden
-- fazla cihaz gerekirse ayrı bir tabloya taşınması gerekir.
alter table public.profiles add column if not exists push_token text;

-- Jeton kişisel veri sayılır ve profiles_public görünümü herkese açık, o yüzden
-- görünüme eklemiyoruz. Kullanıcı kendi satırını zaten güncelleyebiliyor
-- ("users can update own profile" politikası).

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target_token text;
  sender_name text;
  listing_title text;
  preview text;
begin
  if new.receiver_id is null then
    return new;
  end if;

  select push_token into target_token
  from public.profiles
  where id = new.receiver_id;

  -- Bildirim açmamış ya da web'den gelen kullanıcı: yapılacak bir şey yok.
  if target_token is null or target_token = '' then
    return new;
  end if;

  select name into sender_name from public.profiles where id = new.sender_id;
  select title into listing_title from public.listings where id = new.listing_id;

  -- Bildirim gövdesinde mesajın kendisi görünüyor; kullanıcı açmadan ne
  -- olduğunu anlasın. Uzun mesajlar kırpılıyor.
  preview := left(new.text, 120);

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    ),
    body := jsonb_build_object(
      'to', target_token,
      'title', coalesce(sender_name, 'ShesBlej'),
      'subtitle', listing_title,
      'body', preview,
      'sound', 'default',
      'badge', (
        select count(*) from public.messages
        where receiver_id = new.receiver_id and read_at is null
      ),
      'channelId', 'messages',
      -- Kullanıcı bildirime dokunduğunda doğru sohbete gitsin.
      'data', jsonb_build_object(
        'listingId', new.listing_id,
        'other', new.sender_id
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.notify_new_message();

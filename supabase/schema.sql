-- ============================================================
-- KosovaPazar database schema
--
-- HOW TO RUN THIS:
-- 1. Open your Supabase project dashboard
-- 2. Go to SQL Editor (left sidebar) -> New query
-- 3. Paste this entire file and click "Run"
-- 4. After it finishes, sign up for an account on the site once,
--    then come back here and run (replacing the email):
--
--      update public.profiles set is_admin = true
--      where id = (select id from auth.users where email = 'you@example.com');
--
--    That's what makes your account the site admin.
-- ============================================================

-- ---------- Profiles (one row per registered user) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  id_number text,
  birth_date date,
  consent_given boolean not null default false,
  account_type text not null default 'individual' check (account_type in ('individual','business')),
  company_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, id_number, birth_date, consent_given, account_type, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'id_number',
    nullif(new.raw_user_meta_data->>'birth_date','')::date,
    coalesce((new.raw_user_meta_data->>'consent_given')::boolean, false),
    coalesce(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------- Listings ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  category text not null check (category in ('emlak','vasita','esya')),
  subcategory text not null,
  title text not null,
  price numeric not null check (price >= 0),
  city text not null,
  district text,
  map_lat double precision,
  map_lng double precision,
  phone text not null,
  description text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '29 days')
);

alter table public.listings enable row level security;

create policy "active listings are viewable by everyone"
  on public.listings for select
  using (expires_at > now());

create policy "admins can view all listings"
  on public.listings for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "users can insert own listings"
  on public.listings for insert
  with check (auth.uid() = owner_id);

create policy "users can update own listings"
  on public.listings for update
  using (auth.uid() = owner_id);

create policy "users can delete own listings"
  on public.listings for delete
  using (auth.uid() = owner_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create index listings_category_idx on public.listings (category);
create index listings_city_idx on public.listings (city);
create index listings_expires_at_idx on public.listings (expires_at);


-- ---------- Messages (buyer <-> seller, per listing) ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "participants can view their messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "users can send messages as themselves"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create index messages_listing_idx on public.messages (listing_id);


-- ---------- Favorites ----------
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "users manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ---------- Reports ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('fraud','misleading','inappropriate','other')),
  details text,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "users can submit reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "admins can view reports"
  on public.reports for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- ---------- Storage bucket for listing photos ----------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "anyone can view listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "authenticated users can upload listing photos"
  on storage.objects for insert
  with check (bucket_id = 'listing-photos' and auth.role() = 'authenticated');

create policy "users can delete their own uploaded photos"
  on storage.objects for delete
  using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);

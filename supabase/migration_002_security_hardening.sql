-- ============================================================
-- Migration 002: tighten profiles RLS + add email + admin helper
--
-- WHY: the original "profiles are viewable by everyone" policy only
-- restricts ROWS, not COLUMNS — any anonymous API caller could read
-- every user's id_number and birth_date directly. This fixes that,
-- and adds a safe public view for the columns that legitimately need
-- to be public (name, business badge).
-- ============================================================

-- 1) Add email to profiles (needed for the admin members view) + backfill
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, phone, id_number, birth_date, consent_given, account_type, company_name)
  values (
    new.id,
    new.email,
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

-- 2) security-definer helper so admin-check policies don't self-recurse on profiles
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- 3) Replace the "everyone can read everything" policy with row-scoped access
drop policy if exists "profiles are viewable by everyone" on public.profiles;

create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- 4) Public-safe view: only the columns that are meant to be public
--    (listing owner display name, business badge). Runs as the view
--    owner so it intentionally bypasses the tightened RLS above for
--    just these four non-sensitive columns.
create or replace view public.profiles_public as
  select id, name, account_type, company_name from public.profiles;

grant select on public.profiles_public to anon, authenticated;

-- 5) Admins need to see all messages for the admin panel (reports already has this)
create policy "admins can view all messages"
  on public.messages for select
  using (public.is_admin());

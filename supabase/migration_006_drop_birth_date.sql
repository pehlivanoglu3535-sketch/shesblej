-- ============================================================
-- Migration 006: stop storing dates of birth
--
-- Signup no longer asks for a birth date. As with migration 005, the
-- trigger has to be rebuilt BEFORE the column is dropped, or every new
-- signup fails on an insert into a column that no longer exists.
-- ============================================================

-- 1) Rebuild the signup trigger without birth_date
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, phone, consent_given, account_type, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'consent_given')::boolean, false),
    coalesce(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2) Scrub previously collected birth dates from auth metadata
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'birth_date'
where raw_user_meta_data ? 'birth_date';

-- 3) Drop the column itself
alter table public.profiles drop column if exists birth_date;

-- ============================================================
-- Migration 005: stop storing national ID numbers
--
-- The signup form no longer collects an ID number. The trigger must be
-- updated BEFORE dropping the column, otherwise every new signup fails
-- on an insert into a column that no longer exists.
-- ============================================================

-- 1) Rebuild the signup trigger without id_number
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, phone, birth_date, consent_given, account_type, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'birth_date','')::date,
    coalesce((new.raw_user_meta_data->>'consent_given')::boolean, false),
    coalesce(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2) Scrub previously collected ID numbers from auth metadata
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'id_number'
where raw_user_meta_data ? 'id_number';

-- 3) Drop the column itself
alter table public.profiles drop column if exists id_number;

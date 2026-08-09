-- ============================================================
-- Migration 003: paid packages, one-time credits, listing badges,
-- business galleries, testimonials, and blog — feature parity pass
-- with a competitor site the owner asked to match.
--
-- Payments are SIMULATED for now (no real payment processor is
-- connected yet) — purchases are recorded in `orders` with
-- status='simulated' and immediately applied, so the UI and limits
-- work end-to-end and can be wired to a real processor (e.g. Stripe)
-- later without changing the data model.
-- ============================================================

-- ---------- profiles: plan + credits ----------
alter table public.profiles
  add column if not exists plan text not null default 'standard' check (plan in ('standard', 'premium', 'enterprise')),
  add column if not exists plan_expires_at timestamptz,
  add column if not exists credit_extra_listing int not null default 0,
  add column if not exists credit_urgent_tag int not null default 0,
  add column if not exists credit_extra_showcase int not null default 0,
  add column if not exists credit_highlight int not null default 0,
  add column if not exists company_logo_url text;

-- ---------- listings: badges + brand ----------
alter table public.listings
  add column if not exists is_urgent boolean not null default false,
  add column if not exists is_highlighted boolean not null default false,
  add column if not exists uses_showcase boolean not null default false,
  add column if not exists brand text;

create index if not exists listings_brand_idx on public.listings (brand);

-- ---------- orders (purchase history for plans + credits) ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('subscription', 'credit')),
  item text not null,
  quantity int not null default 1 check (quantity > 0),
  amount numeric not null check (amount >= 0),
  status text not null default 'simulated' check (status in ('simulated', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "admins can view all orders"
  on public.orders for select
  using (public.is_admin());

-- ---------- testimonials (real, user-submitted, admin-moderated) ----------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  text text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "approved testimonials are public"
  on public.testimonials for select
  using (approved = true or auth.uid() = user_id or public.is_admin());

create policy "users can submit own testimonial"
  on public.testimonials for insert
  with check (auth.uid() = user_id);

create policy "admins can moderate testimonials"
  on public.testimonials for update
  using (public.is_admin());

create policy "admins can delete testimonials"
  on public.testimonials for delete
  using (public.is_admin());

-- ---------- blog posts (admin-authored) ----------
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  cover_image text,
  published boolean not null default true,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

create policy "published posts are public"
  on public.blog_posts for select
  using (published = true or public.is_admin());

create policy "admins manage posts"
  on public.blog_posts for insert
  with check (public.is_admin());

create policy "admins update posts"
  on public.blog_posts for update
  using (public.is_admin());

create policy "admins delete posts"
  on public.blog_posts for delete
  using (public.is_admin());

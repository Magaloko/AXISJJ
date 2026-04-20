-- Hero Slides: Admin-managed slider content for the Landing Page Hero section
-- Slide types: 'text' (main hero text slide) | 'promo' (image-based promo slide)

create table if not exists public.hero_slides (
    id          uuid primary key default gen_random_uuid(),
    position    smallint not null default 0,
    is_active   boolean not null default true,
    type        text not null check (type in ('text', 'promo')),

  -- Text slide fields
  eyebrow     text,
    headline    text[],               -- array of lines e.g. ['DISCIPLINE.','TECHNIQUE.','PROGRESS.']
  subtext     text,
    subtext2    text,
    address     text,
    cta_primary_label  text,
    cta_primary_href   text,
    cta_secondary_label text,
    cta_secondary_href  text,

  -- Promo slide fields
  image_url   text,
    image_alt   text,
    badge_label text,
    badge_color text default '#ef4444',
    tag_label   text,
    offers      jsonb,                -- array of {label, color, textColor}
  promo_headline text,
    cta_label   text,
    cta_href    text default '/trial',

  created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
  );

-- Seed default slides (mirrors the current hardcoded Hero.tsx)
insert into public.hero_slides (position, is_active, type, eyebrow, headline, subtext, subtext2, address, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href)
values (
    0, true, 'text',
    'Brazilian Jiu-Jitsu Vienna · Since 2020',
    array['DISCIPLINE.', 'TECHNIQUE.', 'PROGRESS.'],
    'Train with Austria''s first Chechen Black Belt — Shamsudin Baisarov.',
    'Trainiere mit Österreichs erstem tschetschenischen Schwarzgurt.',
    'Strindberggasse 1 / R01 · 1110 Wien',
    '1 WOCHE GRATIS →', '/trial',
    'STUNDENPLAN', '#trainingsplan'
  );

insert into public.hero_slides (position, is_active, type, image_url, image_alt, badge_label, badge_color, tag_label, offers, promo_headline, cta_label, cta_href)
values (
    1, true, 'promo',
    '/images/promo-april.jpg',
    'April Promotion – 100€ sparen bei AXIS JIU JITSU',
    'Brazilian Jiu-Jitsu by AXIS',
    '#ef4444',
    'Starte jetzt – nur bis Ende April',
    '[{"label":"100€ SPAREN","bg":"bg-primary","text":"text-white"},{"label":"KEINE ANMELDEGEBÜHR","bg":"bg-yellow-400","text":"text-black"},{"label":"+ Gratis Training","bg":"bg-black/80","text":"text-white"}]',
    'Jetzt starten – sichere dir deinen Platz!',
    '👉 Jetzt anmelden!',
    '/trial'
  );

-- RLS
alter table public.hero_slides enable row level security;

-- Public can read active slides
create policy "hero_slides_public_read" on public.hero_slides
  for select using (is_active = true);

-- Admins can do everything (reuse existing admin check pattern)
create policy "hero_slides_admin_all" on public.hero_slides
  for all using (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    );

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger hero_slides_updated_at
  before update on public.hero_slides
  for each row execute procedure public.touch_updated_at();

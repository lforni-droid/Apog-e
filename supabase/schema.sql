-- ============================================================
--  Apogée — schéma Supabase
--  À coller intégralement dans SQL Editor, puis « Run ».
-- ============================================================

-- ---------- Table des bouteilles ----------
create table if not exists public.bouteilles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade default auth.uid(),
  domaine       text not null,
  cuvee         text,
  appellation   text,
  region        text,
  couleur       text check (couleur in ('rouge','blanc','rosé','champagne','effervescent','doux')),
  cepages       text,
  millesime     int  check (millesime is null or millesime between 1900 and 2100),
  apogee_debut  int,
  apogee_fin    int,
  qte           int  not null default 1 check (qte >= 0),
  prix_achat    numeric(10,2) check (prix_achat is null or prix_achat >= 0),
  prix_estime   numeric(10,2) check (prix_estime is null or prix_estime >= 0),
  emplacement   text,
  notes         text,
  cree_le       timestamptz not null default now()
);

create index if not exists idx_bouteilles_user on public.bouteilles(user_id);

-- ---------- Historique des bouteilles ouvertes ----------
-- La bouteille peut disparaître de la cave : on conserve l'intitulé
-- pour que l'historique reste lisible.
create table if not exists public.degustations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade default auth.uid(),
  bouteille_id  uuid references public.bouteilles(id) on delete set null,
  intitule      text,
  millesime     int,
  ouverte_le    timestamptz not null default now(),
  note          int check (note is null or note between 1 and 5),
  commentaire   text
);

create index if not exists idx_degustations_user on public.degustations(user_id);

-- ============================================================
--  Sécurité par ligne — INDISPENSABLE
--  Sans ces lignes, la clé anon donne accès à toutes les caves.
-- ============================================================

alter table public.bouteilles   enable row level security;
alter table public.degustations enable row level security;

drop policy if exists "cave personnelle" on public.bouteilles;
create policy "cave personnelle" on public.bouteilles
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "historique personnel" on public.degustations;
create policy "historique personnel" on public.degustations
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Vérification ----------
-- Doit renvoyer rowsecurity = true sur les deux tables.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename in ('bouteilles','degustations');

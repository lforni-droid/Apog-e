-- ============================================================
--  Apogée — migration 002 : prix d'achat et estimation
--
--  À exécuter UNIQUEMENT sur une base déjà créée.
--  Sur une base neuve, schema.sql contient déjà ces colonnes.
-- ============================================================

alter table public.bouteilles
  add column if not exists prix_achat  numeric(10,2),
  add column if not exists prix_estime numeric(10,2);

alter table public.bouteilles
  drop constraint if exists bouteilles_prix_achat_check,
  drop constraint if exists bouteilles_prix_estime_check;

alter table public.bouteilles
  add constraint bouteilles_prix_achat_check
    check (prix_achat is null or prix_achat >= 0),
  add constraint bouteilles_prix_estime_check
    check (prix_estime is null or prix_estime >= 0);

-- ---------- Vérification ----------
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'bouteilles'
  and column_name in ('prix_achat','prix_estime');

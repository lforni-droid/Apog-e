-- ============================================================
--  Apogée — migration 001 : catégorie « champagne »
--
--  À exécuter UNIQUEMENT si vous avez déjà créé les tables
--  avec la version précédente de schema.sql.
--  Sur une base neuve, schema.sql contient déjà la catégorie.
-- ============================================================

-- La contrainte est nommée automatiquement par Postgres.
-- On la retrouve, on la supprime, on la recrée élargie.

alter table public.bouteilles
  drop constraint if exists bouteilles_couleur_check;

alter table public.bouteilles
  add constraint bouteilles_couleur_check
  check (couleur in ('rouge','blanc','rosé','champagne','effervescent','doux'));

-- Optionnel : reclasser les champagnes déjà saisis en « effervescent ».
-- Vérifiez d'abord ce que ça touche :
--   select id, domaine, appellation, couleur from public.bouteilles
--   where couleur = 'effervescent';

update public.bouteilles
set couleur = 'champagne'
where couleur = 'effervescent'
  and appellation ilike '%champagne%';

-- ---------- Vérification ----------
select couleur, count(*)
from public.bouteilles
group by couleur
order by couleur;

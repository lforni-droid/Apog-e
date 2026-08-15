# Apogée

Cave à vin personnelle : inventaire par photo d'étiquette, suivi de l'apogée, estimation de valeur, et accord mets-vins limité aux bouteilles réellement en stock.

---

## Ce que fait l'application

- **Rentrer du vin** — photo de l'étiquette, lecture automatique du domaine, de l'appellation, du millésime, des cépages, plus une estimation de la fenêtre d'apogée et du prix. Tout reste modifiable avant enregistrement.
- **Cave** — bandeau de maturité (à attendre / à point / à ouvrir vite), filtres par couleur dont Champagne, recherche, +/− pour les entrées et sorties.
- **Accord** — vous décrivez le plat, la sélection se fait uniquement parmi vos bouteilles, en tenant compte du millésime.
- **Historique** — chaque bouteille ouverte est enregistrée, y compris quand la référence disparaît de la cave.

---

## Marche à suivre

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com). Région Europe (`eu-west-3`).
2. **SQL Editor** → collez tout `supabase/schema.sql` → **Run**.
3. La dernière requête doit renvoyer `rowsecurity = true` sur les deux tables. **Si ce n'est pas le cas, arrêtez-vous** : sans sécurité par ligne, la clé publique donne accès à toutes les caves.
4. **Authentication → Providers** : `Email` activé. Désactivez « Confirm email » pour une connexion en un clic.
5. **Project Settings → API** : copiez `Project URL` et la clé `anon public`.
6. Reportez ces deux valeurs dans `config.js`.

> La clé `anon` est publique par conception, elle peut figurer dans le dépôt. C'est la RLS qui protège les données.

### 2. Clé API Anthropic

Créez une clé sur [console.anthropic.com](https://console.anthropic.com) → **API Keys**.
Elle ne doit figurer **dans aucun fichier du projet** : uniquement dans les variables d'environnement Netlify, étape 4. Dans le HTML, n'importe qui la lirait dans le code source.

### 3. GitHub

```bash
cd apogee
git init
git add .
git commit -m "Apogée — première version"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/apogee.git
git push -u origin main
```

### 4. Netlify

1. **Add new site → Import an existing project** → sélectionnez le dépôt.
2. Build command : vide. Publish directory : `.` (déjà dans `netlify.toml`).
3. **Site configuration → Environment variables** :

   | Nom | Valeur |
   |---|---|
   | `ANTHROPIC_API_KEY` | votre clé Anthropic |
   | `SUPABASE_URL` | l'URL du projet Supabase |
   | `SUPABASE_ANON_KEY` | la clé anon |

4. **Deploy**. Notez l'URL du site.

### 5. Boucler l'authentification

Supabase → **Authentication → URL Configuration** :
- `Site URL` : l'URL Netlify
- `Redirect URLs` : ajoutez la même URL

Sans cela, le lien de connexion reçu par mail renverra vers `localhost`.

### 6. Sur le téléphone

Ouvrez l'URL → **Partager → Sur l'écran d'accueil**.
Apogée s'ouvre en plein écran avec son icône, et « Photographier l'étiquette » déclenche directement l'appareil photo.

---

## Migrations

Les fichiers `migration-*.sql` ne servent **que si vos tables existent déjà** et datent d'une version antérieure. Sur une base neuve, `schema.sql` contient tout : ignorez-les.

| Fichier | Objet |
|---|---|
| `migration-001-champagne.sql` | Ajoute la catégorie Champagne à la contrainte `couleur` |
| `migration-002-prix.sql` | Ajoute les colonnes `prix_achat` et `prix_estime` |

À exécuter dans l'ordre, dans le SQL Editor.

---

## Développement local

```bash
npm install -g netlify-cli
netlify dev
```

Créez un fichier `.env` (déjà ignoré par git) avec `ANTHROPIC_API_KEY`, `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

---

## Structure

```
index.html                        toute l'interface et la logique
config.js                         URL + clé anon Supabase (à remplir)
netlify/functions/ia.js           proxy Anthropic — vérifie la session, garde la clé
netlify.toml                      configuration du déploiement
manifest.json                     installation sur l'écran d'accueil
icone.svg / -192.png / -512.png   le cachet de cire
supabase/schema.sql               tables, contraintes et RLS
supabase/migration-*.sql          évolutions pour bases existantes
```

---

## Coût

Supabase et Netlify : gratuits à cette échelle.
API Anthropic : à l'usage. Une lecture d'étiquette coûte quelques dixièmes de centime. Pour un usage personnel, moins d'un euro par mois.

Si vous ouvrez l'appli à d'autres, ajoutez un plafond de requêtes par utilisateur dans `ia.js` : la vérification de session bloque les inconnus, pas les abus d'un utilisateur légitime.

---

## Deux limites à garder en tête

**Les fenêtres d'apogée sont estimées** par le modèle d'après l'appellation, le cépage et le millésime. C'est une indication de bon sens, pas une donnée de référence.

**Les estimations de prix ne sont pas une cotation.** Le modèle n'a accès ni aux ventes récentes ni à un indice de marché : il restitue un ordre de grandeur appris. Correct sur un bordeaux classé, potentiellement très faux sur un domaine confidentiel ou un millésime rare. À ne jamais utiliser pour une assurance ou une succession — pour cela, iDealwine, Wine-Searcher ou un commissaire-priseur. Les deux champs restent modifiables à la main.

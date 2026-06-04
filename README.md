# DEUTSCHHAUS CV Platform

Plateforme de collecte d'informations élèves et de génération automatique de CV professionnels en PDF + Word modifiable.

## Ce qui est inclus

- Formulaire élève public : `/formulaire`
- Galerie de 20 templates CV modernes
- Sélection automatique du template selon l'objectif et les réponses
- Aperçu CV en direct côté formulaire
- Espace administrateur : `/admin`
- Génération serveur : PDF, DOCX et HTML
- Stockage Supabase privé : `cv-photos`, `cv-files`
- Tables Supabase : `cv_templates`, `cv_submissions`, `cv_generated_files`, `cv_admins`
- Fonctions Netlify :
  - `/api/submit-cv`
  - `/api/generate-cv`
  - `/api/sign-file`

## Variables d'environnement à configurer dans Netlify

```env
VITE_SUPABASE_URL=https://grzilauuglvxzsdvxunj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLIQUE_SUPABASE
SUPABASE_URL=https://grzilauuglvxzsdvxunj.supabase.co
SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLIQUE_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVICE_ROLE_SUPABASE
PUBLIC_SITE_URL=https://votre-site.netlify.app
VITE_INSTITUTE_NAME=DEUTSCHHAUS INSTITUT
```

La clé `SUPABASE_SERVICE_ROLE_KEY` doit rester privée. Ne jamais la mettre dans le frontend.

## Installation locale

```bash
npm install
npm run dev
```

Pour tester avec les fonctions Netlify :

```bash
npm run netlify:dev
```

## Build

```bash
npm run build
```

## Déploiement Netlify

1. Créer un nouveau projet Netlify ou lier ce dossier à un projet existant.
2. Configurer les variables d'environnement ci-dessus.
3. Build command : `npm run build`
4. Publish directory : `dist`
5. Functions directory : `netlify/functions`

## Supabase

La migration principale est déjà présente dans `supabase/migrations`.
Elle crée uniquement des objets préfixés `cv_*` et deux buckets privés. Elle est non destructive.

Projet Supabase utilisé pendant la préparation :

```txt
grzilauuglvxzsdvxunj
https://grzilauuglvxzsdvxunj.supabase.co
```

## Administrateur

La fonction `is_cv_admin()` autorise l'email :

```txt
kpatonoujules@gmail.com
```

Pour utiliser `/admin`, activez l'authentification email OTP/magic link dans Supabase Auth si nécessaire.

## Limites de cette première version

- Le build n'a pas pu être certifié dans l'environnement ChatGPT car `npm install` a expiré ici.
- La clé publique Supabase n'a pas été récupérée automatiquement pour des raisons de sécurité ; ajoutez-la depuis Supabase Dashboard > Project Settings > API Keys.
- Aucun projet Netlify existant n'était visible, donc le code est fourni prêt à déployer au lieu d'être publié directement.

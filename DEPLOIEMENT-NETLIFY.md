# Déploiement Netlify correct

Ce projet doit être envoyé à GitHub avec les fichiers à la racine du dépôt :

- package.json
- index.html
- src/
- shared/
- netlify/
- public/
- netlify.toml

Ne poussez pas un dossier parent contenant `deutschhaus-cv-platform/`, sinon Netlify publiera le mauvais chemin.

Paramètres Netlify :

Build command: `npm run build`
Publish directory: `dist`
Functions directory: `netlify/functions`

Variables requises dans Netlify :

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- PUBLIC_SITE_URL
- VITE_INSTITUTE_NAME

Après déploiement, testez :

- `/` : page d’accueil
- `/formulaire` : formulaire élève
- `/admin` : espace administrateur
- `/diagnostic.html` : diagnostic technique
- `/api/health` : test des fonctions Netlify

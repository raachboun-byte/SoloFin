# HANDOFF MOA → DEV — Sprint 1
**Version 2.0 | 24 mai 2026**
**Statut : ✅ PRÊT À DÉMARRER**

---

## Contexte du projet (lis ceci en premier)

Tu travailles sur **SoloFin**, une application web personnelle de gestion financière pour Rachid Aachboun, consultant IT freelance (TNS Consulting SARL).

L'application permettra à terme de :
- Capturer des justificatifs de dépenses par photo ou upload, avec extraction OCR automatique
- Importer des factures reçues depuis Gmail
- Importer des relevés bancaires depuis Google Drive
- Créer et suivre des factures PDF émises
- Visualiser la trésorerie mensuelle

**Avant de coder, lis ces fichiers dans l'ordre :**
1. `CLAUDE.md` — règles de comportement et stack technique (non révisable sans CR)
2. `STATUS.md` — état actuel du projet
3. Ce fichier — ce que tu dois livrer ce sprint
4. `04_cahier_des_charges_mvp.md` — spécifications fonctionnelles complètes
5. `05_specs_techniques_mvp_v2.md` — stack, BDD, API, sécurité

**Puis commence par ce message :**
> "J'ai lu les fichiers. Sprint 1 — je vais livrer : initialisation du projet + authentification locale. Voici la structure des fichiers que je vais créer : [liste]. Je commence par [quoi]. Des questions avant que je démarre ?"

---

## Objectif du Sprint 1

Mettre en place l'infrastructure de base et l'authentification locale. À l'issue de ce sprint, l'application doit être accessible via navigateur avec un login fonctionnel et sécurisé.

**Ce sprint ne couvre pas encore OAuth Google ni l'OCR — ce sera Sprint 2 et Sprint 3.**

---

## Ce que tu dois livrer

### 1. Structure du projet

Créer l'arborescence complète :

```
solofin/
  frontend/
    src/
      components/
      pages/
        Login.jsx
        Dashboard.jsx   (page vide avec navigation, remplie en Sprint 9)
        Frais.jsx       (page vide, Sprint 3)
        Facturation.jsx (page vide, Sprint 5)
        Tresorerie.jsx  (page vide, Sprint 9)
        Parametres.jsx  (page vide, Sprint 2)
      hooks/
        useAuth.js
      api/
        auth.js
    index.html
    vite.config.js
    tailwind.config.js
    package.json
  backend/
    routes/
      auth.js
    middleware/
      auth.js
    db/
      init.js
    index.js
    package.json
    .env.example
  database/         (dossier vide, gitignored)
  uploads/          (dossier vide, gitignored)
  .gitignore
  README.md
```

### 2. Base de données SQLite

Initialiser le schéma complet dès le Sprint 1 (même si toutes les tables ne sont pas encore utilisées) :

```sql
-- Tables à créer dans db/init.js :
users, sessions, oauth_tokens, clients, factures, depenses, imports_gmail, imports_drive
```

Schéma complet disponible dans `05_specs_techniques_mvp_v2.md` section 5.

Insérer un utilisateur par défaut au premier lancement :
- Email : `r.aachboun@gmail.com`
- Mot de passe : `SoloFin2026!` (hashé bcrypt cout 12)

Insérer le client par défaut (TNS Consulting SARL) dans la table `clients`.

### 3. Backend — Auth locale

**Routes à implémenter :**

`POST /api/auth/login`
- Body : `{ email, password }`
- Vérifie email + bcrypt
- Crée une session (UUID v4, durée 7 jours) dans la table `sessions`
- Pose le cookie httpOnly `session_id`
- Réponse : `{ data: { user: { email } }, error: null }`

`POST /api/auth/logout`
- Supprime la session en base
- Supprime le cookie
- Réponse : `{ data: null, error: null }`

`GET /api/auth/status`
- Retourne le statut de session et (plus tard) OAuth
- Réponse : `{ data: { authenticated: true, email: "...", google_connected: false }, error: null }`

**Middleware `middleware/auth.js` :**
- Vérifie le cookie `session_id`
- Vérifie que la session existe en base et n'est pas expirée
- Protège toutes les routes `/api/*` sauf `/api/auth/login` et `/api/auth/google*`
- Si non authentifié : `401 { data: null, error: "Non authentifié" }`

### 4. Frontend — Page Login

- Formulaire email + mot de passe
- Appel `POST /api/auth/login` via `api/auth.js`
- Redirection vers Dashboard si succès
- Affichage message d'erreur si échec
- Design propre avec Tailwind (centré, épuré)

### 5. Frontend — Layout et navigation

- Layout principal avec barre de navigation latérale (ou top bar) : Dashboard / Notes de frais / Facturation / Trésorerie / Paramètres
- Les pages non encore implémentées affichent `<ComingSoon />` avec le nom de la fonctionnalité
- Bouton "Se déconnecter" dans la navigation
- `useAuth.js` : hook qui vérifie le statut de session au chargement et redirige vers `/login` si non authentifié

---

## Règles techniques obligatoires

- Cookie session : `httpOnly: true`, `sameSite: 'Strict'`, `secure: true` (production)
- Toutes les réponses API : `{ data: ..., error: null }` ou `{ data: null, error: "message" }`
- Commentaires en **français**
- Zéro `console.log` en production (utiliser un logger)
- Le fichier `.env` n'est **jamais commité** — fournir `.env.example`

---

## Variables d'environnement requises

Créer `.env.example` avec :

```bash
NODE_ENV=development
PORT=3001
SESSION_SECRET=change_me_in_production_256bits
DB_PATH=./database/solofin.db
ENCRYPTION_KEY=change_me_in_production_256bits

# Google OAuth (Sprint 2)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Claude API (Sprint 3)
ANTHROPIC_API_KEY=
```

---

## Critères de done — Sprint 1

| # | Critère | Comment vérifier |
|---|---|---|
| D1.1 | `npm run dev` lance frontend (port 5173) + backend (port 3001) sans erreur | Lancer et observer |
| D1.2 | La page Login s'affiche sur `http://localhost:5173` | Naviguer |
| D1.3 | Login avec `r.aachboun@gmail.com` / `SoloFin2026!` fonctionne | Se connecter |
| D1.4 | Redirection automatique vers Dashboard après login | Observer |
| D1.5 | Le cookie `session_id` est httpOnly et présent après login | DevTools → Application → Cookies |
| D1.6 | Accès direct à `/api/depenses` sans session → 401 | Tester avec curl ou Insomnia |
| D1.7 | Déconnexion supprime le cookie et redirige vers Login | Cliquer "Se déconnecter" |
| D1.8 | Toutes les pages hors Login affichent "Coming soon" | Naviguer dans le menu |
| D1.9 | Zéro erreur dans la console Chrome | Inspecter |
| D1.10 | Schéma SQLite complet créé (toutes les tables) | Vérifier avec DB Browser for SQLite |

---

## Ce que tu ne dois PAS faire ce sprint

- OAuth Google → Sprint 2
- OCR → Sprint 3
- Implémentation des pages Frais, Facturation, Trésorerie → Sprints 3–9
- Over-engineering : pas de système de logs complexe, pas de tests unitaires (MVP)
- Fonctionnalités hors périmètre → alerter et attendre une CR validée

---

## Questions à poser avant de démarrer

Si quelque chose n'est pas clair dans ce brief, pose tes questions avant de coder. En particulier :

1. L'adresse du VPS est-elle connue ? (pour configurer les URLs de callback OAuth dès maintenant)
2. Le nom de domaine est-il déjà acheté ?
3. Y a-t-il un projet Google Cloud Console déjà créé ?

---

## Références

- `CLAUDE.md` — Stack technique et règles de comportement (priorité absolue)
- `04_cahier_des_charges_mvp.md` — Spécifications F01 à F07
- `05_specs_techniques_mvp_v2.md` — Schéma BDD, routes API, sécurité
- `PMP_v2.md` — Planning des 10 sprints
- `journal_decisions.md` — Décisions actées (ne pas revenir dessus sans CR)

---

*Document produit par l'Assistant MOA — Session du 24/05/2026*
*Sprint suivant : Sprint 2 — Google OAuth (après validation Sprint 1)*

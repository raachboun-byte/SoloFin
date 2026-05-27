# STATUS.md - SoloFin

Derniere mise a jour : 27 Mai 2026

## Etat general

Phase : V1 — Sprint Sécurité (S14-BIS) — BLOQUANT MISE EN PROD
Sprint en cours : Sprint Sécurité (S14-BIS) — 36 vulnérabilités à corriger (audit 27/05/2026)
Dernier sprint livré : Sprint 13 (Agent IA "Ask SoloFin") ✅

## ⚡ Reprise prochaine session

**Objectif immédiat :** Sprint Sécurité — lire HANDOFF_MOA_TO_DEV.md intégralement avant de coder

**⚠️ ATTENTION :** Ce sprint est obligatoire avant toute mise en prod sur Internet.
Rapport d'audit complet disponible (transmis par Rachid). 2 vulnérabilités critiques CVSS 9.6 et 9.1.

**Lire avant de coder :** STATUS.md → HANDOFF_MOA_TO_DEV.md → CLAUDE.md

## 🔐 Audit sécurité — État des corrections (27/05/2026)

| Item | Description | Statut |
|---|---|---|
| VULN-020 | Credentials retirés de STATUS.md | ✅ Fait |
| VULN-020 | Historique git purgé (git filter-repo --force) | ✅ Fait |
| VULN-020 | Clé Anthropic révoquée et régénérée | ✅ Fait |
| VULN-020 | Secret Google OAuth révoqué et régénéré | ✅ Fait |
| VULN-020 | SESSION_SECRET régénéré | ✅ Fait |
| VULN-020 | ENCRYPTION_KEY régénérée | ✅ Fait |
| P0.1 à P0.14 | Phase 0 — correctifs pré-prod backend | ⏳ À faire (session dev) |
| P0.5.1 à P0.5.4 | Phase 0.5 — hardening DoS | ⏳ À faire |
| P1.1 à P1.9 | Phase 1 — hardening V1 | ⏳ À faire |

**Recette MVP — 11/11 critères validés :**
CR01 Login/logout ✅ | CR02 OCR photo ✅ | CR03 OCR desktop ✅ | CR04 Dépense ✅
CR05 Facture PDF ✅ | CR06 En retard auto ✅ | CR07 Gmail ✅ | CR08 Drive ✅
CR09 Trésorerie ✅ | CR10 Zéro erreur console ✅ | CR11 Mobile ✅

**Commande pour relancer le backend :**
```
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "--env-file=.env", "index.js" -WorkingDirectory "C:\Users\Rachid\Documents\Claude\Projects\SoloFin\solofin\backend" -NoNewWindow
```

**Identifiants SoloFin :** voir .env

## Decisions techniques actées ce sprint

- `node:sqlite` (natif Node.js v24) utilisé à la place de `better-sqlite3`
  (évite la compilation native, API identique)
- Sessions en mémoire (Map) côté backend — suffisant pour usage mono-utilisateur MVP
- Repo GitHub public : https://github.com/raachboun-byte/SoloFin
- Node.js v24 installé sur la machine de dev (Windows)
- PATH Node.js à ajouter en début de session PowerShell :
  $env:PATH = "C:\Program Files\nodejs;" + $env:PATH

## Serveurs de développement

Pour lancer l'app localement :
- Backend  : depuis solofin/backend/  → node index.js  (port 3001)
- Frontend : depuis solofin/frontend/ → npm run dev    (port 5173)
- URL app  : http://localhost:5173
- Identifiants : voir .env

## Décisions techniques Sprint 3

- Routes clients (`/api/clients`) et factures (`/api/factures`) activées dans index.js
- Numéro de facture auto-généré côté backend : format `TNS_CONSULTING-AAAA-MM`
- Calculs HT/TVA/TTC faits côté backend (source de vérité unique)
- taux_tva stocké en décimal (0.20 = 20%) — frontend envoie le pourcentage (20), backend convertit
- PDF généré à la demande via PDFKit, retourné en streaming (`application/pdf`)
- Téléchargement PDF via fetch + Blob URL (cookie de session envoyé automatiquement)

## Ce qui a été livré - Sprint 3

- Backend : `routes/clients.js` — CRUD complet GET/POST/PUT/DELETE `/api/clients`
- Backend : `routes/factures.js` — CRUD complet + génération PDF PDFKit `/api/factures`
  - Création avec numéro auto, calcul HT/TVA/TTC, statut brouillon par défaut
  - Modification et suppression limitées aux factures en statut "brouillon"
  - Route GET `/api/factures/:id/pdf` — PDF avec mentions légales obligatoires
- Frontend : `api/clients.js` — appels fetch avec credentials
- Frontend : `api/factures.js` — appels fetch + helper `telechargerPDF()` (blob URL)
- Frontend : `pages/Facturation.jsx` — page complète :
  - KPIs : Total facturé HT / Encaissé HT / En attente HT
  - Liste des factures avec badge statut coloré, montants HT+TTC, actions PDF/modifier/supprimer
  - Onglets filtre : Toutes / Brouillon / Envoyée / Payée / En retard
  - Modal création/édition facture : numéro auto-généré live, TJM pré-rempli depuis client, aperçu HT/TVA/TTC temps réel
  - Section "Carnet clients" pliable : CRUD clients inline
- Dashboard : import `<Facturation />` remplace le placeholder Sprint 3

## Scope V1 — Change Requests validées

| # | CR | Module | Statut |
|---|---|---|---|
| CR01 | Pièce jointe photo/scan sur note de frais (sans OCR) | Notes de frais | ✅ Livré |
| CR02 | Extraction automatique des champs depuis un PDF texte | Notes de frais | À développer (V2) |

## Décisions techniques Sprint 2

- `googleapis` installé côté backend (OAuth2 + Gmail API + Drive API)
- Tokens Google chiffrés AES-256-CBC avant stockage (clé dérivée de ENCRYPTION_KEY via SHA-256)
- Format de stockage chiffré : `iv_hex:ciphertext_hex`
- Flow OAuth : GET /api/auth/google → consent screen → GET /api/auth/google/callback → stockage → redirect frontend
- La route /api/auth/google/callback redirige vers http://localhost:5173/parametres (dev) — à adapter en prod
- Upsert token Google : un seul enregistrement par user_id (mis à jour si déjà existant)

## Ce qui a été livré - Sprint 2

- Backend : `services/google.js` — client OAuth2, chiffrement/déchiffrement, génération URL, échange de code
- Backend : `routes/auth.js` — GET /api/auth/google, GET /api/auth/google/callback, DELETE /api/auth/google
- Frontend : `pages/Parametres.jsx` — statut connexion Google, bouton connecter/déconnecter
- Frontend : Dashboard NAV étendu avec entrée Paramètres ⚙️

## Ce qui a été livré — Sprint 4

- Frontend : `Frais.jsx` — filtres mois et catégorie sur la liste des dépenses
- Frontend : `Frais.jsx` — accès caméra mobile (bouton "📷 Photo" avec `capture="environment"`) + bouton "📁 Fichier" séparé
- Frontend : `Frais.jsx` — `isDesktop` transmis au modal pour adapter l'UI
- Mois disponibles calculés dynamiquement depuis les données (plus récent en premier)

## Ce qui a été livré — Sprint 3

- Backend : `services/ocr.js` — wrapper Claude Vision API (`claude-sonnet-4-6`), prompt structuré JSON
- Backend : `POST /api/depenses/ocr` (route unifiée) — images → Claude Vision, PDF → regex existant
- Frontend : `api/frais.js` — fonction `ocrFichier()` vers le nouvel endpoint
- Frontend : `Frais.jsx` — OCR déclenché pour JPG, PNG et PDF (plus seulement PDF)
- Le formulaire se pré-remplit automatiquement après analyse (date, montant, fournisseur, catégorie)

## Décisions techniques Sprint 3

- Modèle OCR : `claude-sonnet-4-6` (le plus récent au 24/05/2026)
- Route `/ocr` route avant `/:id` dans Express pour éviter la capture paramétrique
- Stratégie duale : images → Claude Vision (précision), PDF → regex pdf-parse (rapide, sans coût API)
- Erreur API (clé manquante, quota) → retour `{}` silencieux, formulaire reste vide à saisir manuellement

## Prérequis pour tester Sprint 2

1. Créer un projet Google Cloud Console (console.cloud.google.com)
2. Activer Gmail API + Google Drive API
3. Créer des identifiants OAuth 2.0 → Application Web
4. Ajouter l'URI de redirection autorisée : `http://localhost:3001/api/auth/google/callback`
5. Créer `solofin/backend/.env` à partir de `.env.example` avec :
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `ENCRYPTION_KEY=<chaîne aléatoire 32+ caractères>`
6. Redémarrer le backend

## Ce qui a été livré — Sprint 7

- Backend : `services/extraction-pdf.js` — `extraireChamps()` et `extraireDepuisPDF(buffer)` (partagé frais + gmail)
- Backend : `services/gmail.js` — `scannerEmails(userId, jours)` + `telechargerPieceJointe(userId, msgId, attachmentId)`
- Backend : `routes/gmail.js` — `POST /api/gmail/scan`, `POST /api/gmail/import`, `GET /api/gmail/historique`
- Frontend : `api/gmail.js` — `scannerGmail()`, `importerGmail()`, `historiqueGmail()`
- Frontend : `pages/GmailImport.jsx` — scan Gmail + sélection + import + déduplication visuelle
- Dashboard : entrée "📧 Gmail" dans la navigation (sidebar + drawer + nav basse)

## Ce qui a été livré — Sprint 8

- Backend : `services/drive.js` — wrapper Drive API v3 (liste fichiers, téléchargement, parser relevés bancaires)
- Backend : `routes/drive.js` — GET /api/drive/files, POST /api/drive/parse, POST /api/drive/import, POST /api/drive/import-consultation, GET /api/drive/imports
- Frontend : `api/drive.js` — fonctions fetch listerFichiersDrive, parserFichierDrive, importerTransactions, importerConsultation, historiqueImports
- Frontend : `pages/DriveImport.jsx` — navigateur arborescence Drive, breadcrumb, parsing PDF, tableau transactions avec checkboxes, import sélectif, historique
- Dashboard : entrée "📁 Drive" dans la navigation (sidebar + drawer + nav basse)

## Ce qui a été livré — Sprint 9

- Backend : `routes/tresorerie.js` — GET /api/tresorerie?mois=YYYY-MM : factures payées + dépenses du mois, calculs entrées/sorties/solde/TVA nette
- Frontend : `api/tresorerie.js` — getTresorerie(mois)
- Frontend : `pages/Tresorerie.jsx` — navigation mois (‹/›/Ce mois), 6 KPIs (entrées HT, sorties TTC, solde, TVA collectée, TVA déductible, TVA nette), sections dépliables factures + dépenses, note indicative TVA
- Frontend : `pages/Dashboard.jsx` — synthèse complète : 4 KPIs (CA, Encaissé, En attente, TVA à reverser), graphique barres 6 mois activité mensuelle, liste 5 dernières factures, bannière alerte factures en retard, CTAs "Nouvelle facture" / "Ajouter une dépense"

## Blocages actifs

Aucun blocage actif.

## Historique des sprints

| Sprint | Objectif | Statut |
|---|---|---|
| Sprint 1 | Infrastructure + Auth | ✅ Terminé |
| Sprint 2 | Notes de frais | ✅ Terminé |
| Sprint 3 | Facturation - création | ✅ Terminé |
| Sprint 4 | Facturation - suivi | ✅ Terminé |
| Sprint 5 | Tresorerie | ✅ Terminé |
| Sprint 6 | Polish + tests | ✅ Terminé |
| Sprint 7 | Import Gmail | ✅ Terminé |
| Sprint 8 | Import Drive | ✅ Terminé |
| Sprint 9 | Trésorerie + Dashboard | ✅ Terminé |
| Sprint 10 | Recette + Production | 🔄 En cours |

## Ce qui a été livré - Sprint 2

- Backend : `routes/frais.js` — CRUD complet GET/POST/PUT/DELETE `/api/depenses`
- Frontend : `api/frais.js` — appels fetch avec credentials
- Frontend : `pages/Frais.jsx` — page Notes de frais alignée maquette (hero navy, KPIs, liste, modal formulaire, aperçu HT/TVA/TTC temps réel)
- Dashboard : placeholder Sprint 2 remplacé par la vraie page `<Frais />`

## Ce qui a été livré - Sprint 1

- Structure solofin/frontend + solofin/backend + solofin/database
- Frontend : React 18 + Vite + Tailwind CSS v4 + polices Lato / Source Sans 3
- Backend : Node.js + Express port 3001
- Base de données : SQLite via node:sqlite natif, tables créées (users, clients, factures, depenses)
- Compte admin : voir .env
- Auth : login/logout/me, cookie httpOnly, middleware de session
- Pages : Login (design navy/orange), Dashboard (topbar + drawer + nav basse)
- Design aligné sur compta-independant.jsx (maquette de référence)

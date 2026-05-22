# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Lis ce fichier en entier avant d'ecrire la moindre ligne de code.

## Premiere action obligatoire a chaque session

Avant de coder, lis ces fichiers dans l'ordre :

1. STATUS.md - etat du projet, sprint en cours, blocages
2. HANDOFF_MOA_TO_DEV.md - ce que tu dois livrer ce sprint
3. 04_cahier_des_charges_mvp.md - specification fonctionnelle
4. 05_specs_techniques_mvp_solofin_v1.2.docx - stack, BDD, API, securite
5. journal_decisions.md - decisions actees (creer si absent, ne pas revenir dessus sans CR)

Puis commence par ce message :

'J ai lu les fichiers. Sprint [X] - je vais livrer [F0X + F0Y]. Voici la structure des fichiers que je vais creer : [liste]. Je commence par [quoi]. Des questions avant que je demarre ?'

## Identite du projet

Projet : SoloFin
Client : TNS Consulting SARL
SIRET : 809 419 468 00016
TVA : FR89 809419468
Facturation : 1 facture/mois, TJM x jours, 1 client actif
Support : Laptop, Chrome derniere version

## Stack technique - Decisions non revisables sans CR

Frontend : React 18 + Vite + Tailwind CSS
Backend : Node.js + Express port 3001
Base de donnees : SQLite + better-sqlite3
Auth MVP : Login local email + bcrypt cout 12
PDF : PDFKit
Reverse proxy : Nginx
Process manager : PM2
HTTPS : Let's Encrypt + Certbot
Hebergement : VPS Ubuntu 22.04 LTS

ATTENTION : Google OAuth est reporte en V2. Ne pas implementer en MVP.

## Structure du projet

```
solofin/
  frontend/          # React 18 + Vite + Tailwind
    src/
      components/    # Composants UI reutilisables
      pages/         # Pages : Login, Dashboard, Frais, Facturation, Tresorerie
      hooks/         # Hooks personnalises
      api/           # Appels axios vers le backend
    index.html
    vite.config.js
  backend/           # Node.js + Express
    routes/          # frais.js, factures.js, clients.js, tresorerie.js, auth.js
    middleware/      # auth.js (verif session)
    db/              # init.js (schema SQLite)
    index.js         # point d'entree Express port 3001
  database/          # solofin.db (fichier SQLite, gitignore)
```

## Commandes de developpement

```bash
# Depuis solofin/frontend/
npm run dev          # Vite dev server (port 5173 par defaut)
npm run build        # Build de production

# Depuis solofin/backend/
npm run dev          # nodemon index.js
npm start            # node index.js (production)

# Depuis solofin/ (racine, si workspace npm configure)
npm run dev          # Lance frontend + backend en parallele
```

## Conventions API

- Toutes les routes backend sont prefixees `/api`
- Auth : cookie httpOnly `session_id`, verifie par middleware sur toutes les routes `/api/*` sauf `/api/auth/login`
- Reponses : `{ data: ..., error: null }` ou `{ data: null, error: "message" }`
- Codes HTTP : 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error

## Schema base de donnees (cibles MVP)

Tables : `users`, `clients`, `factures`, `lignes_facture`, `depenses`

Statuts facture : `brouillon` | `envoyee` | `payee` | `en_retard`

Format numero facture : `TNS_CONSULTING-AAAA-MM`

## Perimetre MVP strict (5 fonctionnalites)

1. Notes de frais - saisie manuelle (montant, categorie, date, description)
2. Facturation - creation facture PDF (client, prestation, montant, TVA)
3. Facturation - suivi statut : Brouillon / Envoyee / Payee / En retard
4. Tresorerie - vue mensuelle entrees/sorties
5. Interface - app web responsive + authentification locale

## Hors scope MVP

- Multi-utilisateurs
- Mobile natif iOS/Android
- Logiciel comptable certifie
- CRM / gestion prospects
- Paiement en ligne (Stripe)
- Open banking
- Google OAuth (V2), Gmail/Drive (V3)

## Regles de comportement

- Tu livres exactement ce qui est dans HANDOFF_MOA_TO_DEV.md, rien de plus
- Tu ne sur-construis pas
- Toute fonctionnalite hors perimetre = tu alertes et attends une CR validee
- Toute decision technique structurante = tu proposes, tu attends validation
- Tu commentes le code en francais
- Critere de done : fonctionne sur Chrome desktop, zero erreur console

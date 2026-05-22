# STATUS.md - SoloFin

Derniere mise a jour : Mai 2026

## Etat general

Phase : Développement MVP
Sprint en cours : 1 (terminé ✅)
Prochain sprint : Sprint 2 - Notes de frais

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
- Identifiants : admin@solofin.local / solofin2026

## Blocages actifs

Aucun blocage actif.

## Historique des sprints

| Sprint | Objectif | Statut |
|---|---|---|
| Sprint 1 | Infrastructure + Auth | ✅ Terminé |
| Sprint 2 | Notes de frais | A demarrer |
| Sprint 3 | Facturation - creation | En attente |
| Sprint 4 | Facturation - suivi | En attente |
| Sprint 5 | Tresorerie | En attente |
| Sprint 6 | Polish + tests | En attente |

## Ce qui a été livré - Sprint 1

- Structure solofin/frontend + solofin/backend + solofin/database
- Frontend : React 18 + Vite + Tailwind CSS v4 + polices Lato / Source Sans 3
- Backend : Node.js + Express port 3001
- Base de données : SQLite via node:sqlite natif, tables créées (users, clients, factures, depenses)
- Compte admin : admin@solofin.local / solofin2026
- Auth : login/logout/me, cookie httpOnly, middleware de session
- Pages : Login (design navy/orange), Dashboard (topbar + drawer + nav basse)
- Design aligné sur compta-independant.jsx (maquette de référence)

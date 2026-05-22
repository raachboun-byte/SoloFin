# STATUS.md - SoloFin

Derniere mise a jour : Mai 2026

## Etat general

Phase : Développement MVP
Sprint en cours : 1 (terminé)
Prochain sprint : Sprint 2 - Notes de frais

## Decisions techniques actées ce sprint

- `node:sqlite` (natif Node.js v24) utilisé à la place de `better-sqlite3`
  (évite la compilation native, API identique)
- Sessions en mémoire (Map) côté backend — suffisant pour usage mono-utilisateur MVP

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

- Structure `solofin/frontend` + `solofin/backend` + `solofin/database`
- Frontend : React 18 + Vite + Tailwind CSS v4
- Backend : Node.js + Express port 3001
- Base de données : SQLite via `node:sqlite`, tables créées (users, clients, factures, depenses)
- Compte admin créé : `admin@solofin.local` / `solofin2026`
- Auth : login/logout/me, cookie httpOnly, middleware de session
- Pages : Login, Dashboard (vide)
- Proxy Vite → backend configuré

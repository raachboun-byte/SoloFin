# HANDOFF MOA -> DEV - Sprint 1

Date : Mai 2026
Statut : PRET A DEMARRER

## Objectif du sprint

Mettre en place l'infrastructure de base et l'authentification locale.
A l'issue de ce sprint, l'application doit etre accessible via navigateur avec un login fonctionnel.

## Fonctionnalites a livrer

### F01 - Infrastructure projet

- Initialiser le projet React 18 + Vite + Tailwind CSS
- Initialiser le backend Node.js + Express (port 3001)
- Configurer SQLite + better-sqlite3
- Mettre en place la structure de dossiers

Structure attendue :
solofin/
  frontend/   (React + Vite)
  backend/    (Node.js + Express)
  database/   (fichier SQLite)

### F02 - Authentification locale

- Page de login (email + mot de passe)
- Hash bcrypt cout 12
- Session via cookie httpOnly
- Route protegee : redirect vers login si non authentifie
- Un seul utilisateur : admin@solofin.local

## Criteres d'acceptance

- npm run dev lance l'app sans erreur
- Page login s'affiche sur Chrome
- Login correct -> acces dashboard vide
- Login incorrect -> message d'erreur
- Refresh page -> session maintenue
- Zero erreur dans la console Chrome

## Hors scope ce sprint

Tout le reste. Ne pas commencer les modules metier avant validation F01 et F02.
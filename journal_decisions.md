# Journal des décisions — SoloFin

## Sprint 1 — Mai 2026

| # | Décision | Raison | Statut |
|---|---|---|---|
| D01 | `node:sqlite` natif à la place de `better-sqlite3` | Évite la compilation native sur Windows, API identique | Acté |
| D02 | Sessions en mémoire (Map) côté backend | Suffisant pour usage mono-utilisateur MVP, pas de dépendance session store | Acté |
| D03 | Tailwind CSS v4 via `@tailwindcss/vite` | Nouvelle API, pas de tailwind.config.js, import direct dans CSS | Acté |

## Sprint 2 — Mai 2026

| # | Décision | Raison | Statut |
|---|---|---|---|
| D04 | `fetch` natif côté frontend (pas axios) | Cohérence avec `api/auth.js`, pas de dépendance supplémentaire, proxy Vite suffit | Acté |
| D05 | Calcul montant_ht et tva_deductible côté backend | Source de vérité unique, évite les incohérences si le frontend change | Acté |
| D06 | URL relatives `/api/…` côté frontend | Le proxy Vite redirige vers le backend, pas de CORS à gérer en dev | Acté |

## Change Requests V1 — Mai 2026

| # | CR | Fonctionnalité | Périmètre | Statut |
|---|---|---|---|---|
| CR01 | Pièce jointe photo/scan sur note de frais | V1 — Module Notes de frais | Validée |
| CR02 | Extraction automatique des champs depuis un PDF texte | V2 — Module Notes de frais | Validée |

**CR02 — Détail :**
- Déclenché à la sélection d'un PDF dans le champ Reçu
- Extraction du texte brut via `pdf-parse` (PDF texte sélectionnable uniquement — pas de scan image)
- Pré-remplissage automatique des champs : Fournisseur, Montant TTC, Date
- L'utilisateur voit les valeurs extraites pré-remplies et peut les corriger avant de sauvegarder
- Si l'extraction échoue (PDF scanné, texte illisible) : saisie manuelle sans message d'erreur bloquant
- OCR pour PDF scannés → hors scope (V3)

---

**CR01 — Détail :**
- L'utilisateur peut joindre une photo ou un scan (JPG, PNG, PDF) à une note de frais lors de la saisie ou en modification
- La saisie reste manuelle (pas d'OCR — OCR repoussé V2)
- Stockage du fichier sur le serveur (chemin en BDD), taille max à définir en specs techniques V1
- Affichage : icône "voir reçu" dans la liste des dépenses, ouverture dans un nouvel onglet
- Suppression de la pièce jointe possible sans supprimer la dépense

---

## Sprint 4 — Mai 2026

| # | Décision | Raison | Statut |
|---|---|---|---|
| D12 | Deux inputs distincts sur mobile : `capture="environment"` pour la caméra + input standard pour galerie/PDF | `capture` seul force la caméra et empêche la sélection depuis la galerie — deux inputs donnent le choix | Acté |
| D13 | Détection mobile par prop `isDesktop` (transmise depuis Dashboard) | Cohérence avec le pattern existant du projet, évite un `window.innerWidth` dans le modal | Acté |
| D14 | Filtres mois/catégorie en combobox plutôt qu'en pills | Plus compact sur mobile, natif navigateur, accessible | Acté |

## Sprint 7 — Mai 2026

| # | Décision | Raison | Statut |
|---|---|---|---|
| D15 | `extraireChamps` extrait de `frais.js` → `services/extraction-pdf.js` | Réutilisation dans `gmail.js` sans duplication, `frais.js` reste fonctionnel | Acté |
| D16 | OCR Gmail : regex `pdf-parse` uniquement (pas Claude Vision) | Les PDF reçus par email sont quasi toujours texte sélectionnable — sans coût API | Acté |
| D17 | Déduplication par `gmail_msg_id` (UNIQUE en BDD) | Garantit qu'un email ne peut être importé deux fois, peu importe l'interface | Acté |
| D18 | Import en deux temps : scan (metadata) puis import (OCR + dépense) | Évite N appels PDF parse au scan — l'OCR ne se fait qu'à la confirmation | Acté |

## Sprint 8 — Mai 2026

| # | Décision | Raison | Statut |
|---|---|---|---|
| D19 | Parsing relevés bancaires via regex (2 patterns) | Évite un appel Claude Vision coûteux sur des PDF texte — si < 3 lignes trouvées, bascule en mode consultation | Acté |
| D20 | Import Drive : débits uniquement → dépenses ; crédits ignorés | Les entrées d'argent sont déjà trackées via le module Facturation (factures payées) | Acté |
| D21 | Déduplication par `drive_file_id` (UNIQUE en BDD) | Garantit qu'un fichier Drive ne peut être importé deux fois | Acté |
| D22 | Mode consultation pour formats non reconnus | Si le parser ne trouve pas ≥ 3 transactions, le document est stocké sans extraction plutôt que de bloquer l'utilisateur | Acté |

## Sprint 3 — Mai 2026

| # | Décision | Raison | Statut |
|---|---|---|---|
| D07 | Numéro de facture auto-généré côté backend (`TNS_CONSULTING-AAAA-MM`) | Non modifiable par l'utilisateur, cohérence garantie, unicité vérifiée en BDD | Acté |
| D08 | `taux_tva` stocké en décimal (0.20) dans la BDD | Cohérence avec les calculs mathématiques, frontend envoie le % et le backend convertit | Acté |
| D09 | PDF généré à la demande (streaming PDFKit → response) | Pas de stockage disque, pas de gestion de fichiers temporaires, plus simple en MVP | Acté |
| D10 | Téléchargement PDF via `fetch` + Blob URL côté frontend | Permet d'envoyer le cookie de session httpOnly, impossible avec une balise `<a href>` directe sur route protégée | Acté |
| D11 | Modification/suppression de facture limitée au statut `brouillon` | Règle métier cahier des charges : une facture envoyée/payée ne peut plus être modifiée | Acté |

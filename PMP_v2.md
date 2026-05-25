# Plan de Management de Projet — SoloFin
**Document MOA | Version 2.0 | 24 mai 2026**
**Statut : ✅ VALIDÉ — Rachid Aachboun — 24/05/2026**
**Remplace :** 03_plan_management_projet_solofin.md (planning 6 semaines MVP initial)

---

## 1. Présentation du projet

| Champ | Détail |
|---|---|
| **Nom du projet** | SoloFin |
| **Porteur / Product Owner** | Rachid Aachboun (TNS Consulting SARL) |
| **Assistant MOA** | Claude (Anthropic) — sessions Cowork |
| **Développeur** | Claude (Anthropic) — sessions Claude Code |
| **Date de démarrage** | Mai 2026 |
| **Horizon MVP révisé** | 10 semaines (août 2026) |
| **Budget total** | < 1 500 € sur 6 mois (MVP + V1) |

---

## 2. Méthode de gestion de projet

Approche **hybride** :
- **Cycle en V allégé** pour la documentation (CDC, Specs, PMP) — structure avant de coder
- **Scrum simplifié** pour la réalisation — sprints hebdomadaires, feedback continu

### Rôles

| Rôle | Qui | Responsabilités |
|---|---|---|
| Product Owner | Rachid | Valide les livrables, décide des priorités, crée les CR |
| Assistant MOA | Claude (Cowork) | Rédige la documentation, cadre les besoins, prépare les briefs |
| Développeur | Claude (Code) | Réalise les sprints sur la base des HANDOFF |

### Règles de gouvernance

- Toute nouvelle fonctionnalité hors périmètre = **Change Request** obligatoire avant développement
- Toute décision technique structurante = proposée par le développeur, validée par le PO
- Le code est commenté en français
- Critère de done : fonctionne sur Chrome desktop, zéro erreur console

---

## 3. Lotissement global

| Version | Semaines | Période estimée | Objectif |
|---|---|---|---|
| **MVP** | 1–10 | Juin – Août 2026 | Outil complet : OCR, OAuth, Gmail, Drive, Facturation, Trésorerie |
| **V1** | 11–20 | Août – Oct. 2026 | Factur-X, exports, rapport TVA, alertes, rapprochement bancaire |
| **V2** | 21–30 | Oct. 2026 – Jan. 2027 | Automatisations, tableau de bord de pilotage |

### Critère de passage MVP → V1

- Toutes les fonctionnalités F01 à F07 livrées et testées
- 11 critères de recette validés (CR01 à CR11)
- Zéro bug bloquant en production
- CDC V1 rédigé et validé
- Utilisé en conditions réelles au moins 2 semaines

---

## 4. Planning MVP — 10 sprints hebdomadaires

### Vue d'ensemble

| Sprint | Semaine | Fonctionnalités livrées |
|---|---|---|
| S1 | Sem. 1 | Initialisation projet + Auth locale (F01 partiel) |
| S2 | Sem. 2 | Google OAuth + stockage tokens (F01 complet) |
| S3 | Sem. 3 | OCR upload desktop (F02 partiel) |
| S4 | Sem. 4 | OCR photo smartphone + formulaire validation (F02 complet) |
| S5 | Sem. 5 | Facturation création PDF + mentions légales (F03 partiel) |
| S6 | Sem. 6 | Suivi statut factures + passage automatique "En retard" (F03 complet) |
| S7 | Sem. 7 | Import Gmail : scan + détection + prévisualisation (F04) |
| S8 | Sem. 8 | Import Drive : navigation + parsing relevés + déclarations (F05) |
| S9 | Sem. 9 | Trésorerie mensuelle + graphique + dashboard (F06 + F07) |
| S10 | Sem. 10 | Recette complète + corrections + mise en production |

---

### Sprint 1 — Initialisation + Auth locale

**Objectif :** Projet initialisé, structure en place, login/logout fonctionnel.

**Livrables :**
- Structure du projet (`solofin/frontend/`, `solofin/backend/`, `solofin/database/`)
- Schéma SQLite initialisé (tables : users, sessions, clients, factures, depenses)
- Route `POST /api/auth/login` fonctionnelle
- Route `POST /api/auth/logout` fonctionnelle
- Middleware de vérification session sur toutes les routes `/api/*`
- Page Login (React) fonctionnelle
- Redirection automatique si session invalide

**Critère de done :** Se connecter avec l'email/password, naviguer, se déconnecter → aucune erreur console.

---

### Sprint 2 — Google OAuth

**Objectif :** L'utilisateur peut connecter son compte Google et autoriser Gmail + Drive.

**Livrables :**
- Configuration Google Cloud Console (projet, credentials, scopes)
- Route `GET /api/auth/google` — initie le flow OAuth
- Route `GET /api/auth/google/callback` — reçoit le code, échange les tokens
- Stockage sécurisé des tokens (table `oauth_tokens`, chiffrement AES-256)
- Route `DELETE /api/auth/google` — révocation
- Route `GET /api/auth/status` — retourne l'état OAuth
- Page Paramètres (React) : affiche statut OAuth, bouton connecter/déconnecter Google

**Critère de done :** Connexion Google → consentement → tokens stockés → statut "Connecté" affiché.

---

### Sprint 3 — OCR upload desktop

**Objectif :** Uploader un fichier (JPG, PNG, PDF) et extraire les données par OCR.

**Livrables :**
- Route `POST /api/depenses/ocr` — reçoit le fichier, appelle Claude Vision API, retourne le JSON extrait
- Service `ocr.js` — wrapper Claude Vision API avec prompt structuré
- Stockage du fichier hors webroot (`/uploads/`)
- Page Frais (React) : composant upload + affichage formulaire pré-rempli
- Formulaire de dépense : tous les champs (montant, date, fournisseur, catégorie, description)
- Route `POST /api/depenses` — enregistrement après validation

**Critère de done :** Uploader une facture PDF → formulaire pré-rempli avec montant + date + fournisseur → valider → dépense enregistrée dans la liste.

---

### Sprint 4 — OCR photo smartphone

**Objectif :** Prendre une photo depuis le smartphone et déclencher l'OCR.

**Livrables :**
- Interface mobile responsive (Tailwind breakpoints)
- Accès caméra depuis le navigateur mobile (`<input type="file" accept="image/*" capture="environment">`)
- Même flow OCR que Sprint 3 (réutilisation du service)
- Affichage adapté mobile du formulaire de validation
- Liste des dépenses responsive avec filtres mois / catégorie
- Fonctions modification et suppression d'une dépense

**Critère de done :** Sur smartphone Chrome → prendre photo ticket → formulaire pré-rempli → valider → dépense dans la liste.

---

### Sprint 5 — Facturation : création et PDF

**Objectif :** Créer une facture et générer son PDF avec mentions légales.

**Livrables :**
- Route `POST /api/factures` — créer une facture
- Route `GET /api/factures/:id/pdf` — générer et servir le PDF
- Service `pdf.js` — template PDFKit avec : numéro, client, prestation, HT, TVA, TTC, mentions légales SIRET/TVA/pénalités
- Calcul automatique numéro (`TNS_CONSULTING-AAAA-MM`)
- Calcul automatique montant HT = nb_jours × TJM
- Calcul automatique TVA 20%
- Page Facturation (React) : formulaire création, téléchargement PDF

**Critère de done :** Créer une facture → PDF téléchargeable → mentions légales complètes → numéro auto-incrémenté.

---

### Sprint 6 — Facturation : suivi des statuts

**Objectif :** Gérer le cycle de vie des factures et le passage automatique "En retard".

**Livrables :**
- Routes `PATCH /api/factures/:id/statut`, `PUT /api/factures/:id`, `DELETE /api/factures/:id`
- Job PM2 (cron quotidien) : passage automatique `envoyee` → `en_retard` si échéance dépassée
- Liste des factures avec filtres statut et année
- Indicateurs visuels de statut (couleurs)
- Blocage modification/suppression si statut ≠ brouillon

**Critère de done :** Changer le statut manuellement, vérifier le blocage modification, vérifier le passage automatique "En retard".

---

### Sprint 7 — Import Gmail

**Objectif :** Scanner Gmail et importer les factures détectées.

**Livrables :**
- Service `gmail.js` — wrapper Gmail API v1 (scan emails, téléchargement pièces jointes)
- Route `POST /api/gmail/scan` — scan sur N jours, retourne la liste des factures détectées
- OCR des pièces jointes PDF via service `ocr.js`
- Route `POST /api/gmail/import` — import sélectif avec déduplication
- Table `imports_gmail` — historique et tracking
- Page GmailImport (React) : bouton scan, liste résultats, cases à cocher, confirmation import

**Critère de done :** Scan Gmail → liste de factures détectées → sélection → import → dépenses créées → pas de doublon possible.

---

### Sprint 8 — Import Drive

**Objectif :** Naviguer dans Drive, importer relevés bancaires et déclarations.

**Livrables :**
- Service `drive.js` — wrapper Drive API v3 (liste fichiers, téléchargement)
- Route `GET /api/drive/files` — navigation arborescence
- Route `POST /api/drive/parse` — parsing PDF (OCR lignes de transaction)
- Route `POST /api/drive/import` — import après validation
- Table `imports_drive`
- Page DriveImport (React) : navigateur Drive, prévisualisation, tableau de validation des transactions

**Critère de done :** Naviguer Drive → sélectionner relevé bancaire PDF → tableau des transactions → valider ligne par ligne → enregistré en trésorerie.

---

### Sprint 9 — Trésorerie + Dashboard

**Objectif :** Vue mensuelle des flux et dashboard de synthèse.

**Livrables :**
- Route `GET /api/tresorerie` — entrées/sorties du mois
- Route `GET /api/tresorerie/historique` — 12 mois glissants
- Page Trésorerie (React) : sélecteur mois, KPIs (entrées, sorties, solde), graphique barres, liste mouvements, encadré "À encaisser"
- Page Dashboard (React) : résumé mois en cours, 5 dernières dépenses, factures en attente

**Critère de done :** Vue trésorerie cohérente avec les données saisies, graphique 12 mois, dashboard à jour.

---

### Sprint 10 — Recette et mise en production

**Objectif :** Valider les 11 critères de recette et déployer en production.

**Livrables :**
- Passage de tous les critères CR01 à CR11
- Correction des bugs identifiés en recette
- Configuration Nginx HTTPS (Let's Encrypt)
- Déploiement PM2 (frontend build + backend)
- Backup SQLite automatique (cron quotidien)
- Documentation de déploiement (README)

**Critère de done :** Application accessible en HTTPS, zéro erreur console, 11 critères de recette validés.

---

## 5. Gestion des risques MVP

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| OCR imprécis sur tickets froissés | Élevée | Moyen | Formulaire pré-rempli + validation obligatoire |
| Validation Google OAuth consent screen | Faible | Faible | Usage personnel → mode test suffisant |
| Parsing relevés bancaires fragile | Moyenne | Moyen | Validation ligne par ligne, stockage en consultation si échec |
| Dépassement planning (10 sem.) | Moyenne | Moyen | Réduire scope Sprint 10 si nécessaire (recette partielle) |
| Coût API Claude Vision | Très faible | Très faible | < 0,35 $/mois estimé |

---

## 6. Budget MVP estimé

| Poste | Coût estimé |
|---|---|
| VPS Ubuntu 22.04 (6 mois) | 30–60 € |
| Nom de domaine | 10–15 € |
| Claude API (OCR) — 6 mois | < 25 € |
| Google Cloud Platform | Gratuit (quotas suffisants pour usage personnel) |
| Let's Encrypt | Gratuit |
| **Total estimé MVP** | **< 100 €** |

Marge disponible pour V1 : ~1 400 €.

---

## 7. Tableau des livrables documentaires

| Document | Version | Statut |
|---|---|---|
| Fiche Idée | 1.0 | ✅ Validé |
| Note de Cadrage | 1.0 | ✅ Validé |
| PMP | 2.0 | ✅ Validé |
| Recadrage Vision | 1.1 | ✅ Validé |
| CDC MVP | 2.0 | ✅ Validé |
| Specs Techniques MVP | 2.0 | ✅ Validé |
| Journal des décisions | En cours | 🔄 À mettre à jour |
| HANDOFF Sprint 1 | 1.0 | 🔄 À rédiger |
| Plan de tests MVP | — | 📋 À rédiger (avant Sprint 10) |
| CDC V1 | — | 📋 À rédiger (avant fin MVP) |

---

*Document produit par l'Assistant MOA — Session du 24/05/2026*

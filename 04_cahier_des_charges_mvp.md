# Cahier des Charges — SoloFin MVP
**Document MOA | Version 2.0 | 24 mai 2026**
**Statut : ✅ VALIDÉ — Rachid Aachboun — 24/05/2026**
**Remplace :** CDC MVP v1.0 (périmètre saisie manuelle uniquement)

---

## 1. Présentation du projet

### 1.1 Contexte

Rachid Aachboun est consultant IT indépendant, gérant de TNS Consulting SARL (SIRET : 809 419 468 00016, TVA : FR89 809419468). Il émet une facture par mois à son client, enregistre ses dépenses professionnelles et doit suivre sa trésorerie.

La gestion financière actuelle est fragmentée : tickets en vrac, factures reçues par email, relevés dans Google Drive, saisies manuelles laborieuses. L'objectif est de centraliser et automatiser.

### 1.2 Objectif du MVP

Livrer un **assistant financier personnel automatisé** qui capture les justificatifs depuis toutes les sources (photo, upload, Gmail, Drive), extrait les données par OCR, et produit une vue consolidée des dépenses, factures et trésorerie.

### 1.3 Critère de succès

> L'outil est utilisé 3 fois par semaine sans y être forcé, pendant 30 jours consécutifs.

### 1.4 Contraintes générales

- Usage strictement personnel (1 utilisateur)
- Support : Chrome dernière version, laptop + smartphone
- Hébergement : VPS Ubuntu 22.04 LTS
- Budget MVP : < 800 € (dans l'enveloppe globale de 1 500 € sur 6 mois)
- Délai : 10 semaines

---

## 2. Périmètre MVP — 7 fonctionnalités

### F01 — Authentification

**Objectif :** Sécuriser l'accès à l'application et connecter les services Google.

**Exigences fonctionnelles :**

- EF01.1 — Login local par email + mot de passe (hashé bcrypt, cookie httpOnly)
- EF01.2 — Connexion Google OAuth 2.0 pour autoriser l'accès à Gmail et Drive en lecture seule
- EF01.3 — Les tokens Google sont stockés côté serveur, jamais exposés au frontend
- EF01.4 — Déconnexion (session locale + révocation token Google)
- EF01.5 — Redirection automatique vers login si session expirée

**Règles métier :**
- L'accès à F04 (Gmail) et F05 (Drive) est conditionné à la connexion Google OAuth
- Les scopes demandés sont strictement limités à `gmail.readonly` et `drive.readonly`

**Hors scope F01 :** Création de compte, réinitialisation de mot de passe, 2FA

---

### F02 — Notes de frais avec OCR

**Objectif :** Capturer et enregistrer les dépenses professionnelles avec extraction automatique des données.

**Exigences fonctionnelles :**

- EF02.1 — Upload d'un fichier depuis desktop (formats acceptés : JPG, PNG, PDF, max 10 Mo)
- EF02.2 — Prise de photo depuis smartphone (accès caméra via interface mobile responsive)
- EF02.3 — Extraction automatique OCR des champs suivants :
  - Montant TTC
  - Date de la dépense
  - Nom du fournisseur / émetteur
  - Catégorie suggérée (voir liste ci-dessous)
- EF02.4 — Présentation d'un formulaire pré-rempli avec les données extraites, modifiable avant enregistrement
- EF02.5 — **Aucun enregistrement automatique** : la validation manuelle est obligatoire
- EF02.6 — Champs du formulaire de dépense :
  - Montant (€, requis)
  - Date (requis)
  - Fournisseur (requis)
  - Catégorie (liste déroulante, requis)
  - Description libre (optionnel)
  - Justificatif attaché (fichier ou photo, stocké côté serveur)
- EF02.7 — Catégories disponibles : Repas, Transport, Hébergement, Télécom, Matériel, Carburant, Autre
- EF02.8 — Liste des dépenses avec filtres par mois et par catégorie
- EF02.9 — Modification et suppression d'une dépense existante

**Règles métier :**
- Si l'OCR échoue ou ne trouve pas un champ, le champ reste vide (pas de valeur inventée)
- Le justificatif original (image ou PDF) est conservé et consultable depuis la liste

**Hors scope F02 :** Remboursement de notes de frais, workflow de validation, OCR multi-pages avancé

---

### F03 — Facturation (émission)

**Objectif :** Créer et gérer les factures émises par TNS Consulting SARL.

**Exigences fonctionnelles :**

- EF03.1 — Création d'une facture avec les champs :
  - Numéro auto-généré (format : `TNS_CONSULTING-AAAA-MM`)
  - Date d'émission
  - Client (pré-rempli : données TNS Consulting SARL)
  - Désignation de la prestation
  - Nombre de jours et TJM (calcul automatique du montant HT)
  - TVA 20% (calcul automatique)
  - Montant TTC
  - Date d'échéance (30 jours par défaut)
- EF03.2 — Génération d'un PDF de la facture (format A4, mise en page professionnelle)
- EF03.3 — Le PDF intègre les mentions légales obligatoires (SIRET, TVA intracommunautaire, pénalités de retard)
- EF03.4 — Suivi du statut de chaque facture :
  - `Brouillon` → `Envoyée` → `Payée`
  - `En retard` (passage automatique si date d'échéance dépassée et statut = Envoyée)
- EF03.5 — Téléchargement du PDF depuis l'interface
- EF03.6 — Liste des factures avec filtres par statut et par année
- EF03.7 — Modification possible uniquement si statut = Brouillon
- EF03.8 — Suppression possible uniquement si statut = Brouillon

**Règles métier :**
- Une seule facture par mois (numérotation unique `AAAA-MM`)
- Le passage en statut `En retard` est déclenché automatiquement à minuit si échéance dépassée
- Format PDF MVP : PDF simple (PDFKit). Migration Factur-X planifiée en V1 (obligation légale sept. 2027)

**Hors scope F03 :** Envoi par email depuis l'app, relances automatiques, avoir / note de crédit, multi-clients actifs

---

### F04 — Import automatique depuis Gmail

**Objectif :** Détecter et importer les factures reçues par email comme dépenses.

**Exigences fonctionnelles :**

- EF04.1 — Accès Gmail en lecture seule via OAuth (`gmail.readonly`)
- EF04.2 — Scan des emails des 30 derniers jours par défaut (paramétrable)
- EF04.3 — Détection des emails contenant des factures (pièces jointes PDF avec mots-clés : facture, invoice, reçu, receipt)
- EF04.4 — Extraction OCR des pièces jointes PDF détectées :
  - Montant
  - Date
  - Émetteur
- EF04.5 — Présentation de la liste des factures détectées avec prévisualisation
- EF04.6 — Sélection manuelle des factures à importer (case à cocher)
- EF04.7 — **Aucun import automatique** : confirmation obligatoire avant enregistrement dans les dépenses
- EF04.8 — Historique des imports Gmail (date de scan, nombre de factures détectées / importées)
- EF04.9 — Indicateur visuel des emails déjà importés (pour éviter les doublons)

**Règles métier :**
- Un email déjà importé ne peut pas être importé une seconde fois (contrôle sur l'ID de l'email Gmail)
- Les emails personnels non professionnels ne sont pas filtrés automatiquement — c'est l'utilisateur qui choisit

**Hors scope F04 :** Scan automatique périodique (V2), envoi d'emails depuis l'app, accès aux emails non lus uniquement

---

### F05 — Import depuis Google Drive

**Objectif :** Lire et importer les relevés bancaires et documents financiers stockés sur Drive.

**Exigences fonctionnelles :**

- EF05.1 — Accès Drive en lecture seule via OAuth (`drive.readonly`)
- EF05.2 — Navigation dans l'arborescence Drive de l'utilisateur depuis l'interface
- EF05.3 — Import de relevés bancaires PDF :
  - Extraction des lignes de transactions (date, libellé, montant débit/crédit)
  - Présentation sous forme de tableau avant import
  - Validation ligne par ligne avant enregistrement dans la trésorerie
- EF05.4 — Import de déclarations de résultat PDF :
  - Extraction et affichage structuré des données clés
  - Stockage du document dans l'application pour consultation
- EF05.5 — Prévisualisation du document Drive avant import
- EF05.6 — Historique des documents importés depuis Drive

**Règles métier :**
- Le parsing de relevés bancaires est semi-automatique : l'utilisateur valide chaque transaction avant enregistrement
- En cas d'échec de parsing (format bancaire non reconnu), le document est stocké en consultation uniquement, sans extraction

**Hors scope F05 :** Écriture sur Drive, suppression de fichiers Drive, synchronisation automatique (V2)

---

### F06 — Trésorerie

**Objectif :** Visualiser les flux financiers mensuels (entrées et sorties).

**Exigences fonctionnelles :**

- EF06.1 — Vue mensuelle avec :
  - Total des entrées (factures au statut Payée)
  - Total des sorties (dépenses enregistrées)
  - Solde net du mois
- EF06.2 — Sélecteur de mois (navigation mois par mois)
- EF06.3 — Historique sur 12 mois glissants
- EF06.4 — Graphique en barres : entrées vs sorties par mois (12 mois)
- EF06.5 — Détail des mouvements du mois sélectionné (liste des dépenses + factures)

**Règles métier :**
- Une facture n'apparaît en "entrée" que si son statut est `Payée`
- Les factures `Envoyée` ou `En retard` apparaissent dans un encadré séparé "À encaisser"

**Hors scope F06 :** Prévisionnel, rapprochement bancaire automatique (V1), export (V1)

---

### F07 — Interface générale et Dashboard

**Objectif :** Fournir une interface claire, rapide et utilisable sur laptop et smartphone.

**Exigences fonctionnelles :**

- EF07.1 — Dashboard avec résumé du mois en cours :
  - Chiffre d'affaires encaissé
  - Total des dépenses
  - Solde net
  - Factures en attente de paiement
  - Dernières dépenses enregistrées (5 dernières)
- EF07.2 — Navigation principale : Dashboard / Notes de frais / Facturation / Trésorerie / Paramètres
- EF07.3 — Interface responsive : fonctionne sur Chrome desktop (1920×1080) et smartphone (375px minimum)
- EF07.4 — Temps de chargement des pages < 2 secondes
- EF07.5 — Zéro erreur dans la console Chrome en usage normal
- EF07.6 — Page Paramètres : affichage du statut de connexion Google OAuth, bouton de déconnexion Google

**Hors scope F07 :** Mode hors ligne, PWA, notifications push, thème sombre

---

## 3. Exigences non fonctionnelles

### Sécurité

- ENF01 — Authentification par cookie httpOnly, SameSite=Strict, Secure
- ENF02 — Toutes les routes `/api/*` (sauf `/api/auth/login`) protégées par middleware de vérification de session
- ENF03 — Les tokens OAuth Google sont stockés côté serveur dans un champ chiffré
- ENF04 — HTTPS obligatoire (Let's Encrypt + Certbot)
- ENF05 — Les fichiers justificatifs uploadés sont stockés hors webroot, non accessibles directement par URL

### Performance

- ENF06 — L'OCR d'un justificatif (image standard) doit retourner un résultat en moins de 5 secondes
- ENF07 — Le scan Gmail (30 jours) doit se compléter en moins de 30 secondes

### Disponibilité

- ENF08 — L'application est accessible 24h/24 via VPS (PM2 + Nginx)
- ENF09 — Les données sont sauvegardées quotidiennement (backup SQLite)

---

## 4. Hors scope MVP (strict)

| Fonctionnalité | Version cible |
|---|---|
| Factur-X (facturation électronique) | V1 (sem. 11–20) |
| Export CSV / Excel des dépenses | V1 |
| Rapport TVA mensuel | V1 |
| Rapprochement bancaire automatisé | V1 |
| Alertes (facture en retard, TVA) | V1 |
| Scan Gmail automatique périodique | V2 |
| Tableau de bord de pilotage (TJM, projection) | V2 |
| Multi-utilisateurs | Décision reportée (CR obligatoire) |
| Mobile natif iOS/Android | Hors scope global |
| Logiciel comptable certifié / FEC | Hors scope global |
| Paiement en ligne (Stripe) | Hors scope global |

---

## 5. Critères de recette MVP

| # | Critère | Comment vérifier |
|---|---|---|
| CR01 | Login / logout fonctionnel | Se connecter, naviguer, se déconnecter |
| CR02 | OCR photo smartphone extrait montant + date | Prendre en photo un ticket, vérifier le formulaire pré-rempli |
| CR03 | OCR upload desktop fonctionne sur PDF et image | Uploader une facture PDF, vérifier l'extraction |
| CR04 | Dépense enregistrée après validation manuelle | Vérifier présence dans la liste avec justificatif |
| CR05 | Facture PDF générée avec mentions légales complètes | Créer une facture, télécharger le PDF, vérifier le contenu |
| CR06 | Passage automatique en statut "En retard" | Créer une facture avec échéance passée, vérifier le statut |
| CR07 | Import Gmail : factures détectées et importables | Connecter OAuth, scanner, sélectionner, importer |
| CR08 | Import Drive : relevé bancaire extrait et validable | Naviguer Drive, sélectionner relevé, valider les transactions |
| CR09 | Vue trésorerie mensuelle correcte | Vérifier cohérence entrées/sorties avec les données saisies |
| CR10 | Zéro erreur console Chrome | Naviguer toutes les pages, inspecter la console |
| CR11 | Interface utilisable sur smartphone | Tester toutes les fonctions sur mobile Chrome |

---

## 6. Références

- `recadrage_vision_solofin.md` — Vision et décisions de recadrage (v1.1, validé 24/05/2026)
- `05_specs_techniques_mvp_v2.md` — Stack technique et architecture
- `PMP_v2.md` — Planning et sprints
- `HANDOFF_MOA_TO_DEV.md` — Brief Sprint 1 pour Claude développeur

---

*Document produit par l'Assistant MOA — Session du 24/05/2026*

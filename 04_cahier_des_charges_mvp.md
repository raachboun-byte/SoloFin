# Cahier des Charges — MVP SoloFin

> *Document de référence pour la phase de réalisation MVP. Toute évolution de périmètre nécessite une Change Request validée.*
> *Dernière mise à jour : Mai 2026*

---

## 1. Contexte et objectif du MVP

### 1.1 Rappel du projet

SoloFin est une application web personnelle de gestion financière développée par et pour un freelance IT en SARL, avec l'aide de Claude (IA) comme développeur. Elle remplace un ensemble d'outils disparates (Excel, PDF manuels, boîte mail).

### 1.2 Objectif du MVP

Disposer d'un outil fonctionnel utilisé en conditions réelles, couvrant le cycle minimal de facturation et de suivi financier d'une activité freelance IT.

**Critère de succès MVP :** Utilisé 3 fois par semaine sans y être forcé pendant 30 jours consécutifs.

### 1.3 Profil utilisateur unique

| Champ | Détail |
|---|---|
| Statut juridique | SARL |
| Régime TVA | Assujetti, collecteur TVA 20% |
| Raison sociale | TNS Consulting |
| Mode de facturation | 1 facture par mois, en fin de mois |
| Base de calcul | TJM × nombre de jours effectués |
| Nombre de clients simultanés | 1 client actif par mission |
| Volume notes de frais | 10 à 40 tickets par mois |
| Type de reçus | Papier (majoritaire) et dématérialisés |
| Support d'utilisation | Laptop (usage principal) |
| Authentification | Compte Google uniquement (OAuth) |

---

## 2. Périmètre MVP

### 2.1 Fonctionnalités incluses — les 5 modules

| # | Module | Intitulé |
|---|---|---|
| F01 | Notes de frais | Saisie manuelle d'une dépense |
| F02 | Facturation | Création d'une facture |
| F03 | Facturation | Suivi des statuts de facture |
| F04 | Trésorerie | Vue mensuelle entrées / sorties / solde |
| F05 | Interface | Application web responsive, authentification Google |

### 2.2 Hors scope MVP (et global)

- OCR et reconnaissance automatique de reçus (→ V1)
- Workflow devis → bon de commande → facture (→ V1)
- Relances automatiques (→ V1)
- Exports CSV / PDF pour expert-comptable (→ V1)
- Tableau de bord annuel et KPIs (→ V1)
- Prévisionnel de trésorerie (→ V1)
- Intégrations Gmail / Google Drive (→ V3)
- Application mobile native iOS / Android
- Multi-utilisateurs / multi-entreprises
- Logiciel comptable certifié
- CRM / gestion de prospects
- Paiement en ligne (Stripe, GoCardless)
- Connexion bancaire directe (open banking)

---

## 3. Exigences fonctionnelles détaillées

### F01 — Notes de frais : saisie manuelle

**Description :** L'utilisateur saisit manuellement une dépense professionnelle depuis un reçu papier ou dématérialisé.

**Champs obligatoires :**

| Champ | Type | Règle |
|---|---|---|
| Date | Date | Obligatoire — format JJ/MM/AAAA |
| Fournisseur | Texte | Obligatoire — 100 caractères max |
| Montant TTC | Nombre décimal | Obligatoire — positif, 2 décimales |
| Taux de TVA | Liste | Obligatoire — valeurs : 20%, 10%, 5,5%, 0% |
| Catégorie | Liste | Obligatoire — voir liste ci-dessous |
| Description | Texte | Optionnel — 250 caractères max |

**Catégories de dépenses (MVP) :**
- Transport / Déplacement
- Repas / Restaurant
- Matériel informatique
- Logiciel / Abonnement
- Hébergement
- Télécom
- Autre

**Calculs automatiques :**
- Montant HT = Montant TTC / (1 + taux TVA)
- TVA déductible = Montant TTC − Montant HT

**Actions disponibles :**
- Ajouter une dépense
- Modifier une dépense existante
- Supprimer une dépense
- Lister toutes les dépenses (ordre chronologique inverse)

**Règles métier :**
- Le montant HT et la TVA déductible sont calculés automatiquement, non saisissables
- Une dépense supprimée est définitivement effacée (pas de corbeille MVP)
- Pas de pièce jointe en MVP (scan de reçu → V1)

---

### F02 — Facturation : création d'une facture

**Description :** L'utilisateur crée une facture mensuelle basée sur un TJM et un nombre de jours effectués.

**Champs obligatoires :**

| Champ | Type | Règle |
|---|---|---|
| Numéro de facture | Texte | Auto-généré — format `TNS_CONSULTING-AAAA-MM` |
| Client | Liste | Obligatoire — sélection depuis carnet clients |
| Mois de prestation | Mois/Année | Obligatoire |
| Nombre de jours | Nombre décimal | Obligatoire — ex : 17,5 |
| TJM (€ HT) | Nombre entier | Obligatoire — récupéré depuis la fiche client |
| Taux de TVA | Liste | Obligatoire — défaut : 20% |
| Date d'émission | Date | Obligatoire — défaut : date du jour |
| Date d'échéance | Date | Obligatoire — défaut : J+30 |

**Calculs automatiques :**
- Montant HT = Nombre de jours × TJM
- TVA = Montant HT × taux TVA
- Montant TTC = Montant HT + TVA

**Carnet clients — champs par fiche client :**

| Champ | Type | Règle |
|---|---|---|
| Raison sociale | Texte | Obligatoire |
| Adresse complète | Texte | Obligatoire (mention légale facture) |
| SIRET | Texte | Optionnel |
| TJM contractuel (€ HT) | Nombre | Obligatoire — pré-rempli à la création de facture |

**Génération PDF :**
- La facture générée doit contenir toutes les mentions légales obligatoires (voir section 5)
- Format : PDF téléchargeable
- Le PDF est généré à la demande, pas automatiquement

**Actions disponibles :**
- Créer une facture
- Modifier une facture (statut Brouillon uniquement)
- Supprimer une facture (statut Brouillon uniquement)
- Générer le PDF
- Ajouter / modifier / supprimer un client

**Règles métier :**
- Le numéro de facture est auto-généré et non modifiable
- Une facture dont le statut est Envoyée, Payée ou En retard ne peut plus être modifiée ni supprimée
- Le TJM est stocké dans la fiche client et pré-rempli à la création — modifiable manuellement si besoin

---

### F03 — Facturation : suivi des statuts

**Description :** L'utilisateur suit l'état de paiement de chaque facture.

**Statuts disponibles :**

| Statut | Description | Transition possible vers |
|---|---|---|
| Brouillon | Facture créée, non envoyée | Envoyée, Supprimée |
| Envoyée | Facture transmise au client | Payée, En retard |
| Payée | Règlement reçu | — (statut final) |
| En retard | Date d'échéance dépassée, non payée | Payée |

**Règles de transition :**
- Brouillon → Envoyée : action manuelle de l'utilisateur
- Envoyée → En retard : automatique si date d'échéance dépassée et statut = Envoyée
- Tout statut → Payée : action manuelle de l'utilisateur
- En retard → Payée : action manuelle de l'utilisateur

**Affichage :**
- Liste de toutes les factures avec statut visible en couleur
- Filtrage par statut (Toutes / Brouillon / Envoyée / Payée / En retard)
- Tri par date d'émission (ordre inverse par défaut)

**Indicateurs calculés (visibles sur la liste) :**
- Total facturé HT (hors Brouillons)
- Total encaissé HT (statut Payée uniquement)
- Total en attente HT (statut Envoyée + En retard)

---

### F04 — Trésorerie : vue mensuelle

**Description :** L'utilisateur consulte une synthèse financière mensuelle de son activité.

**Contenu de la vue mensuelle :**

| Ligne | Calcul | Source |
|---|---|---|
| Entrées HT | Somme des factures Payées du mois | Module Facturation |
| Sorties TTC | Somme des dépenses du mois | Module Notes de frais |
| Solde estimé | Entrées HT − Sorties TTC | Calculé |
| TVA collectée | Somme TVA factures Payées du mois | Module Facturation |
| TVA déductible | Somme TVA dépenses du mois | Module Notes de frais |
| TVA nette estimée | TVA collectée − TVA déductible | Calculé |

**Navigation temporelle :**
- Sélecteur mois/année
- Mois précédent / mois suivant
- Mois en cours affiché par défaut
- Accès aux mois passés depuis le démarrage de l'outil

**Règles métier :**
- Seules les factures au statut Payée alimentent les entrées du mois
- Les factures Envoyées et En retard ne sont pas comptées dans les entrées (pas encore encaissées)
- La TVA nette est une estimation indicative, non certifiée
- Aucune projection future en MVP (→ V1)

---

### F05 — Interface et authentification

**Description :** L'application est accessible via navigateur web, sécurisée par authentification Google.

**Authentification :**
- Connexion via compte Google (OAuth 2.0)
- Utilisateur unique — pas de gestion de rôles
- Session persistante (rester connecté)
- Déconnexion manuelle disponible

**Interface :**
- Application web responsive — optimisée laptop, fonctionnelle sur tablette
- Navigation principale : Notes de frais / Facturation / Trésorerie
- Langue de l'interface : Français
- Pas de mode sombre requis en MVP (→ V2)

**Performances :**
- Chargement initial < 3 secondes sur connexion standard
- Pas d'exigence de disponibilité (usage personnel, hébergement local MVP)

---

## 4. Exigences non fonctionnelles

| Catégorie | Exigence | Priorité |
|---|---|---|
| Sécurité | Authentification OAuth Google obligatoire | Bloquante |
| Données | Données stockées localement en MVP | Obligatoire |
| Sauvegarde | Export manuel des données (JSON ou CSV) | Souhaitable MVP |
| Navigateur | Compatible Chrome (dernier) | Obligatoire |
| Langue | Interface et code en français | Obligatoire |
| Accessibilité | Non requise en MVP | — |

---

## 5. Mentions légales obligatoires sur les factures

Conformément à la réglementation française, chaque facture générée doit obligatoirement comporter :

- Numéro de facture (séquentiel, sans rupture)
- Date d'émission
- Raison sociale et adresse de l'émetteur (TNS Consulting)
- SIRET de l'émetteur : 809 419 468 00016
- Numéro TVA intracommunautaire : FR89 809419468
- Raison sociale et adresse du client
- Description de la prestation
- Mois de prestation
- Quantité (nombre de jours) et prix unitaire HT (TJM)
- Montant HT
- Taux et montant de TVA
- Montant TTC
- Date d'échéance de paiement
- Conditions de pénalités de retard (mention obligatoire)
- Mention « TVA acquittée sur les débits » ou « sur les encaissements » selon le régime

---

## 6. Critères d'acceptance par fonctionnalité

| Fonctionnalité | Critère d'acceptance |
|---|---|
| F01 — Saisie dépense | Je saisis une dépense en moins de 60 secondes, elle apparaît dans la liste et dans la trésorerie du mois |
| F02 — Création facture | Je crée une facture mensuelle en moins de 2 minutes, le PDF généré est conforme aux mentions légales |
| F03 — Suivi statuts | Je change le statut d'une facture en 1 clic, la trésorerie se met à jour immédiatement |
| F04 — Trésorerie | J'accède à la vue du mois en cours en moins de 2 clics, les chiffres sont cohérents avec mes factures et dépenses |
| F05 — Auth Google | Je me connecte avec mon compte Google, ma session est maintenue entre deux visites |

---

## 7. Hors scope — rappel synthétique

Toute demande portant sur les éléments ci-dessous doit faire l'objet d'une Change Request avant tout développement :

- Scan / OCR de reçus
- Devis et bons de commande
- Relances automatiques
- Exports comptables
- Intégrations Google (Gmail, Drive)
- Tableau de bord annuel
- Prévisionnel
- Multi-utilisateurs
- Paiement en ligne
- Open banking

---

## 8. Questions ouvertes et décisions à prendre

| # | Question | Impact | À décider avant |
|---|---|---|---|
| Q1 | Stack technique (frontend / backend / BDD) | Specs techniques (05) | Sprint 1 |
| Q2 | Hébergement MVP : local uniquement ou Vercel ? | Specs techniques (05) | Sprint 1 |
| Q3 | Gestion des pénalités de retard : mention fixe ou paramétrable ? | F02 | Sprint 2 |
| Q4 | Export données MVP : oui ou non, quel format ? | F05 | Sprint 1 |

---

*Document vivant — à mettre à jour à chaque fin de sprint si une décision modifie le périmètre.*
*Prochaine étape : Spécifications techniques MVP (livrable 05)*

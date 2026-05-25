# Recadrage de Vision — SoloFin
**Document MOA | Version 1.1 | 24 mai 2026**
**Statut : ✅ VALIDÉ — Rachid Aachboun — 24/05/2026**

---

## 1. Contexte du recadrage

Lors de la session du 24 mai 2026, le Product Owner a précisé la vision centrale du projet qui diffère significativement du MVP tel que documenté initialement.

**Déclencheur :** La fonctionnalité OCR (lecture automatique des justificatifs par photo) et les intégrations Gmail / Google Drive sont en réalité le cœur de l'outil, et non des améliorations futures.

Ce document acte le recadrage et sert de référence pour la mise à jour du Cahier des Charges, des Specs Techniques et du PMP.

---

## 2. Nouvelle vision centrale

> **SoloFin est un assistant financier automatisé pour freelance IT qui capture, lit et consolide les justificatifs financiers (tickets, factures, relevés) depuis toutes les sources — photo, upload, Gmail, Google Drive — pour produire une vue claire des dépenses, factures et trésorerie.**

### Ce que l'outil doit faire naturellement

- **Capturer** un ticket de caisse en le prenant en photo depuis le smartphone
- **Lire automatiquement** les informations (montant, date, fournisseur, catégorie) par OCR
- **Accéder à Gmail** pour détecter et importer les factures reçues (opérateur téléphonique, péages, fournisseurs...)
- **Accéder à Google Drive** pour lire les relevés bancaires PDF et les déclarations de résultat
- **Consolider** toutes ces données dans une vue trésorerie et des rapports

### Ce que l'outil ne fait PAS (hors scope global)

- Multi-utilisateurs *(décision reportée — à réévaluer selon évolution du projet, voir D-RC-08)*
- Logiciel comptable certifié / FEC
- Paiement en ligne (Stripe)
- CRM / gestion prospects
- Mobile natif iOS/Android

---

## 3. Lotissement révisé

### Vue d'ensemble

| Version | Horizon | Objectif |
|---|---|---|
| **MVP révisé** | Semaines 1–10 | Outil complet avec OCR, OAuth, Gmail, Drive |
| **V1** | Semaines 11–20 | Rapports fiscaux, exports comptables, alertes |
| **V2** | Semaines 21–30 | Automatisations avancées, tableaux de bord |

> **Note :** Le MVP initial était planifié sur 6 semaines sans intégrations externes. Le MVP révisé intègre des composants structurants (OAuth, OCR, APIs Google) qui justifient un allongement à 10 semaines.

---

### MVP révisé — Périmètre détaillé (Semaines 1–10)

#### F01 — Authentification

- Login local email / mot de passe (bcrypt, cookie httpOnly)
- Connexion Google OAuth 2.0 (accès Gmail + Drive en lecture)
- Interface de déconnexion

#### F02 — Notes de frais avec OCR

- **Upload fichier** depuis desktop (image JPG/PNG ou PDF)
- **Photo depuis smartphone** (interface mobile responsive + accès caméra)
- **Extraction automatique OCR** : montant, date, fournisseur, catégorie (via Claude Vision API ou Google Cloud Vision)
- Formulaire pré-rempli à valider / corriger avant enregistrement
- Catégories : Repas, Transport, Hébergement, Télécom, Matériel, Autre
- Liste des dépenses avec filtres (mois, catégorie)
- Suppression / modification

#### F03 — Facturation (émission)

- Création d'une facture PDF (client TNS Consulting SARL, prestation, montant HT, TVA 20%)
- Format numéro : `TNS_CONSULTING-AAAA-MM`
- Suivi statut : Brouillon / Envoyée / Payée / En retard
- Téléchargement PDF
- Liste des factures avec filtres

> **Note réglementaire :** Le format PDF simple (PDFKit) est conforme jusqu'en septembre 2027. La migration vers **Factur-X** (PDF enrichi de données XML, norme EN 16931) est planifiée en V1 pour anticiper l'obligation légale de facturation électronique applicable aux TPE/indépendants à partir du 1er septembre 2027. Voir D-RC-09.

#### F04 — Import automatique depuis Gmail

- Connexion Gmail via OAuth (lecture seule, scope `gmail.readonly`)
- Détection des factures reçues (SFR, opérateurs, péages, fournisseurs courants)
- Extraction des données clés (montant, date, émetteur) depuis les pièces jointes PDF
- Proposition d'import dans les dépenses (avec validation manuelle avant enregistrement)
- Historique des imports Gmail

#### F05 — Import depuis Google Drive

- Connexion Drive via OAuth (lecture seule, scope `drive.readonly`)
- Navigation dans les dossiers Drive de l'utilisateur
- Import de relevés bancaires PDF → extraction des lignes de transactions
- Import de déclarations de résultat PDF → lecture et affichage structuré
- Validation manuelle avant enregistrement dans la base

#### F06 — Trésorerie

- Vue mensuelle entrées / sorties (factures payées vs dépenses)
- Solde net du mois
- Historique sur 12 mois glissants
- Graphique simplifié (barres mensuelles)

#### F07 — Interface générale

- Application web responsive (Chrome desktop + mobile)
- Dashboard : résumé du mois en cours (chiffre d'affaires, dépenses, solde)
- Navigation : Dashboard / Notes de frais / Facturation / Trésorerie / Paramètres

---

### V1 — Périmètre cible (Semaines 11–20)

- **Factur-X** : migration du format facture de PDF simple vers PDF/A-3 + XML embarqué (norme EN 16931), en anticipation de l'obligation légale du 1er septembre 2027
- Export des dépenses en CSV / Excel
- Rapport TVA mensuel (TVA collectée vs TVA déductible)
- Rapprochement bancaire assisté (relevé Drive vs dépenses saisies)
- Alertes : facture en retard, TVA à déclarer
- Export comptable simplifié (liste des charges par catégorie)

---

### V2 — Périmètre cible (Semaines 21–30)

- Automatisation des imports Gmail (scan périodique)
- Tableau de bord de pilotage (TJM moyen, taux d'activité, projection annuelle)
- Catégorisation automatique des dépenses par apprentissage

---

## 4. Analyse des risques techniques — MVP révisé

### Risque 1 — Précision de l'OCR ⚠️ ÉLEVÉ

| | |
|---|---|
| **Description** | L'OCR peut mal lire des montants ou dates sur des tickets froissés, écrits à la main, ou en mauvaise qualité photo |
| **Impact** | Données erronées enregistrées sans que l'utilisateur le remarque |
| **Mitigation** | Toujours présenter un formulaire pré-rempli à valider avant enregistrement. Ne jamais enregistrer automatiquement sans confirmation. |
| **Outil recommandé** | Claude Vision API (meilleure précision sur documents) ou Google Cloud Vision (alternative) |

### Risque 2 — Validation Google OAuth (consent screen) ⚠️ MOYEN

| | |
|---|---|
| **Description** | Une application Google OAuth avec accès Gmail + Drive doit passer par une vérification Google si elle sort du mode "test" |
| **Impact** | En mode test : max 100 utilisateurs, pas de problème pour usage personnel. Pour un usage solo = aucun problème. |
| **Mitigation** | Rester en mode "test" pour un usage personnel. Si publication : soumettre à vérification Google (délai 4–6 semaines). |
| **Décision actée** | Usage personnel uniquement → mode test suffisant, pas de vérification nécessaire |

### Risque 3 — Parsing des relevés bancaires PDF ⚠️ MOYEN

| | |
|---|---|
| **Description** | Les relevés PDF des banques varient selon l'établissement. Le parsing automatique peut être fragile. |
| **Impact** | Transactions manquantes ou mal interprétées dans la vue trésorerie |
| **Mitigation** | Import semi-automatique avec validation ligne par ligne. Prévoir une interface de correction. |

### Risque 4 — Coût API OCR 🟢 FAIBLE

| | |
|---|---|
| **Description** | Google Cloud Vision : ~1,50$/1000 images. Pour un usage personnel (≈30–50 reçus/mois), coût mensuel < 0,10$. |
| **Impact** | Négligeable |
| **Mitigation** | Aucune nécessaire. Surveiller si usage augmente. |

---

## 5. Décisions actées lors du recadrage

| # | Décision | Date |
|---|---|---|
| D-RC-01 | L'OCR est une fonctionnalité cœur du MVP, pas une amélioration future | 24/05/2026 |
| D-RC-02 | Google OAuth (Gmail + Drive) est intégré dès le MVP | 24/05/2026 |
| D-RC-03 | Les deux modes de capture sont requis au MVP : photo mobile ET upload desktop | 24/05/2026 |
| D-RC-04 | L'import Gmail et Drive vise les deux usages : factures reçues ET relevés bancaires | 24/05/2026 |
| D-RC-05 | Toute extraction OCR ou import automatique requiert une validation manuelle avant enregistrement | 24/05/2026 |
| D-RC-06 | Usage personnel uniquement → Google OAuth en mode test, pas de vérification Google requise | 24/05/2026 |
| D-RC-07 | Le MVP révisé est estimé à 10 semaines (vs 6 initialement) | 24/05/2026 |
| D-RC-08 | Multi-utilisateurs : fonctionnalité hors scope, décision reportée à une version ultérieure sans date fixée — nécessitera un CR et probablement une migration SQLite → PostgreSQL | 24/05/2026 |
| D-RC-09 | Factur-X intégré au cadrage : MVP génère du PDF simple (conforme jusqu'en sept. 2027), migration Factur-X planifiée en V1 pour respecter l'obligation légale de facturation électronique applicable aux TPE à partir du 1er septembre 2027 | 24/05/2026 |

---

## 6. Documents à mettre à jour suite à ce recadrage

| Document | Action | Priorité |
|---|---|---|
| `04_cahier_des_charges_mvp.md` | Réécrire le périmètre MVP complet | 🔴 Haute |
| `05_specs_techniques_mvp.docx` | Ajouter OAuth, Vision API, scopes Google | 🔴 Haute |
| `PMP.md` | Réviser le planning (6 sem → 10 sem) | 🟠 Moyenne |
| `STATUS.md` | Mettre à jour le statut de phase | 🟠 Moyenne |
| `journal_decisions.md` | Ajouter les décisions D-RC-01 à D-RC-09 | 🔴 Haute |
| `HANDOFF_MOA_TO_DEV.md` | À réécrire pour Sprint 1 révisé | 🔴 Haute (après validation CDC) |

---

## 7. Prochaines étapes MOA

1. **Valider ce document** (Rachid) → signature ou commentaires
2. **Réécrire le CDC MVP** en intégrant le périmètre révisé
3. **Mettre à jour les Specs Techniques** (stack OAuth, Vision API, scopes)
4. **Réviser le PMP** (planning 10 semaines)
5. **Rédiger le HANDOFF Sprint 1** pour Claude développeur

---

*Document produit par l'Assistant MOA — Session du 24/05/2026*
*À valider avant toute session de développement*

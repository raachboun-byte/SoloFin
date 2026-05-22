# 📋 Note de Cadrage — SoloFin

> *Ce document est le référentiel officiel du projet. Il est vivant et doit être mis à jour à chaque fin de phase.*

---

## 1. Contexte et Enjeux

SoloFin est un projet personnel visant à remplacer un ensemble d'outils disparates (Excel, PDF manuels, boîte mail) par une application web unique, développée avec l'aide de Claude (IA). Le porteur est un freelance IT qui souhaite reprendre le contrôle de sa gestion financière sans dépendre de solutions SaaS tierces coûteuses ou inadaptées à son usage solo.

**Enjeux principaux :**
- Gagner du temps sur les tâches administratives répétitives
- Avoir une vision claire et en temps réel de sa santé financière
- Construire une solution évolutive, pilotée par le porteur lui-même
- Acquérir des compétences en développement assisté par IA (Claude)

---

## 2. Objectifs du projet

| # | Objectif | Mesure de succès |
|---|---|---|
| O1 | Centraliser la gestion financière | 1 seul outil pour tout gérer |
| O2 | Réduire le temps admin de > 50 % | Mesure avant/après sur 30 jours |
| O3 | Avoir une vue trésorerie en temps réel | Tableau de bord disponible en < 1 clic |
| O4 | Générer une facture en < 2 minutes | Mesuré sur 5 factures consécutives |
| O5 | Intégrer Gmail et Drive (long terme) | Connexion OAuth fonctionnelle en V3 |

---

## 3. Parties prenantes

| Rôle | Personne | Responsabilité |
|---|---|---|
| Porteur de projet / Chef de projet | Toi (le freelance) | Décisions, validation, usage quotidien |
| Assistant chef de projet | Perplexity AI | Structuration, livrables, pilotage |
| Développeur | Claude (Anthropic) | Réalisation technique de l'application |

---

## 4. Lotissement du projet — Les 4 versions

### MVP (Version 0) — "Ca marche pour moi"

**Horizon : Semaines 1 à 6**
**Objectif : avoir un outil fonctionnel en usage personnel quotidien**

| Module | Fonctionnalité |
|---|---|
| Notes de frais | Saisie manuelle d'une dépense (montant, catégorie, date, description) |
| Facturation | Création d'une facture PDF simple (client, prestation, montant, TVA) |
| Facturation | Suivi statut : Brouillon / Envoyée / Payée / En retard |
| Trésorerie | Vue mensuelle entrées/sorties |
| Interface | Application web responsive, authentification simple |

**Critère de succès MVP :** Utilisé 3x/semaine sans y être forcé pendant 30 jours.

---

### V1 — "C'est solide et complet"

**Horizon : Semaines 7 à 16**
**Objectif : couvrir la totalité du cycle financier freelance**

| Module | Fonctionnalité |
|---|---|
| Notes de frais | Photo de reçu avec OCR et catégorisation automatique |
| Notes de frais | 5 catégories minimum (transport, repas, matériel, logiciel, autre) |
| Facturation | Devis vers bon de commande vers facture (workflow complet) |
| Facturation | Relances automatiques pour factures en retard |
| Comptabilité | Tableau de bord annuel (CA, charges, résultat estimé) |
| Trésorerie | Prévisionnel sur 3 mois glissants |
| Export | Export CSV / PDF pour expert-comptable |
| Interface | Tableau de bord global avec KPIs clés |

**Critère de succès V1 :** Zéro recours à Excel ou outil externe pour la gestion financière.

---

### V2 — "Je pilote mon activité"

**Horizon : Semaines 17 à 28**
**Objectif : ajouter du pilotage et de l'intelligence à l'outil**

| Module | Fonctionnalité |
|---|---|
| Comptabilité | Génération automatique du livre des recettes |
| Comptabilité | Alerte seuil TVA / plafond micro-entrepreneur |
| Trésorerie | Analyse tendances et alertes (solde bas, facture impayée) |
| Facturation | Factures récurrentes (abonnements) |
| Notes de frais | Rapport mensuel automatique des dépenses |
| Interface | Mode sombre / clair, personnalisation |
| Sécurité | Sauvegarde automatique des données (export hebdomadaire) |

**Critère de succès V2 :** L'outil anticipe les problèmes avant qu'ils arrivent.

---

### V3 — "Tout est connecté"

**Horizon : Semaines 29 et au-delà**
**Objectif : connecter SoloFin à l'écosystème Google**

| Module | Fonctionnalité |
|---|---|
| Gmail | Lecture des mails liés à l'activité (factures reçues, paiements) |
| Gmail | Création automatique d'une dépense depuis un mail fournisseur |
| Google Drive | Accès et classement des documents depuis SoloFin |
| Google Drive | Archivage automatique des factures émises dans Drive |
| Intégration | Authentification OAuth Google unifiée |

> Note V3 : L'intégration Gmail/Drive nécessite une validation OAuth Google (délai estimé 2 à 4 semaines). Ce lot ne sera lancé qu'après validation complète du MVP et de V1.

---

## 5. Feuille de route macro

| Phase | Semaines | Livrable clé |
|---|---|---|
| MVP | 1 à 6 | Outil de base fonctionnel |
| V1 | 7 à 16 | Cycle financier complet |
| V2 | 17 à 28 | Pilotage et intelligence |
| V3 | 29+ | Intégrations Google |

---

## 6. Hors scope (toutes versions)

- Application mobile native iOS / Android
- Outil multi-utilisateurs / multi-entreprises
- Remplacement d'un logiciel comptable certifié
- CRM / gestion de prospects
- Paiement en ligne des factures (Stripe, GoCardless)
- Connexion bancaire directe (open banking)

---

## 7. Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Sur-construction (trop de features MVP) | Élevée | Élevé | Règle stricte : max 5 fonctions par version |
| Blocage technique (OCR photo) | Moyenne | Moyen | Saisie manuelle en fallback MVP, OCR en V1 |
| Perte de motivation sans feedback | Moyenne | Élevé | Utilisation quotidienne, mesure hebdomadaire |
| Délai validation OAuth Google | Élevée | Moyen | Exclu jusqu'à V3, pas de dépendance avant |
| Complexité comptable sous-estimée | Faible | Élevé | Rester sur du déclaratif simplifié |

---

## 8. Stack technique (à préciser en cadrage technique)

| Composant | Options envisagées | Décision |
|---|---|---|
| Frontend | React, Vue.js, HTML/CSS | A définir avec Claude |
| Backend | Node.js, Python FastAPI | A définir avec Claude |
| Base de données | SQLite, PostgreSQL, Supabase | A définir avec Claude |
| OCR (V1) | Google Vision API, Tesseract | A définir en V1 |
| Génération PDF | PDFKit, Puppeteer, Docupilot | A définir avec Claude |
| Hébergement | Local d'abord, puis VPS ou Vercel | Local pour MVP |

---

## 9. Journal des décisions

| Date | Décision | Contexte | Alternative écartée |
|---|---|---|---|
| Mai 2026 | Nommé le projet "SoloFin" | Projet personnel de gestion freelance | — |
| Mai 2026 | Intégrations Gmail/Drive repoussées en V3 | Complexité OAuth, délai validation | Inclure dès V1 |
| Mai 2026 | Développement avec Claude (IA) | Porteur solo sans équipe dev | No-code (Glide/Bubble) |
| Mai 2026 | MVP limité à 5 fonctions | Éviter la sur-construction | MVP plus ambitieux |

---

## 10. Prochaines actions immédiates

| # | Action | Responsable | Echéance |
|---|---|---|---|
| 1 | Valider la note de cadrage | Toi | Immédiat |
| 2 | Rédiger le cahier des charges MVP | Perplexity + Claude | Semaine 1 |
| 3 | Définir la stack technique MVP | Claude | Semaine 1 |
| 4 | Créer l'espace de pilotage (Notion) | Toi | Semaine 1 |
| 5 | Démarrer le développement du module Facturation | Claude | Semaine 2 |

---

*Dernière mise à jour : Mai 2026 — Document vivant, à mettre à jour à chaque fin de phase.*

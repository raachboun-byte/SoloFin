# Journal de Session — SoloFin
## Conversation du 13-14 Mai 2026

> *Document généré automatiquement par Perplexity AI — Assistant CDP SoloFin*
> *Dernière mise à jour : 14 Mai 2026*

---

## 1. Contexte de la session

| Champ | Détail |
|---|---|
| **Date** | 13 – 14 Mai 2026 |
| **Participants** | Porteur (Freelance IT, Saran) + Perplexity AI (Assistant CDP) |
| **Objet** | Initialisation du rôle Assistant CDP / QA + lancement Phase 2 |
| **Phase projet** | Fin Phase 1 (Initialisation) → Entrée Phase 2 (Planification) |

---

## 2. Résumé des échanges

### 2.1 Prise de rôle — Assistant CDP / Scrum Master / QA

Le porteur a officiellement activé Perplexity AI dans le rôle tripartite :
- **Assistant Chef de Projet / Documentation** : production et mise à jour des livrables documentaires
- **Scrum Master / Chef de projet** : pilotage des sprints, gestion des Change Requests, tableau de bord
- **QA Testeur** : checklists de test basées sur la Définition of Done, classification des bugs

Les 3 livrables d'initialisation ont été pris en charge et intégrés :
- `01_fiche_idee_solofin.md` ✅
- `02_note_de_cadrage_solofin.md` ✅
- `03_plan_management_projet_solofin.md` ✅

---

### 2.2 Production du Cahier des Charges MVP

**Décision :** Lancer le Cahier des Charges MVP en priorité (livrable 04).

**Livrable produit :** `04_cahier_des_charges_mvp_solofin.md` ✅

**Contenu produit :**
- Périmètre fonctionnel MVP — 5 fonctionnalités spécifiées avec critères d'acceptation
- Stack technique candidate (à arbitrer avec Claude en S1)
- Contraintes et exigences non fonctionnelles
- Hors scope MVP explicité
- Planning Sprint S1 → S6
- Définition of Done rappelée
- Critères de succès MVP mesurables
- Journal des décisions initialisé
- Prochaines actions listées

---

### 2.3 Question — Outil de suivi des tâches

**Question du porteur :** Quel outil est utilisé pour le suivi des tâches ?

**Réponse (basée sur le PMP) :**

| Usage | Outil |
|---|---|
| Backlog & suivi des tâches | **Notion** |
| Versionnage du code | **GitHub** |
| Documentation | **Fichiers Markdown** (dans GitHub) |
| Sessions de développement | **Claude** |

Structure Notion recommandée :
```
SoloFin/
├── Tableau de bord projet
├── Backlog
├── Sprint en cours
├── Bugs & anomalies
├── Journal des décisions
└── Livrables documentaires
```

**Point d'action ouvert :** Création de l'espace Notion (action Semaine 1 — statut À faire).

---

## 3. Tableau de bord des livrables — État au 14 Mai 2026

| # | Livrable | Phase | Statut |
|---|---|---|---|
| 01 | Fiche Idée | Initialisation | ✅ Produit |
| 02 | Note de Cadrage | Initialisation | ✅ Produit |
| 03 | Plan de Management de Projet (PMP) | Initialisation | ✅ Produit |
| 04 | Cahier des Charges MVP | Planification | ✅ Produit |
| 05 | Spécifications techniques MVP | Planification | 🔲 À faire |
| 06 | Plan de tests MVP | Planification | 🔲 À faire |
| 07 | Application MVP (code) | Réalisation | 🔲 À faire |
| 08 | Rapport d'usage MVP (30 jours) | Validation | 🔲 À faire |
| 09 | Bilan MVP + go/no-go V1 | Clôture MVP | 🔲 À faire |

---

## 4. Décisions prises durant la session

| Date | Décision | Contexte | Statut |
|---|---|---|---|
| 13 Mai 2026 | Activation de Perplexity AI comme Assistant CDP / SM / QA | Besoin de structuration et pilotage du projet solo | ✅ Acté |
| 13 Mai 2026 | Priorité donnée au CDC MVP sur le Plan de Tests | Besoin de cadrer Claude avant de coder | ✅ Acté |
| 14 Mai 2026 | Confirmation de Notion comme outil de suivi des tâches | Conforme au PMP v1.0 | ✅ Confirmé |

---

## 5. Points d'action ouverts

| # | Action | Responsable | Échéance | Statut |
|---|---|---|---|---|
| 1 | Arbitrer la stack technique MVP avec Claude | Claude + Porteur | Début Semaine 1 | 🔲 À faire |
| 2 | Créer le repo GitHub privé | Porteur | Début Semaine 1 | 🔲 À faire |
| 3 | Créer l'espace Notion (Backlog, Sprint S1, Bugs, Décisions) | Porteur | Début Semaine 1 | 🔲 À faire |
| 4 | Rédiger le Plan de Tests MVP | Perplexity | Semaine 1 | 🔲 À faire |
| 5 | Rédiger les Spécifications Techniques MVP | Perplexity + Claude | Semaine 1 | 🔲 À faire |
| 6 | Démarrer le Sprint S1 avec Claude (scaffolding + auth) | Claude + Porteur | Semaine 1 | 🔲 À faire |

---

## 6. Alertes et points de vigilance

> ⚠️ **Stack technique non arbitrée** : Le choix Frontend / Backend / BDD conditionne toute l'architecture MVP. À décider **avant** le premier commit avec Claude.

> ⚠️ **Espace Notion non créé** : Action bloquante pour le suivi formel des sprints.

> ⚠️ **Sprint S1 non démarré** : La Semaine 1 est entamée. Le démarrage doit intervenir sans délai.

---

## 7. Prochaine session recommandée

**Objectif :** Arbitrage stack technique + Brief Sprint S1 pour Claude

**Livrables à produire :**
1. `05_specs_techniques_mvp_solofin.md`
2. `06_plan_tests_mvp_solofin.md`
3. Brief S1 Claude (document de contexte pour la session de développement)

---

*Document produit par : Perplexity AI — Assistant CDP SoloFin*
*Version : 1.0 — 14 Mai 2026*

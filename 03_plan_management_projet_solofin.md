# Plan de Management de Projet (PMP) — SoloFin

> *Ce document définit comment le projet SoloFin est piloté, organisé et livré. Il fait autorité sur toutes les décisions de méthode.*
> *Dernière mise à jour : Mai 2026*

---

## 1. Présentation du projet

| Champ | Détail |
|---|---|
| **Nom du projet** | SoloFin |
| **Porteur / Chef de projet** | Freelance IT (Saran, Centre-Val de Loire) |
| **Assistant chef de projet** | Perplexity AI |
| **Développeur** | Claude (Anthropic) |
| **Date de démarrage** | Mai 2026 |
| **Horizon cible** | 12 mois (MVP en 6 semaines) |
| **Budget** | < 1 500 € sur 6 mois (MVP + V1) |

---

## 2. Méthode de gestion de projet retenue

### 2.1 Approche hybride : Agile encadrée

SoloFin adopte une **méthode hybride** combinant :

- **Cycle en V allégé** pour la phase de cadrage et de documentation initiale (note de cadrage, cahier des charges, PMP) — garantit une structure solide avant de coder
- **Agilité (Scrum simplifié)** pour la phase de réalisation — livraisons fréquentes, adaptation continue, feedback rapide

**Pourquoi ce choix ?**

| Contrainte du projet | Réponse de la méthode |
|---|---|
| Porteur solo, sans équipe | Processus léger, pas de cérémonie lourde |
| Besoins évolutifs (MVP → V3) | Livraisons par versions itératives |
| Développeur = IA (Claude) | Cadrage documentaire fort à chaque session |
| Budget et délai serrés | Priorité aux fonctionnalités à valeur immédiate |
| Pas de client externe | Validation par usage personnel réel |

### 2.2 Référentiels de méthode

La méthode s'inspire des cadres suivants, adaptés au contexte solo :

- **Scrum** : sprints hebdomadaires, backlog priorisé, définition of done
- **Lean Startup** : MVP, mesure, apprentissage, itération
- **PMBOK** (allégé) : cadrage, planification, exécution, clôture par phase

---

## 3. Organisation et rôles

### 3.1 Rôles et responsabilités

| Rôle | Qui | Responsabilités |
|---|---|---|
| **Product Owner** | Toi (le freelance) | Définir les priorités, valider les livrables, décider du go/no-go entre versions |
| **Chef de projet** | Toi (le freelance) | Piloter le planning, gérer les risques, tenir le journal des décisions |
| **Assistant CDP** | Perplexity AI | Produire les livrables documentaires, structurer, alerter sur les dérives |
| **Développeur** | Claude (Anthropic) | Coder les fonctionnalités, proposer des solutions techniques, livrer par sprint |

### 3.2 Principe de décision

- Toute décision fonctionnelle (quoi construire) : **Product Owner** (toi)
- Toute décision technique (comment construire) : **Claude** avec validation du Product Owner
- Toute évolution de périmètre : passage obligatoire par une **Change Request** documentée

---

## 4. Cycle de vie du projet

### 4.1 Les 5 phases du projet

```
Phase 1 : Initialisation    → Livrables : Fiche Idée, Note de Cadrage, PMP
Phase 2 : Planification     → Livrables : CDC MVP, Specs techniques, Plan de tests
Phase 3 : Réalisation       → Livrables : Application (sprints), Recettes
Phase 4 : Validation        → Livrables : Rapport d'usage, go/no-go version suivante
Phase 5 : Clôture de phase  → Livrables : Bilan de version, Dossier de passation
```

Ces 5 phases se répètent pour chaque version (MVP, V1, V2, V3).

### 4.2 Lotissement en versions

| Version | Horizon | Objectif principal |
|---|---|---|
| **MVP** | Semaines 1-6 | Outil fonctionnel en usage quotidien |
| **V1** | Semaines 7-16 | Cycle financier complet, OCR, exports |
| **V2** | Semaines 17-28 | Pilotage, alertes, automatisations |
| **V3** | Semaines 29+ | Intégrations Gmail et Google Drive |

### 4.3 Critères de passage entre versions

Un passage de version ne peut se faire que si **tous** les critères suivants sont remplis :

- [ ] Toutes les fonctionnalités de la version en cours sont livrées et testées
- [ ] Le critère de succès de la version est atteint (mesure quantitative)
- [ ] Le cahier des charges de la version suivante est rédigé et validé
- [ ] Le journal des décisions est à jour
- [ ] Aucun bug bloquant ou majeur en suspens

---

## 5. Pilotage des sprints

### 5.1 Rythme des sprints

- **Durée** : 1 semaine par sprint
- **Règle d'or** : 1 sprint = 1 fonctionnalité livrée et testée par le porteur
- **Règle de blocage** : ne jamais démarrer un sprint sans avoir terminé et validé le précédent

### 5.2 Structure d'un sprint

| Moment | Action | Durée estimée |
|---|---|---|
| **Lundi — Démarrage** | Définir la fonctionnalité du sprint, brief Claude | 30 min |
| **Lundi-Vendredi — Réalisation** | Développement avec Claude, tests au fil de l'eau | Variable |
| **Vendredi — Revue** | Tester la fonctionnalité livrée, noter les bugs | 30 min |
| **Vendredi — Retrospective** | Mettre à jour le backlog, journal des décisions | 15 min |

### 5.3 Définition of Done (DoD) — Critères de complétion

Une fonctionnalité est considérée comme DONE si et seulement si :

- [ ] Elle fonctionne sans erreur dans le navigateur cible
- [ ] Elle a été testée par le porteur dans une situation réelle
- [ ] Elle ne casse pas les fonctionnalités existantes (tests de régression)
- [ ] Elle est documentée (README ou commentaire de code minimal)
- [ ] Elle est intégrée dans l'outil de pilotage (Notion)

---

## 6. Outils de pilotage

| Usage | Outil | Détail |
|---|---|---|
| **Backlog & sprints** | Notion | 4 vues : Backlog / Sprint en cours / Bugs / Décisions |
| **Versionnage du code** | GitHub | 1 repo privé, branches par fonctionnalité |
| **Documentation** | Fichiers Markdown | Versionnés avec le code dans GitHub |
| **Communication** | Claude (chat) | Sessions de développement par fonctionnalité |
| **Suivi des livrables** | Ce PMP + tableau de bord | Mis à jour à chaque fin de sprint |

### 6.1 Structure Notion recommandée

```
SoloFin/
├── Tableau de bord projet
├── Backlog (toutes les fonctionnalités à faire, priorisées)
├── Sprint en cours (fonctionnalités de la semaine)
├── Bugs & anomalies
├── Journal des décisions
└── Livrables documentaires (liens vers les fichiers .md)
```

---

## 7. Gestion des changements

### 7.1 Principe

Tout ajout ou modification de fonctionnalité non prévu dans le cahier des charges en cours doit faire l'objet d'une **Change Request (CR)** avant d'être développé. Cette règle est non négociable pour éviter le scope creep (dérive du périmètre).

### 7.2 Processus de Change Request

```
Idée nouvelle → Rédiger la CR → Évaluer l'impact (temps, version) → Décider → Documenter
```

### 7.3 Formulaire de Change Request

| Champ | Contenu |
|---|---|
| Date | JJ/MM/AAAA |
| Description | Ce qui est demandé |
| Origine | Idée personnelle / problème rencontré / besoin nouveau |
| Impact estimé | Nombre de sprints supplémentaires |
| Version cible | Dans quelle version intégrer (en cours / V suivante) |
| Décision | Accepté / Refusé / Reporté |
| Raison | Justification de la décision |

---

## 8. Gestion des risques

| Risque | Probabilité | Impact | Statut | Action |
|---|---|---|---|---|
| Sur-construction (scope creep) | Élevée | Élevé | Actif | Règle CR obligatoire + max 5 fonctions/version |
| Perte de contexte entre sessions Claude | Élevée | Moyen | Actif | Brief de contexte systématique à chaque session |
| Abandon du projet (démotivation) | Moyenne | Élevé | Surveillance | Mesure hebdomadaire du gain de temps, usage réel |
| Blocage technique (OCR, PDF) | Moyenne | Moyen | Surveillance | Solution de fallback définie par fonctionnalité |
| Délai OAuth Google (V3) | Élevée | Faible (V3 loin) | Accepté | Exclu jusqu'à V3, suivi dès V2 |

---

## 9. Gestion de la qualité

### 9.1 Niveaux de test

| Type de test | Qui | Quand |
|---|---|---|
| **Test unitaire** | Claude (dans le code) | À chaque fonctionnalité |
| **Test fonctionnel** | Toi (porteur) | À chaque fin de sprint |
| **Test de régression** | Toi + Claude | À chaque fin de version |
| **Test d'acceptation** | Toi (usage réel 30 jours) | Avant passage à la version suivante |

### 9.2 Gestion des bugs

| Sévérité | Définition | Délai de traitement |
|---|---|---|
| **Bloquant** | L'app est inutilisable | Sprint suivant obligatoirement |
| **Majeur** | Une fonctionnalité clé ne marche pas | Dans les 2 sprints |
| **Mineur** | Problème cosmétique ou secondaire | Backlog, traité si le temps le permet |

---

## 10. Communication et reporting

Étant un projet solo, la communication est simplifiée mais le reporting reste essentiel pour garder le cap.

| Fréquence | Action | Support |
|---|---|---|
| **Hebdomadaire** | Mettre à jour le sprint Notion, noter les décisions | Notion |
| **Par version** | Rédiger un bilan de version (objectifs atteints, leçons apprises) | Fichier Markdown |
| **À chaque blocage** | Documenter le problème et la solution retenue | Journal des décisions |

---

## 11. Clôture de projet et passation

À la fin de chaque version majeure, un **dossier de clôture de version** est produit contenant :

- Bilan des fonctionnalités livrées vs prévues
- Métriques de succès mesurées
- Leçons apprises
- Décisions pour la version suivante
- État de la documentation technique

---

## 12. Tableau de bord des livrables du projet

| # | Livrable | Phase | Statut |
|---|---|---|---|
| 01 | Fiche Idée | Initialisation | Produit |
| 02 | Note de Cadrage | Initialisation | Produit |
| 03 | Plan de Management de Projet (ce document) | Initialisation | Produit |
| 04 | Cahier des Charges MVP | Planification | A faire |
| 05 | Spécifications techniques MVP | Planification | A faire |
| 06 | Plan de tests MVP | Planification | A faire |
| 07 | Application MVP (code) | Réalisation | A faire |
| 08 | Rapport d'usage MVP (30 jours) | Validation | A faire |
| 09 | Bilan MVP + go/no-go V1 | Clôture MVP | A faire |
| 10 | Cahier des Charges V1 | Planification V1 | A faire |

---

*Ce document est vivant. Il doit être relu et mis à jour à chaque début de version.*
*Dernière mise à jour : Mai 2026*

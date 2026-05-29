# HANDOFF MOA → DEV — Sprint S15 — Sécurité post-contre-audit
**Version 1.0 | 28 mai 2026**
**Statut : ✅ PRÊT À DÉMARRER**
**Durée estimée : 2–3 heures**
**Priorité : BLOQUANT — à livrer avant le Sprint 14 (déploiement VPS)**

---

## Contexte

Le contre-audit sécurité S14-BIS (28/05/2026) a identifié **4 nouvelles vulnérabilités introduites par les corrections** et **6 corrections partielles** non traitées. Ce sprint les corrige toutes avant la mise en production VPS.

**Avant de coder, lis :**
1. `STATUS.md` — état du projet
2. `CLAUDE.md` — règles de comportement et stack technique
3. Ce fichier — ce que tu dois livrer

**Puis commence par ce message :**
> "J'ai lu les fichiers. Sprint S15 — je vais corriger 10 items de sécurité. Je commence par NV-002 (blocage event loop). Des questions avant que je démarre ?"

---

## Items à corriger — classés par priorité

### 🔴 PRIORITÉ 1 — Bloquants production (4 items, ~1h)

---

#### S15-NV-002 — pbkdf2Sync bloque l'event loop Node.js
**Fichier :** `solofin/backend/services/google.js` lignes 13–14  
**Impact :** DoS total de l'application pendant ~1 000 ms à chaque connexion/déconnexion Google OAuth  
**CVSS :** 7.5 HIGH

**Problème actuel :**
```js
function deriverCle(cleSource, salt) {
  return crypto.pbkdf2Sync(cleSource, salt, 600_000, 32, 'sha512');
}
```
`pbkdf2Sync` est synchrone — il bloque l'event loop Node.js entier pendant ~1 seconde. Toutes les requêtes entrantes sont suspendues pendant ce temps.

**Correction attendue :**  
Rendre `deriverCle` asynchrone avec `crypto.pbkdf2` (Promise-based), puis adapter toutes les fonctions appelantes (`chiffrer`, `dechiffrer`) en `async/await`.

```js
// Remplacer :
function deriverCle(cleSource, salt) {
  return crypto.pbkdf2Sync(cleSource, salt, 600_000, 32, 'sha512');
}

// Par :
function deriverCle(cleSource, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(cleSource, salt, 600_000, 32, 'sha512', (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

// Et adapter chiffrer/dechiffrer en async :
async function chiffrer(texte) { ... const cle = await deriverCle(...); ... }
async function dechiffrer(donne) { ... const cle = await deriverCle(...); ... }
```

Toutes les fonctions du module `google.js` qui appellent `chiffrer` ou `dechiffrer` doivent devenir `async`. Les routes qui les appellent dans `routes/auth.js` utilisent déjà `async/await` — vérifier la chaîne complète.

**Critère de done :** `node -e "const g = require('./services/google'); console.log(typeof g.chiffrer().then)"` retourne `function` (Promise).

---

#### S15-NV-001 — timingSafeEqual crash sur buffers de longueur différente
**Fichier :** `solofin/backend/routes/auth.js` — fonction callback OAuth (chercher `timingSafeEqual`)  
**Impact :** Un `state` OAuth de longueur invalide (vide, trop court, non-hex) provoque une `TypeError` non catchée → crash du process ou réponse 500 exploitable  
**CVSS :** 6.5 HIGH

**Problème actuel :**
```js
const stateBuffer   = Buffer.from(state, 'hex');
const attenduBuffer = Buffer.from(attendu, 'hex');
if (!crypto.timingSafeEqual(stateBuffer, attenduBuffer)) { ... }
```
Si `state` et `attendu` ont des longueurs en bytes différentes, Node.js lève : `TypeError: Input buffers must have the same byte length`.

**Correction attendue :**  
Vérifier la longueur avant d'appeler `timingSafeEqual`, et wrapper dans un try/catch :

```js
// Validation préalable
if (!state || typeof state !== 'string' || !/^[0-9a-f]+$/i.test(state)) {
  return res.redirect(`${FRONTEND_URL}/parametres?error=oauth_state_invalid`);
}

// Comparaison sécurisée avec protection longueur
let stateValide = false;
try {
  const stateBuffer   = Buffer.from(state, 'hex');
  const attenduBuffer = Buffer.from(attendu, 'hex');
  stateValide = stateBuffer.length === attenduBuffer.length &&
                crypto.timingSafeEqual(stateBuffer, attenduBuffer);
} catch {
  stateValide = false;
}

if (!stateValide) {
  return res.redirect(`${FRONTEND_URL}/parametres?error=oauth_state_mismatch`);
}
```

**Critère de done :** `GET /api/auth/google/callback?state=abc&code=x` retourne une redirection propre (pas un crash 500).

---

#### S15-NV-003 — Rotation des credentials exposés dans .env
**Fichier :** `solofin/backend/.env`  
**Impact :** Les credentials listés ci-dessous ont été lus dans le workspace Cowork — rotation immédiate requise  
**CVSS :** CRITIQUE (confidentialité maximale)

**Action requise par Rachid (pas par le développeur) :**

| Secret | Action |
|--------|--------|
| `ANTHROPIC_API_KEY` | Révoquer sur console.anthropic.com → Générer une nouvelle clé → Mettre à jour `.env` |
| `GOOGLE_CLIENT_SECRET` | Révoquer sur console.cloud.google.com → OAuth → Credentials → Regénérer |
| `SESSION_SECRET` | Régénérer : `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ENCRYPTION_KEY` | Régénérer de même — **attention : invalide tous les tokens OAuth stockés en base** (les utilisateurs devront se reconnecter à Google) |

> ⚠️ Si `ENCRYPTION_KEY` est changée, les tokens AES-GCM existants dans `oauth_tokens` ne seront plus déchiffrables. Ajouter un message utilisateur clair dans l'UI si `dechiffrer` retourne `TOKEN_REENCRYPT_REQUIRED`.

**Action développeur :** Vérifier que `.env` est bien dans `.gitignore` (déjà fait) et qu'aucun secret n'est loggé par Pino (déjà configuré dans `services/logger.js`).

---

#### S15-NV-004 — Prompt injection sur /api/agent + absence de rate limit
**Fichier :** `solofin/backend/routes/agent.js`  
**Impact :** Un utilisateur authentifié peut exfiltrer l'intégralité du contexte financier (CA, TJM, clients, dépenses) via une instruction injectée dans `message`  
**CVSS :** 6.1 MEDIUM (périmètre mono-utilisateur réduit l'impact)

**Corrections attendues :**

1. **Limiter la longueur du message** (empêche les injections longues et le flood) :
```js
if (message.trim().length > 2000) {
  return res.status(400).json({ data: null, error: 'Message trop long (max 2000 caractères)' });
}
```

2. **Ajouter un rate limit spécifique** sur `/api/agent` (distinct du rate limit global) :
```js
const limiteAgent = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
router.post('/', limiteAgent, async (req, res) => { ... });
```

3. **Supprimer le résidu `console.error`** ligne `console.error('[agent] Erreur Gemini API :', err.message)` → remplacer par `logger.error({ err }, '[agent] Erreur Ollama')` (utiliser le logger Pino déjà importé dans les autres routes).

**Critère de done :** Un POST avec `message` de 2001 caractères retourne 400. 21 requêtes en 60 secondes → la 21e retourne 429.

---

### 🟠 PRIORITÉ 2 — Corrections partielles (6 items, ~1h30)

---

#### S15-P1 — trust proxy manquant (rate limit bypassable)
**Fichier :** `solofin/backend/index.js` — juste avant la définition des middlewares rate limit  
**Impact :** Sans `trust proxy`, Express lit l'IP depuis `req.socket.remoteAddress` (toujours l'IP de Nginx = `127.0.0.1`) → le rate limit est inutile derrière Nginx en production  

**Correction (1 ligne) :**
```js
// Ajouter AVANT les middlewares, juste après app = express() :
app.set('trust proxy', 1); // Nginx en reverse proxy — lire X-Forwarded-For
```

**Critère de done :** `grep -n 'trust proxy' backend/index.js` retourne un résultat.

---

#### S15-P2 — IDOR sur factures et clients (user_id absent)
**Fichiers :** `solofin/backend/routes/factures.js` et `solofin/backend/routes/clients.js`  
**Impact :** Un utilisateur authentifié peut lire/modifier les factures et clients d'un autre utilisateur. En pratique SoloFin est mono-utilisateur MVP, mais la faille doit être corrigée avant VPS.

**Contexte DB :** La colonne `user_id` n'existe pas encore sur `factures` ni sur `clients`. Il faut l'ajouter via migration.

**Corrections attendues :**

**1. Migration DB** dans `solofin/backend/db/init.js` — ajouter dans le bloc migrations :
```js
// Migration V3 — IDOR : ajout user_id sur factures et clients
const colFac = db.prepare("PRAGMA table_info(factures)").all();
if (!colFac.find(c => c.name === 'user_id')) {
  db.prepare("ALTER TABLE factures ADD COLUMN user_id INTEGER DEFAULT 1").run();
}
const colCli = db.prepare("PRAGMA table_info(clients)").all();
if (!colCli.find(c => c.name === 'user_id')) {
  db.prepare("ALTER TABLE clients ADD COLUMN user_id INTEGER DEFAULT 1").run();
}
```

**2. routes/factures.js** — toutes les requêtes SELECT/UPDATE/DELETE doivent filtrer par `user_id = req.user.userId` :
- `GET /api/factures` → `WHERE user_id = ?`
- `GET /api/factures/:id` → `WHERE id = ? AND user_id = ?`
- `PUT /api/factures/:id` → `WHERE id = ? AND user_id = ?`
- `DELETE /api/factures/:id` → `WHERE id = ? AND user_id = ?`
- `GET /api/factures/:id/pdf` → vérifier `user_id` avant génération PDF
- `POST /api/factures` → inclure `user_id: req.user.userId` dans l'INSERT

**3. routes/clients.js** — même logique :
- `GET /api/clients` → `WHERE user_id = ?`
- `GET /api/clients/:id` → `WHERE id = ? AND user_id = ?`
- `PUT /api/clients/:id` → `WHERE id = ? AND user_id = ?`
- `DELETE /api/clients/:id` → `WHERE id = ? AND user_id = ?`
- `POST /api/clients` → inclure `user_id: req.user.userId` dans l'INSERT

**Critère de done :** `grep -n 'user_id\|req.user' backend/routes/factures.js` retourne au moins 8 occurrences.

---

#### S15-P3 — Validation Zod manquante sur /factures, /clients, /relances
**Fichiers :** `solofin/backend/routes/factures.js`, `solofin/backend/routes/clients.js`, `solofin/backend/routes/relances.js`  
**Impact :** Les champs non validés permettent des injections de valeurs aberrantes (montants négatifs, dates invalides, strings géantes)

**Dépendance :** `zod` est déjà installé (utilisé dans `frais.js`).

**Corrections attendues — ajouter en tête de chaque fichier :**

```js
const { z } = require('zod');

// factures.js
const schemaFacture = z.object({
  client_id:       z.number().int().positive(),
  date_emission:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_echeance:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nb_jours:        z.number().int().positive().max(365),
  tjm:             z.number().positive().max(10000),
  taux_tva:        z.number().min(0).max(1),
  mois_prestation: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  description:     z.string().max(500).optional(),
});

// clients.js
const schemaClient = z.object({
  raison_sociale: z.string().min(1).max(200),
  siret:          z.string().regex(/^\d{14}$/).optional().nullable(),
  adresse:        z.string().max(500).optional().nullable(),
  email:          z.string().email().max(254).optional().nullable(),
  tjm_defaut:     z.number().positive().max(10000).optional().nullable(),
});

// relances.js — validation du body POST envoyer
const schemaRelanceEnvoi = z.object({
  niveau: z.number().int().min(1).max(3),
});
```

Appliquer avec `schemaXxx.safeParse(req.body)` sur les routes POST et PUT, retourner 400 si `!result.success`.

**Critère de done :** Un POST `/api/factures` avec `nb_jours: -1` retourne 400.

---

#### S15-P4 — AbortController signal non connecté (timeout non-fonctionnel)
**Fichier :** `solofin/backend/services/google.js` — fonction `echangerCode`  
**Impact :** Le timeout de 30 secondes sur l'échange OAuth code → token est déclaré mais jamais appliqué → un code malformé peut bloquer indéfiniment la route callback

**Correction :**  
Localiser la création de `AbortController` dans `echangerCode` et passer `signal: controller.signal` à l'appel `client.getToken(code)` si l'API googleapis le supporte. Si elle ne le supporte pas, utiliser `Promise.race` avec un timeout manuel :

```js
async function echangerCode(code) {
  const { OAuth2Client } = require('google-auth-library');
  // ...
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT_OAUTH')), 30_000)
  );
  const echange = client.getToken(code);
  const { tokens } = await Promise.race([echange, timeout]);
  return tokens;
}
```

**Critère de done :** Passer un code invalide à `echangerCode` → Google répond en < 5s avec une erreur, pas un hang.

---

#### S15-P5 — Supprimer les résidus console.log/console.error en production
**Fichiers :** `solofin/backend/index.js` (lignes 73 et 75), `solofin/backend/services/google.js` (résidu `console.error`), `solofin/backend/routes/agent.js` (résidu `console.error`)  
**Impact :** Les logs console contournent Pino (pas de redact, pas de structuration) et peuvent exposer des données sensibles

**Correction :** Remplacer tous les `console.log` et `console.error` restants par `logger.info` / `logger.error` avec le logger Pino déjà importé.

Pour les fichiers qui n'importent pas encore le logger :
```js
const logger = require('../services/logger');
```

**Critère de done :** `grep -rn 'console\.' solofin/backend/ --include="*.js"` → zéro résultat hors fichiers de test.

---

#### S15-P6 — validerUrl() définie mais jamais appelée (SSRF partiel)
**Fichier :** `solofin/backend/services/ssrf.js` et routes qui font des requêtes HTTP sortantes  
**Impact :** La fonction `validerUrl()` filtre les IPs privées mais n'est appelée nulle part — les routes Drive et Gmail pourraient en bénéficier

**Audit à faire en premier :** Chercher toutes les occurrences de `fetch(`, `axios.get(`, `got(`, `client.request(` dans le backend pour identifier les endpoints qui construisent des URLs depuis une entrée utilisateur.

**Correction :** Dans chaque route qui fait une requête HTTP vers une URL construite depuis une entrée utilisateur, appeler `validerUrl(url)` avant la requête. Si l'URL est toujours interne (Google APIs fixes), documenter pourquoi `validerUrl` n'est pas nécessaire pour ce cas.

**Critère de done :** Chaque `fetch(urlDynamique)` dans le backend est précédé d'un `await validerUrl(urlDynamique)` ou d'un commentaire justifiant l'absence de validation.

---

## Ce que tu ne dois PAS faire ce sprint

- Ne pas toucher au frontend (aucun impact UI attendu)
- Ne pas modifier le schéma des tables au-delà de l'ajout des colonnes `user_id`
- Ne pas implémenter de nouvelles fonctionnalités
- Toute découverte de nouvelle vulnérabilité → documenter dans `journal_decisions.md` et alerter avant de corriger

---

## Critères de done — Sprint S15

| # | Item | Critère de validation |
|---|------|-----------------------|
| D1 | NV-002 pbkdf2Sync | `chiffrer()` et `dechiffrer()` retournent des Promises ; `pbkdf2Sync` absent du code |
| D2 | NV-001 timingSafeEqual | `GET /callback?state=abc` → redirection propre, pas de crash 500 |
| D3 | NV-003 Credentials | `.env` mis à jour avec nouveaux secrets (action Rachid) |
| D4 | NV-004 Agent | POST message > 2000 chars → 400 ; 21e req/min → 429 ; plus de `console.error` |
| D5 | P1 trust proxy | `grep 'trust proxy' backend/index.js` → 1 résultat |
| D6 | P2 IDOR factures/clients | Migration V3 appliquée ; `user_id` filtré sur toutes les routes |
| D7 | P3 Zod factures/clients/relances | POST avec montant négatif ou date invalide → 400 |
| D8 | P4 AbortController | `Promise.race` avec timeout 30s dans `echangerCode` |
| D9 | P5 console.log résidus | `grep -rn 'console\.' backend/` → zéro résultat |
| D10 | P6 validerUrl | Chaque `fetch` dynamique validé ou documenté |
| D11 | Zéro régression | Tous les flux existants (login, facture PDF, dépenses OCR, relances) fonctionnels |

---

## Ordre d'exécution recommandé

1. **NV-002** (pbkdf2Sync) — le plus impactant, change la signature des fonctions → faire en premier pour identifier les dépendances
2. **NV-001** (timingSafeEqual) — 5 lignes, fait après NV-002 car dans le même flux OAuth
3. **P1** (trust proxy) — 1 ligne dans index.js
4. **P5** (console résidus) — balayage rapide, 5 minutes
5. **P2** (IDOR factures/clients) — le plus long, migration + 2 fichiers de routes
6. **P3** (Zod) — après P2 car les routes sont déjà ouvertes
7. **P4** (AbortController) — dans google.js déjà ouvert pour NV-002
8. **P6** (validerUrl) — audit + documentation
9. **NV-004** (agent) — rate limit + longueur + logger
10. **NV-003** (credentials) — action manuelle Rachid hors code

---

## Références

- `contre_audit_securite_solofin_s14bis.docx` — rapport complet (28/05/2026)
- `CLAUDE.md` — stack technique et règles (non révisable sans CR)
- `STATUS.md` — état du projet
- `journal_decisions.md` — décisions actées

---

*Document produit par l'Assistant MOA — 28/05/2026*  
*Sprint suivant : Sprint 14 — Déploiement VPS (débloqué après validation S15)*

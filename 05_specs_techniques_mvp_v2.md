# Spécifications Techniques — SoloFin MVP
**Document MOA/Tech | Version 2.0 | 24 mai 2026**
**Statut : ✅ VALIDÉ — Rachid Aachboun — 24/05/2026**
**Remplace :** 05_specs_techniques_mvp_solofin_v1.2.docx

---

## 1. Stack technique — Décisions non révisables sans CR

| Composant | Technologie | Version | Justification |
|---|---|---|---|
| Frontend | React | 18 | Décision initiale actée |
| Build tool | Vite | Latest | Décision initiale actée |
| CSS | Tailwind CSS | 3.x | Décision initiale actée |
| Backend | Node.js + Express | 20 LTS / 4.x | Décision initiale actée |
| Base de données | SQLite + better-sqlite3 | Latest | Usage mono-utilisateur, simple |
| Auth locale | bcrypt | cout 12 | Décision initiale actée |
| PDF génération | PDFKit | Latest | MVP — migration Factur-X en V1 |
| Reverse proxy | Nginx | Latest stable | Décision initiale actée |
| Process manager | PM2 | Latest | Décision initiale actée |
| HTTPS | Let's Encrypt + Certbot | — | Décision initiale actée |
| Hébergement | VPS Ubuntu | 22.04 LTS | Décision initiale actée |
| **OCR** | **Claude Vision API** | **claude-3-5-sonnet** | **Nouveau MVP révisé** |
| **OAuth** | **Google OAuth 2.0** | **v2** | **Nouveau MVP révisé** |
| **Gmail API** | **Google Gmail API** | **v1** | **Nouveau MVP révisé** |
| **Drive API** | **Google Drive API** | **v3** | **Nouveau MVP révisé** |

> **ATTENTION :** Google OAuth est désormais requis dès le MVP (anciennement reporté V2/V3). Cette décision est actée (D-RC-02).

---

## 2. Architecture générale

```
Utilisateur (Chrome)
    │
    ▼
[Nginx HTTPS :443]
    │
    ├──▶ /  ──────────────▶ [React Frontend — Vite build]
    │
    └──▶ /api/* ──────────▶ [Express Backend :3001]
                                │
                    ┌───────────┼───────────────┐
                    │           │               │
              [SQLite DB]  [Google APIs]  [Claude API]
                          Gmail + Drive      Vision OCR
```

---

## 3. Google OAuth 2.0 — Configuration et scopes

### 3.1 Scopes demandés

| Scope | Usage | Niveau d'accès |
|---|---|---|
| `openid` | Identification de l'utilisateur | Lecture |
| `email` | Récupération de l'email Google | Lecture |
| `https://www.googleapis.com/auth/gmail.readonly` | Scan des emails et pièces jointes | Lecture seule |
| `https://www.googleapis.com/auth/drive.readonly` | Navigation et téléchargement fichiers Drive | Lecture seule |

> **Principe du moindre privilège** : aucun scope d'écriture n'est demandé. L'application ne peut ni envoyer d'emails ni modifier des fichiers Drive.

### 3.2 Flow OAuth (Authorization Code Flow)

```
1. Utilisateur clique "Connecter Google"
2. Backend génère l'URL d'autorisation Google avec les scopes
3. Redirection vers consent screen Google
4. Google retourne un code d'autorisation
5. Backend échange le code contre access_token + refresh_token
6. Tokens stockés en base (chiffrés), côté serveur uniquement
7. Frontend reçoit uniquement un cookie de session httpOnly
```

### 3.3 Gestion des tokens

- `access_token` : durée de vie 1h, utilisé pour les appels API
- `refresh_token` : durée de vie longue, utilisé pour renouveler l'access_token automatiquement
- Stockage : table `oauth_tokens` en SQLite, champ token chiffré (AES-256-CBC, clé dans variable d'environnement)
- Le frontend ne voit jamais les tokens

### 3.4 Mode de déploiement Google Cloud

- **Mode : Test** (usage personnel uniquement)
- Pas de vérification Google requise
- Limite : 100 utilisateurs de test (largement suffisant)
- Compte Google de test : r.aachboun@gmail.com

---

## 4. OCR — Claude Vision API

### 4.1 Choix technique

Claude Vision API (modèle `claude-3-5-sonnet`) est retenu pour l'OCR. Avantages par rapport à Google Cloud Vision :
- Meilleure précision sur documents en français
- Extraction structurée directement en JSON (pas de post-traitement complexe)
- Même fournisseur que l'assistant MOA (cohérence)

### 4.2 Prompt d'extraction OCR

Le backend envoie à Claude Vision le prompt suivant (adapté selon le type de document) :

```
Analyse cette image de justificatif financier et extrais les informations suivantes en JSON :
{
  "montant_ttc": number ou null,
  "date": "YYYY-MM-DD" ou null,
  "fournisseur": "string" ou null,
  "categorie_suggeree": "Repas|Transport|Hébergement|Télécom|Matériel|Carburant|Autre" ou null,
  "devise": "EUR" ou autre
}
Réponds uniquement avec le JSON, sans texte supplémentaire.
Si tu n'es pas certain d'une valeur, mets null plutôt que d'inventer.
```

### 4.3 Gestion des erreurs OCR

| Cas | Comportement |
|---|---|
| OCR réussi | Formulaire pré-rempli avec les valeurs extraites |
| Champ non trouvé | Champ laissé vide dans le formulaire |
| Erreur API Claude | Message d'erreur, formulaire vide à remplir manuellement |
| Image illisible | Message d'alerte, formulaire vide |

### 4.4 Coûts estimés

- Modèle : claude-3-5-sonnet (~3$/1M tokens input, ~15$/1M tokens output)
- Une image OCR ≈ 1500 tokens input + 100 tokens output ≈ 0,006 $
- Usage estimé : 50 justificatifs/mois → **coût mensuel < 0,35 $**

---

## 5. Structure de la base de données

### Table `users`

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,  -- bcrypt cout 12
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table `oauth_tokens`

```sql
CREATE TABLE oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL DEFAULT 'google',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expiry DATETIME,
  scopes TEXT,  -- JSON array des scopes accordés
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table `sessions`

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- UUID v4
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);
```

### Table `clients`

```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  siret TEXT,
  tva TEXT,
  adresse TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table `factures`

```sql
CREATE TABLE factures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL UNIQUE,  -- TNS_CONSULTING-AAAA-MM
  client_id INTEGER REFERENCES clients(id),
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,
  designation TEXT NOT NULL,
  nb_jours REAL,
  tjm REAL,
  montant_ht REAL NOT NULL,
  tva_taux REAL NOT NULL DEFAULT 20,
  montant_tva REAL NOT NULL,
  montant_ttc REAL NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon',  -- brouillon|envoyee|payee|en_retard
  pdf_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table `depenses`

```sql
CREATE TABLE depenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date_depense DATE NOT NULL,
  fournisseur TEXT NOT NULL,
  montant REAL NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  justificatif_path TEXT,  -- chemin fichier hors webroot
  source TEXT DEFAULT 'manuel',  -- manuel|ocr_upload|ocr_photo|gmail|drive
  gmail_message_id TEXT,  -- pour déduplication import Gmail
  drive_file_id TEXT,     -- pour déduplication import Drive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table `imports_gmail`

```sql
CREATE TABLE imports_gmail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gmail_message_id TEXT NOT NULL UNIQUE,
  sujet TEXT,
  expediteur TEXT,
  date_email DATE,
  statut TEXT DEFAULT 'detecte',  -- detecte|importe|ignore
  depense_id INTEGER REFERENCES depenses(id),
  scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table `imports_drive`

```sql
CREATE TABLE imports_drive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drive_file_id TEXT NOT NULL UNIQUE,
  nom_fichier TEXT,
  type_document TEXT,  -- releve_bancaire|declaration_resultat|autre
  statut TEXT DEFAULT 'importe',
  depense_id INTEGER REFERENCES depenses(id),
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Structure du projet (révisée)

```
solofin/
  frontend/                    # React 18 + Vite + Tailwind
    src/
      components/              # Composants UI réutilisables
      pages/
        Login.jsx
        Dashboard.jsx
        Frais.jsx              # Notes de frais + OCR
        Facturation.jsx        # Création + liste factures
        Tresorerie.jsx         # Vue mensuelle
        GmailImport.jsx        # Import depuis Gmail
        DriveImport.jsx        # Import depuis Drive
        Parametres.jsx         # OAuth status + déconnexion
      hooks/
        useAuth.js
        useOCR.js
        useGmail.js
        useDrive.js
      api/                     # Appels axios vers backend
        auth.js
        depenses.js
        factures.js
        gmail.js
        drive.js
        tresorerie.js
    index.html
    vite.config.js

  backend/                     # Node.js + Express
    routes/
      auth.js                  # Login local + OAuth Google
      depenses.js              # CRUD dépenses + OCR
      factures.js              # CRUD factures + PDF
      tresorerie.js            # Vue mensuelle
      gmail.js                 # Scan + import Gmail
      drive.js                 # Navigation + import Drive
    middleware/
      auth.js                  # Vérification session
    services/
      ocr.js                   # Appel Claude Vision API
      gmail.js                 # Wrapper Gmail API
      drive.js                 # Wrapper Drive API
      pdf.js                   # Génération PDF (PDFKit)
      oauth.js                 # Gestion tokens Google
    db/
      init.js                  # Schéma SQLite + migrations
    index.js                   # Point d'entrée Express port 3001

  database/                    # solofin.db (gitignore)
  uploads/                     # Justificatifs uploadés (gitignore, hors webroot)
```

---

## 7. Routes API

### Auth

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login local (email + password) |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/google` | Initie le flow OAuth Google |
| GET | `/api/auth/google/callback` | Callback OAuth Google |
| DELETE | `/api/auth/google` | Révoque les tokens Google |
| GET | `/api/auth/status` | Retourne le statut de session et OAuth |

### Dépenses

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/depenses` | Liste (filtres : mois, catégorie) |
| POST | `/api/depenses` | Créer une dépense |
| PUT | `/api/depenses/:id` | Modifier une dépense |
| DELETE | `/api/depenses/:id` | Supprimer une dépense |
| POST | `/api/depenses/ocr` | Upload fichier → extraction OCR |

### Factures

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/factures` | Liste (filtres : statut, année) |
| POST | `/api/factures` | Créer une facture |
| PUT | `/api/factures/:id` | Modifier (brouillon uniquement) |
| DELETE | `/api/factures/:id` | Supprimer (brouillon uniquement) |
| PATCH | `/api/factures/:id/statut` | Changer le statut |
| GET | `/api/factures/:id/pdf` | Télécharger le PDF |

### Gmail

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/gmail/scan` | Scanner les emails (param : nb jours) |
| GET | `/api/gmail/imports` | Historique des imports |
| POST | `/api/gmail/import` | Importer les factures sélectionnées |

### Drive

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/drive/files` | Lister les fichiers (param : folder_id) |
| POST | `/api/drive/parse` | Parser un fichier Drive (OCR) |
| POST | `/api/drive/import` | Importer un document parsé |
| GET | `/api/drive/imports` | Historique des imports |

### Trésorerie

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/tresorerie` | Vue mensuelle (param : mois, année) |
| GET | `/api/tresorerie/historique` | 12 mois glissants |

---

## 8. Sécurité

### Variables d'environnement requises (`.env`)

```bash
# Serveur
NODE_ENV=production
PORT=3001
SESSION_SECRET=<random_256bits>

# Base de données
DB_PATH=./database/solofin.db

# Chiffrement tokens OAuth
ENCRYPTION_KEY=<random_256bits>

# Google OAuth
GOOGLE_CLIENT_ID=<depuis Google Cloud Console>
GOOGLE_CLIENT_SECRET=<depuis Google Cloud Console>
GOOGLE_REDIRECT_URI=https://solofin.example.com/api/auth/google/callback

# Claude API (OCR)
ANTHROPIC_API_KEY=<depuis console.anthropic.com>
```

### Headers de sécurité (Nginx)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header Content-Security-Policy "default-src 'self'; ...";
```

---

## 9. Conventions de code

- Commentaires en **français**
- Réponses API : `{ data: ..., error: null }` ou `{ data: null, error: "message" }`
- Codes HTTP : 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error
- Toutes les routes `/api/*` (sauf `/api/auth/login` et `/api/auth/google*`) protégées par middleware session

---

## 10. Évolutions planifiées (hors MVP)

| Version | Évolution technique |
|---|---|
| V1 | Migration PDF → Factur-X (PDF/A-3 + XML EN 16931) |
| V1 | Export CSV des dépenses |
| V2 | Scan Gmail automatique (cron job PM2) |
| V2 | Migration SQLite → PostgreSQL si multi-utilisateurs (CR requis) |

---

*Document produit par l'Assistant MOA — Session du 24/05/2026*

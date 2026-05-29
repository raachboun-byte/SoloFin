// Initialisation de la base de données SQLite (node:sqlite natif Node.js v22+)
const { DatabaseSync } = require('node:sqlite');
const path   = require('path');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

// Chemin vers le fichier de base de données
const DB_PATH = path.join(__dirname, '../../database/solofin.db');

// Ouvrir (ou créer) la base de données
const db = new DatabaseSync(DB_PATH);

// Activer les clés étrangères
db.exec('PRAGMA foreign_keys = ON;');

// Création des tables MVP
db.exec(`
  -- Table utilisateurs (utilisateur unique MVP)
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  -- Table sessions persistées en base (remplace la Map mémoire)
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    email      TEXT    NOT NULL,
    expires_at TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Table tokens OAuth Google (stockés côté serveur, jamais exposés frontend)
  CREATE TABLE IF NOT EXISTS oauth_tokens (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL UNIQUE,
    access_token  TEXT,
    refresh_token TEXT,
    scope         TEXT,
    expires_at    TEXT,
    created_at    TEXT    DEFAULT (datetime('now')),
    updated_at    TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Table clients
  CREATE TABLE IF NOT EXISTS clients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    raison_sociale TEXT NOT NULL,
    adresse     TEXT NOT NULL,
    siret       TEXT,
    tjm         REAL NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Table factures
  CREATE TABLE IF NOT EXISTS factures (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    numero          TEXT    NOT NULL UNIQUE,
    client_id       INTEGER NOT NULL,
    mois_prestation TEXT    NOT NULL,
    nb_jours        REAL    NOT NULL,
    tjm             REAL    NOT NULL,
    taux_tva        REAL    NOT NULL DEFAULT 0.20,
    montant_ht      REAL    NOT NULL,
    montant_tva     REAL    NOT NULL,
    montant_ttc     REAL    NOT NULL,
    date_emission   TEXT    NOT NULL,
    date_echeance   TEXT    NOT NULL,
    statut          TEXT    NOT NULL DEFAULT 'brouillon'
                    CHECK(statut IN ('brouillon','envoyee','payee','en_retard')),
    created_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  -- Table depenses (notes de frais)
  CREATE TABLE IF NOT EXISTS depenses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    date_depense   TEXT    NOT NULL,
    fournisseur    TEXT    NOT NULL,
    montant_ttc    REAL    NOT NULL,
    taux_tva       REAL    NOT NULL,
    montant_ht     REAL    NOT NULL,
    tva_deductible REAL    NOT NULL,
    categorie      TEXT    NOT NULL,
    description    TEXT,
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  -- Table historique imports Gmail (évite les doublons par gmail_msg_id)
  CREATE TABLE IF NOT EXISTS imports_gmail (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    gmail_msg_id  TEXT    NOT NULL UNIQUE,
    expediteur    TEXT,
    sujet         TEXT,
    date_email    TEXT,
    montant_ttc   REAL,
    fournisseur   TEXT,
    date_facture  TEXT,
    statut        TEXT    DEFAULT 'detecte'
                  CHECK(statut IN ('detecte','importe','ignore')),
    depense_id    INTEGER,
    created_at    TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (depense_id) REFERENCES depenses(id)
  );

  -- Table historique imports Google Drive
  CREATE TABLE IF NOT EXISTS imports_drive (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    drive_file_id   TEXT    NOT NULL UNIQUE,
    nom_fichier     TEXT,
    type_document   TEXT    CHECK(type_document IN ('releve_bancaire','declaration_resultat','autre')),
    statut          TEXT    DEFAULT 'en_attente'
                    CHECK(statut IN ('en_attente','importe','erreur')),
    nb_transactions INTEGER,
    created_at      TEXT    DEFAULT (datetime('now'))
  );
`);

// Migration V1 : ajout colonne piece_jointe si elle n'existe pas
try { db.exec('ALTER TABLE depenses ADD COLUMN piece_jointe TEXT'); } catch {}

// Migration V2 — P1.5 : IDOR — user_id sur les dépenses (défaut 1 = utilisateur MVP)
try { db.exec('ALTER TABLE depenses ADD COLUMN user_id INTEGER DEFAULT 1'); } catch {}

// Migration V3 : email sur les clients (requis pour les relances automatiques)
try { db.exec('ALTER TABLE clients ADD COLUMN email TEXT'); } catch {}

// Migration V4 — P2/S15 IDOR : user_id sur factures et clients (défaut 1 = utilisateur MVP)
try { db.exec('ALTER TABLE factures ADD COLUMN user_id INTEGER DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE clients  ADD COLUMN user_id INTEGER DEFAULT 1'); } catch {}

// Tables relances (Sprint 14 Bis)
db.exec(`
  CREATE TABLE IF NOT EXISTS relances (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    facture_id         INTEGER NOT NULL,
    niveau             INTEGER NOT NULL CHECK(niveau IN (1, 2, 3)),
    date_envoi         TEXT    NOT NULL,
    email_destinataire TEXT,
    sujet              TEXT,
    corps              TEXT,
    statut             TEXT    NOT NULL DEFAULT 'envoye'
                       CHECK(statut IN ('envoye', 'erreur')),
    erreur_message     TEXT,
    created_at         TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS relances_config (
    facture_id         INTEGER PRIMARY KEY,
    relances_actives   INTEGER NOT NULL DEFAULT 1,
    updated_at         TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
  );
`);

// Table audit_log — P1.9 : traçabilité des actions sensibles
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    action      TEXT    NOT NULL,
    details     TEXT,
    ip_address  TEXT,
    created_at  TEXT    DEFAULT (datetime('now'))
  );
`);

// Initialisation / migration du compte utilisateur
function initUser() {
  // Credentials lus depuis .env — jamais hardcodés dans le code source
  const emailCible = process.env.ADMIN_EMAIL;
  const motDePasse = process.env.ADMIN_PASSWORD;

  if (!emailCible || !motDePasse) {
    logger.warn('ADMIN_EMAIL ou ADMIN_PASSWORD manquant dans .env — compte utilisateur non initialisé');
    return;
  }

  // Compte cible déjà présent — rien à faire
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(emailCible)) return;

  const hash = bcrypt.hashSync(motDePasse, 12);
  const ancienAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@solofin.local');

  if (ancienAdmin) {
    // Migration : renommer l'ancien compte + nouveau mot de passe
    db.prepare('UPDATE users SET email = ?, password = ? WHERE id = ?')
      .run(emailCible, hash, ancienAdmin.id);
    logger.info(`Compte migré : admin@solofin.local → ${emailCible}`);
  } else {
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(emailCible, hash);
    logger.info(`Compte créé : ${emailCible}`);
  }
}

initUser();

module.exports = db;

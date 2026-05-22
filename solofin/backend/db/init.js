// Initialisation de la base de données SQLite (node:sqlite natif Node.js v22+)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcrypt');

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
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    date_depense  TEXT    NOT NULL,
    fournisseur   TEXT    NOT NULL,
    montant_ttc   REAL    NOT NULL,
    taux_tva      REAL    NOT NULL,
    montant_ht    REAL    NOT NULL,
    tva_deductible REAL   NOT NULL,
    categorie     TEXT    NOT NULL,
    description   TEXT,
    created_at    TEXT    DEFAULT (datetime('now'))
  );
`);

// Créer le compte admin au premier démarrage s'il n'existe pas
function initAdminUser() {
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@solofin.local');
  if (!user) {
    const hash = bcrypt.hashSync('solofin2026', 12);
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run('admin@solofin.local', hash);
    console.log('Compte admin créé : admin@solofin.local');
  }
}

initAdminUser();

module.exports = db;

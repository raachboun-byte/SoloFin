import { useState, useEffect, useCallback } from 'react';
import {
  listerFichiersDrive,
  parserFichierDrive,
  importerTransactions,
  importerConsultation,
  historiqueImports,
} from '../api/drive';

// Types MIME reconnus comme dossiers Google Drive
const MIME_FOLDER = 'application/vnd.google-apps.folder';

export default function DriveImport({ isDesktop }) {
  // Navigation arborescence
  const [breadcrumb, setBreadcrumb] = useState([{ id: 'root', name: 'Mon Drive' }]);
  const [fichiers,   setFichiers]   = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreurNav,  setErreurNav]  = useState(null);

  // Parsing
  const [fichierSelectionne, setFichierSelectionne] = useState(null);
  const [parsing,    setParsing]    = useState(false);
  const [resultParse, setResultParse] = useState(null); // { transactions, parsing_ok, message }
  const [erreurParse, setErreurParse] = useState(null);

  // Sélection des transactions à importer
  const [selectionnes, setSelectionnes] = useState({}); // { index: bool }

  // Import
  const [importing, setImporting] = useState(false);
  const [resultImport, setResultImport] = useState(null);

  // Historique
  const [historique, setHistorique] = useState([]);
  const [onglet, setOnglet] = useState('browser'); // 'browser' | 'historique'

  // ── Navigation ──────────────────────────────────────────────
  const dossierCourant = breadcrumb[breadcrumb.length - 1];

  const chargerDossier = useCallback(async (folderId) => {
    setChargement(true);
    setErreurNav(null);
    setFichierSelectionne(null);
    setResultParse(null);
    setResultImport(null);
    try {
      const liste = await listerFichiersDrive(folderId);
      setFichiers(liste);
    } catch (err) {
      setErreurNav(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { chargerDossier('root'); }, [chargerDossier]);

  function entrerDossier(fichier) {
    setBreadcrumb(bc => [...bc, { id: fichier.id, name: fichier.name }]);
    chargerDossier(fichier.id);
  }

  function allerVers(index) {
    const nouveau = breadcrumb.slice(0, index + 1);
    setBreadcrumb(nouveau);
    chargerDossier(nouveau[nouveau.length - 1].id);
  }

  // ── Parsing ─────────────────────────────────────────────────
  async function selectionnerFichier(fichier) {
    setFichierSelectionne(fichier);
    setResultParse(null);
    setResultImport(null);
    setErreurParse(null);
    setParsing(true);
    try {
      const result = await parserFichierDrive(fichier.id, fichier.name);
      setResultParse(result);
      // Cocher tous les débits par défaut
      const sel = {};
      (result.transactions || []).forEach((t, i) => { if (t.type === 'debit') sel[i] = true; });
      setSelectionnes(sel);
    } catch (err) {
      setErreurParse(err.message);
    } finally {
      setParsing(false);
    }
  }

  function toggleTransaction(index) {
    setSelectionnes(s => ({ ...s, [index]: !s[index] }));
  }

  function toutSelectionner(val) {
    const sel = {};
    (resultParse?.transactions || []).forEach((t, i) => { if (t.type === 'debit') sel[i] = val; });
    setSelectionnes(sel);
  }

  // ── Import ──────────────────────────────────────────────────
  async function handleImporter() {
    if (!fichierSelectionne || !resultParse) return;
    setImporting(true);
    setResultImport(null);
    try {
      const transactionsChoisies = (resultParse.transactions || []).filter((_, i) => selectionnes[i]);
      const result = await importerTransactions(
        fichierSelectionne.id,
        fichierSelectionne.name,
        'releve_bancaire',
        transactionsChoisies
      );
      setResultImport(result);
      chargerHistorique();
    } catch (err) {
      setResultImport({ erreur: err.message });
    } finally {
      setImporting(false);
    }
  }

  async function handleImporterConsultation() {
    if (!fichierSelectionne) return;
    setImporting(true);
    try {
      await importerConsultation(fichierSelectionne.id, fichierSelectionne.name, 'autre');
      setResultImport({ consultation: true });
      chargerHistorique();
    } catch (err) {
      setResultImport({ erreur: err.message });
    } finally {
      setImporting(false);
    }
  }

  // ── Historique ───────────────────────────────────────────────
  async function chargerHistorique() {
    try {
      const rows = await historiqueImports();
      setHistorique(rows);
    } catch {}
  }

  useEffect(() => { chargerHistorique(); }, []);

  // ── Styles ───────────────────────────────────────────────────
  const s = {
    page: { padding: isDesktop ? '28px 0' : '16px 12px' },
    hero: {
      background: 'linear-gradient(135deg, var(--navy) 0%, #1e3a5f 100%)',
      borderRadius: isDesktop ? 16 : 0,
      padding: isDesktop ? '28px 32px' : '20px 16px',
      marginBottom: 24,
      color: '#fff',
    },
    heroTitre: { fontFamily: 'Lato, sans-serif', fontWeight: 900, fontSize: isDesktop ? '1.6rem' : '1.3rem', marginBottom: 4 },
    heroSub: { color: 'rgba(255,255,255,.65)', fontSize: '.88rem' },
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: 16 },
    onglets: { display: 'flex', gap: 8, marginBottom: 20 },
    ongletBtn: (actif) => ({
      padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem',
      background: actif ? 'var(--orange)' : '#f3f4f6', color: actif ? '#fff' : '#374151',
    }),
    breadcrumb: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 12, fontSize: '.85rem', color: '#6b7280' },
    bcPart: (cliquable) => ({ cursor: cliquable ? 'pointer' : 'default', color: cliquable ? 'var(--navy)' : '#374151', fontWeight: cliquable ? 600 : 700 }),
    fichierLigne: (estDossier) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 8, cursor: 'pointer', marginBottom: 4,
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      transition: 'background .15s',
    }),
    fichierNom: { flex: 1, fontSize: '.88rem', fontWeight: 500, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    fichierType: { fontSize: '.75rem', color: '#9ca3af' },
    btnPrimaire: {
      background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8,
      padding: '10px 22px', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
    },
    btnSecondaire: {
      background: '#fff', color: 'var(--navy)', border: '1.5px solid var(--navy)', borderRadius: 8,
      padding: '10px 22px', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
    },
    tableauWrapper: { overflowX: 'auto', marginTop: 12 },
    tableau: { width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' },
    th: { background: '#f3f4f6', padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb' },
    td: { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', color: '#374151' },
    badge: (type) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '.72rem', fontWeight: 700,
      background: type === 'debit' ? '#fee2e2' : '#d1fae5',
      color: type === 'debit' ? '#991b1b' : '#065f46',
    }),
    alerte: (type) => ({
      borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: '.88rem',
      background: type === 'succes' ? '#d1fae5' : type === 'info' ? '#eff6ff' : '#fee2e2',
      color:      type === 'succes' ? '#065f46' : type === 'info' ? '#1e40af' : '#991b1b',
      border: `1px solid ${type === 'succes' ? '#6ee7b7' : type === 'info' ? '#bfdbfe' : '#fca5a5'}`,
    }),
  };

  const isPDF = (f) => f.mimeType === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf');
  const nbSelectionnes = Object.values(selectionnes).filter(Boolean).length;
  const nbDebits = (resultParse?.transactions || []).filter(t => t.type === 'debit').length;

  return (
    <div style={s.page}>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroTitre}>📁 Import Google Drive</div>
        <div style={s.heroSub}>Naviguez dans votre Drive, sélectionnez un relevé bancaire PDF et importez les transactions.</div>
      </div>

      {/* Onglets */}
      <div style={s.onglets}>
        <button style={s.ongletBtn(onglet === 'browser')}    onClick={() => setOnglet('browser')}>Naviguer Drive</button>
        <button style={s.ongletBtn(onglet === 'historique')} onClick={() => { setOnglet('historique'); chargerHistorique(); }}>Historique imports</button>
      </div>

      {/* ── ONGLET BROWSER ────────────────────────────── */}
      {onglet === 'browser' && (
        <>
          {/* Breadcrumb */}
          <div style={s.breadcrumb}>
            {breadcrumb.map((bc, i) => (
              <span key={bc.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span style={{ color: '#d1d5db' }}>›</span>}
                <span style={s.bcPart(i < breadcrumb.length - 1)} onClick={() => i < breadcrumb.length - 1 && allerVers(i)}>
                  {bc.name}
                </span>
              </span>
            ))}
          </div>

          {erreurNav && <div style={s.alerte('erreur')}>{erreurNav}</div>}

          {/* Liste des fichiers */}
          <div style={s.card}>
            {chargement ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>Chargement…</div>
            ) : fichiers.length === 0 ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: 24, fontSize: '.88rem' }}>Dossier vide.</div>
            ) : (
              fichiers.map(f => (
                <div
                  key={f.id}
                  style={s.fichierLigne(f.mimeType === MIME_FOLDER)}
                  onClick={() => f.mimeType === MIME_FOLDER ? entrerDossier(f) : isPDF(f) ? selectionnerFichier(f) : null}
                >
                  <span style={{ fontSize: '1.1rem' }}>
                    {f.mimeType === MIME_FOLDER ? '📂' : isPDF(f) ? '📄' : '📎'}
                  </span>
                  <span style={s.fichierNom}>{f.name}</span>
                  {isPDF(f) && (
                    <span style={{ fontSize: '.75rem', color: 'var(--orange)', fontWeight: 700 }}>Sélectionner</span>
                  )}
                  {!isPDF(f) && f.mimeType !== MIME_FOLDER && (
                    <span style={s.fichierType}>{f.mimeType?.split('/')[1] || 'fichier'}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Parsing en cours */}
          {parsing && (
            <div style={{ ...s.alerte('info'), display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>⏳</span> Analyse du PDF en cours…
            </div>
          )}

          {/* Résultat du parsing */}
          {!parsing && resultParse && (
            <div style={s.card}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 8, fontSize: '.95rem' }}>
                📄 {fichierSelectionne?.name}
              </div>

              {/* Parsing KO → consultation */}
              {!resultParse.parsing_ok && (
                <>
                  <div style={s.alerte('info')}>{resultParse.message}</div>
                  {!resultImport && (
                    <button style={s.btnSecondaire} onClick={handleImporterConsultation} disabled={importing}>
                      {importing ? 'Enregistrement…' : 'Enregistrer pour consultation'}
                    </button>
                  )}
                </>
              )}

              {/* Parsing OK → tableau de transactions */}
              {resultParse.parsing_ok && (
                <>
                  <div style={{ marginBottom: 12, fontSize: '.85rem', color: '#6b7280' }}>
                    {resultParse.nb_lignes} lignes détectées — {nbDebits} débits sélectionnables
                  </div>

                  {/* Actions sélection */}
                  {!resultImport && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <button style={{ ...s.btnSecondaire, padding: '6px 14px', fontSize: '.8rem' }} onClick={() => toutSelectionner(true)}>
                        Tout sélectionner
                      </button>
                      <button style={{ ...s.btnSecondaire, padding: '6px 14px', fontSize: '.8rem' }} onClick={() => toutSelectionner(false)}>
                        Tout désélectionner
                      </button>
                    </div>
                  )}

                  {/* Tableau */}
                  <div style={s.tableauWrapper}>
                    <table style={s.tableau}>
                      <thead>
                        <tr>
                          {!resultImport && <th style={s.th}>✓</th>}
                          <th style={s.th}>Date</th>
                          <th style={s.th}>Libellé</th>
                          <th style={s.th}>Type</th>
                          <th style={{ ...s.th, textAlign: 'right' }}>Montant €</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultParse.transactions.map((t, i) => (
                          <tr key={i} style={{ background: selectionnes[i] ? '#fff7ed' : 'transparent' }}>
                            {!resultImport && (
                              <td style={s.td}>
                                {t.type === 'debit' ? (
                                  <input type="checkbox" checked={!!selectionnes[i]} onChange={() => toggleTransaction(i)} />
                                ) : <span style={{ color: '#d1d5db' }}>—</span>}
                              </td>
                            )}
                            <td style={s.td}>{t.date}</td>
                            <td style={{ ...s.td, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.libelle}</td>
                            <td style={s.td}><span style={s.badge(t.type)}>{t.type === 'debit' ? 'Débit' : 'Crédit'}</span></td>
                            <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, color: t.type === 'debit' ? '#dc2626' : '#059669' }}>
                              {t.type === 'debit' ? '-' : '+'}{Number(t.montant).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bouton import */}
                  {!resultImport && (
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        style={{ ...s.btnPrimaire, opacity: nbSelectionnes === 0 || importing ? .5 : 1 }}
                        onClick={handleImporter}
                        disabled={nbSelectionnes === 0 || importing}
                      >
                        {importing ? 'Import en cours…' : `Importer ${nbSelectionnes} transaction${nbSelectionnes > 1 ? 's' : ''}`}
                      </button>
                      <span style={{ fontSize: '.82rem', color: '#6b7280' }}>Les crédits ne sont pas importés (suivis via Facturation).</span>
                    </div>
                  )}
                </>
              )}

              {/* Résultat import */}
              {resultImport && !resultImport.erreur && !resultImport.consultation && (
                <div style={s.alerte('succes')}>
                  ✅ {resultImport.importees?.length || 0} transaction{resultImport.importees?.length > 1 ? 's' : ''} importée{resultImport.importees?.length > 1 ? 's' : ''} dans les Notes de frais.
                  {resultImport.erreurs?.length > 0 && ` (${resultImport.erreurs.length} erreur${resultImport.erreurs.length > 1 ? 's' : ''})`}
                </div>
              )}
              {resultImport?.consultation && (
                <div style={s.alerte('succes')}>✅ Document enregistré pour consultation dans l'historique.</div>
              )}
              {resultImport?.erreur && (
                <div style={s.alerte('erreur')}>❌ {resultImport.erreur}</div>
              )}

              {erreurParse && <div style={s.alerte('erreur')}>{erreurParse}</div>}
            </div>
          )}

          {erreurParse && !parsing && !resultParse && (
            <div style={s.alerte('erreur')}>{erreurParse}</div>
          )}
        </>
      )}

      {/* ── ONGLET HISTORIQUE ─────────────────────────── */}
      {onglet === 'historique' && (
        <div style={s.card}>
          {historique.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 24, fontSize: '.88rem' }}>
              Aucun import Drive pour l'instant.
            </div>
          ) : (
            <div style={s.tableauWrapper}>
              <table style={s.tableau}>
                <thead>
                  <tr>
                    <th style={s.th}>Fichier</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Transactions</th>
                    <th style={s.th}>Importé le</th>
                    <th style={s.th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map(row => (
                    <tr key={row.id}>
                      <td style={{ ...s.td, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.nom_fichier}
                      </td>
                      <td style={s.td}>{row.type_document?.replace('_', ' ')}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{row.nb_transactions ?? '—'}</td>
                      <td style={s.td}>{row.created_at?.slice(0, 10)}</td>
                      <td style={s.td}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '.72rem', fontWeight: 700,
                          background: '#d1fae5', color: '#065f46',
                        }}>
                          {row.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { scannerGmail, importerGmail } from '../api/gmail';

const fmt = (n) => n != null
  ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  : '—';

export default function GmailImport({ isDesktop, onNav }) {
  const [googleConnecte, setGoogleConnecte] = useState(null); // null=chargement, true/false
  const [jours,          setJours]          = useState(30);
  const [scanning,       setScanning]       = useState(false);
  const [importing,      setImporting]      = useState(false);
  const [emails,         setEmails]         = useState([]);
  const [selectionnes,   setSelectionnes]   = useState(new Set());
  const [resultat,       setResultat]       = useState(null); // { importes, erreurs }
  const [erreurScan,     setErreurScan]     = useState(null);
  const [scanned,        setScanned]        = useState(false);

  // Vérifier si Google est connecté
  useEffect(() => {
    fetch('/api/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setGoogleConnecte(d.data?.google_connected || false))
      .catch(() => setGoogleConnecte(false));
  }, []);

  async function lancerScan() {
    setScanning(true);
    setErreurScan(null);
    setEmails([]);
    setSelectionnes(new Set());
    setResultat(null);
    try {
      const rep = await scannerGmail(jours);
      if (rep.error) { setErreurScan(rep.error); return; }
      setEmails(rep.data || []);
      setScanned(true);
    } catch {
      setErreurScan('Erreur réseau — vérifiez que le backend est démarré');
    } finally {
      setScanning(false);
    }
  }

  function toggleEmail(id) {
    setSelectionnes(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toutSelectionner() {
    const eligibles = emails.filter(e => e.statut !== 'importe');
    if (selectionnes.size === eligibles.length) {
      setSelectionnes(new Set());
    } else {
      setSelectionnes(new Set(eligibles.map(e => e.gmail_msg_id)));
    }
  }

  async function lancerImport() {
    const emailsChoisis = emails.filter(e => selectionnes.has(e.gmail_msg_id));
    if (emailsChoisis.length === 0) return;

    setImporting(true);
    setResultat(null);
    try {
      const rep = await importerGmail(emailsChoisis);
      if (rep.error) { setErreurScan(rep.error); return; }
      setResultat(rep.data);
      // Marquer les importés dans la liste locale
      setEmails(prev => prev.map(e => {
        const ok = rep.data.importes?.find(i => i.gmail_msg_id === e.gmail_msg_id);
        return ok ? { ...e, statut: 'importe' } : e;
      }));
      setSelectionnes(new Set());
    } catch {
      setErreurScan('Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  }

  const eligibles = emails.filter(e => e.statut !== 'importe');

  // ── États de chargement ─────────────────────────────────
  if (googleConnecte === null) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--t2)' }}>Chargement…</div>;
  }

  const padH = isDesktop ? {} : { padding: '0 14px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      {!isDesktop && (
        <div style={{ background: 'linear-gradient(135deg,var(--navy),var(--navy2))', padding: '18px 14px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Import</div>
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.3rem', color: '#fff' }}>Gmail</div>
          <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', marginTop: 4 }}>Importer des factures reçues par email</div>
        </div>
      )}

      {isDesktop && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.5rem', color: 'var(--navy)' }}>Import Gmail</div>
          <div style={{ fontSize: '.83rem', color: 'var(--t2)', marginTop: 3 }}>Scannez vos emails et importez les factures reçues en pièce jointe</div>
        </div>
      )}

      {/* ── Google non connecté ──────────────────────────── */}
      {!googleConnecte && (
        <div style={{ ...padH }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--bd)', padding: '32px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🔗</div>
            <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.05rem', color: 'var(--navy)', marginBottom: 8 }}>Compte Google non connecté</div>
            <div style={{ fontSize: '.84rem', color: 'var(--t2)', maxWidth: 340, margin: '0 auto 20px' }}>
              Pour importer des factures depuis Gmail, connectez votre compte Google dans les Paramètres.
            </div>
            <a href="#parametres" onClick={e => { e.preventDefault(); onNav?.('parametres'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--navy)', color: '#fff', borderRadius: 9, fontSize: '.88rem', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
              ⚙️ Aller dans Paramètres
            </a>
          </div>
        </div>
      )}

      {/* ── Panneau de scan ─────────────────────────────── */}
      {googleConnecte && (
        <div style={{ ...padH }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--bd)', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--t2)', whiteSpace: 'nowrap' }}>Période :</label>
              <select value={jours} onChange={e => setJours(Number(e.target.value))}
                style={{ border: '1.5px solid var(--bd)', borderRadius: 7, padding: '7px 10px', fontSize: '.88rem', fontWeight: 600, color: 'var(--t)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option value={7}>7 derniers jours</option>
                <option value={14}>14 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={60}>60 derniers jours</option>
                <option value={90}>90 derniers jours</option>
              </select>
            </div>
            <button onClick={lancerScan} disabled={scanning}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: scanning ? 'var(--mu)' : 'var(--navy)', color: '#fff', border: 'none', borderRadius: 9, fontSize: '.88rem', fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {scanning ? '⏳ Scan en cours…' : '🔍 Scanner Gmail'}
            </button>
          </div>
        </div>
      )}

      {/* ── Erreur ──────────────────────────────────────── */}
      {erreurScan && (
        <div style={{ ...padH }}>
          <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: '.85rem', fontWeight: 600 }}>
            ⚠️ {erreurScan}
          </div>
        </div>
      )}

      {/* ── Résultats du scan ───────────────────────────── */}
      {scanned && !scanning && googleConnecte && (
        <div style={{ ...padH }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--bd)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

            {/* En-tête liste */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--bd)' }}>
              <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '.95rem', color: 'var(--navy)' }}>
                {emails.length === 0 ? 'Aucune facture détectée' : `${emails.length} email${emails.length > 1 ? 's' : ''} détecté${emails.length > 1 ? 's' : ''}`}
              </div>
              {eligibles.length > 0 && (
                <button onClick={toutSelectionner}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: 'var(--orange)', fontWeight: 700, fontFamily: 'inherit' }}>
                  {selectionnes.size === eligibles.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>

            {/* Liste vide */}
            {emails.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 14px' }}>
                <div style={{ fontSize: '2.4rem', opacity: .18, marginBottom: 8 }}>📧</div>
                <div style={{ fontSize: '.84rem', color: 'var(--mu)', fontWeight: 600 }}>Aucune facture PDF trouvée sur cette période</div>
                <div style={{ fontSize: '.76rem', color: 'var(--mu)', marginTop: 6 }}>Essayez d'élargir la période de scan</div>
              </div>
            )}

            {/* Lignes email */}
            {emails.map((email, idx) => {
              const dejaImporte = email.statut === 'importe';
              const selectionne = selectionnes.has(email.gmail_msg_id);
              return (
                <div key={email.gmail_msg_id}
                  onClick={() => !dejaImporte && toggleEmail(email.gmail_msg_id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    borderBottom: idx < emails.length - 1 ? '1px solid var(--bd)' : 'none',
                    cursor: dejaImporte ? 'default' : 'pointer',
                    background: selectionne ? '#fff5ef' : dejaImporte ? '#f8fafc' : '#fff',
                    opacity: dejaImporte ? 0.6 : 1,
                    transition: 'background .1s',
                  }}>

                  {/* Checkbox */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    border: selectionne ? '2px solid var(--orange)' : '2px solid var(--bd)',
                    background: selectionne ? 'var(--orange)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '.8rem', fontWeight: 900,
                  }}>
                    {selectionne && '✓'}
                  </div>

                  {/* Icône */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📄</div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.sujet}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--t2)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{email.expediteur}</span>
                      <span style={{ color: 'var(--mu)' }}>·</span>
                      <span>{email.nb_pj ?? email.nb_pdf ?? 0} pièce{(email.nb_pj ?? email.nb_pdf ?? 0) > 1 ? 's' : ''} jointe{(email.nb_pj ?? email.nb_pdf ?? 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Statut + date */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {dejaImporte
                      ? <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700 }}>Importé</span>
                      : <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700 }}>Nouveau</span>
                    }
                    <div style={{ fontSize: '.7rem', color: 'var(--mu)', marginTop: 3 }}>
                      {email.date_email ? new Date(email.date_email).toLocaleDateString('fr-FR') : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Barre d'action import */}
            {selectionnes.size > 0 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--bd)', background: '#fffbf5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '.84rem', fontWeight: 700, color: 'var(--navy)' }}>
                  {selectionnes.size} email{selectionnes.size > 1 ? 's' : ''} sélectionné{selectionnes.size > 1 ? 's' : ''}
                </div>
                <button onClick={lancerImport} disabled={importing}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: importing ? 'var(--mu)' : 'var(--orange)', color: '#fff', border: 'none', borderRadius: 9, fontSize: '.88rem', fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,102,0,.22)' }}>
                  {importing ? '⏳ Import en cours…' : `⬇️ Importer (${selectionnes.size})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Résultats de l'import ───────────────────────── */}
      {resultat && (
        <div style={{ ...padH }}>
          {resultat.importes?.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '.9rem', marginBottom: 8 }}>
                ✅ {resultat.importes.length} dépense{resultat.importes.length > 1 ? 's' : ''} créée{resultat.importes.length > 1 ? 's' : ''}
              </div>
              {resultat.importes.map(i => (
                <div key={i.gmail_msg_id} style={{ fontSize: '.82rem', color: '#15803d', display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #dcfce7' }}>
                  <span>{i.fournisseur}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(i.montant_ttc)}</span>
                </div>
              ))}
              <div style={{ fontSize: '.76rem', color: '#16a34a', marginTop: 8, fontWeight: 600 }}>
                Les dépenses sont disponibles dans la section Notes de frais
              </div>
            </div>
          )}
          {resultat.erreurs?.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '.9rem', marginBottom: 6 }}>
                ⚠️ {resultat.erreurs.length} erreur{resultat.erreurs.length > 1 ? 's' : ''}
              </div>
              {resultat.erreurs.map(e => (
                <div key={e.gmail_msg_id} style={{ fontSize: '.82rem', color: '#991b1b' }}>{e.message}</div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

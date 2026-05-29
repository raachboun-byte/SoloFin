import { useState, useEffect } from 'react';
import { listerDepenses, creerDepense, modifierDepense, supprimerDepense, uploadPieceJointe, supprimerPieceJointe, ocrFichier } from '../api/frais';

const CATS    = ['Abonnement','Matériel','Déplacement','Restaurant','Hébergement','Télécom','Formation','Divers'];
const CATS_IC = { Abonnement:'💻', Matériel:'📦', Déplacement:'🚆', Restaurant:'🍽️', Hébergement:'🏨', Télécom:'📱', Formation:'📚', Divers:'📎' };

const fmt  = n => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(n || 0);
const fmtD = d => new Date(d).toLocaleDateString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

// "2026-03" → "Mars 2026"
const NOMS_MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmtMois = m => { const [a, mo] = m.split('-'); return `${NOMS_MOIS[parseInt(mo)]} ${a}`; };

export default function Frais({ isDesktop = false }) {
  const [depenses, setDepenses]         = useState([]);
  const [chargement, setChargement]     = useState(true);
  const [modal, setModal]               = useState(null);
  const [toast, setToast]               = useState(null);
  const [filtreMois, setFiltreMois]     = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    listerDepenses()
      .then(r => setDepenses(r.data || []))
      .catch(() => showToast('Erreur de chargement', 'error'))
      .finally(() => setChargement(false));
  }, []);

  const totalTTC = depenses.reduce((s, d) => s + d.montant_ttc, 0);
  const totalTVA = depenses.reduce((s, d) => s + d.tva_deductible, 0);

  // Mois disponibles triés du plus récent au plus ancien
  const moisDispos = [...new Set(depenses.map(d => d.date_depense.slice(0, 7)))].sort().reverse();

  // Liste filtrée pour l'affichage
  const depensesFiltrees = depenses.filter(d => {
    if (filtreMois      && !d.date_depense.startsWith(filtreMois)) return false;
    if (filtreCategorie && d.categorie !== filtreCategorie)         return false;
    return true;
  });

  const handleSave = async (formData, fichier, supprimerRecu) => {
    try {
      let depense;
      if (modal?.data) {
        const r = await modifierDepense(modal.data.id, formData);
        if (r.error) throw new Error(r.error);
        depense = r.data;
      } else {
        const r = await creerDepense(formData);
        if (r.error) throw new Error(r.error);
        depense = r.data;
      }

      // Gérer la pièce jointe après la sauvegarde des champs texte
      if (supprimerRecu && depense.piece_jointe) {
        const r2 = await supprimerPieceJointe(depense.id);
        if (!r2.error) depense = r2.data;
      } else if (fichier) {
        const r2 = await uploadPieceJointe(depense.id, fichier);
        if (!r2.error) depense = r2.data;
      }

      if (modal?.data) {
        setDepenses(p => p.map(d => d.id === depense.id ? depense : d));
        showToast('Mise à jour ✓');
      } else {
        setDepenses(p => [depense, ...p]);
        showToast('Dépense enregistrée ✓');
      }
      setModal(null);
    } catch {
      showToast("Erreur lors de l'enregistrement", 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const r = await supprimerDepense(id);
      if (r.error) throw new Error(r.error);
      setDepenses(p => p.filter(d => d.id !== id));
      showToast('Supprimée', 'info');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Hero — mobile uniquement */}
      {!isDesktop && (
        <div style={{ background:'var(--navy)', padding:'16px 14px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-20, top:-20, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
          <div style={{ fontFamily:'Lato,sans-serif', fontWeight:900, fontSize:'1.15rem', color:'#fff' }}>Dépenses</div>
          <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.55)', marginTop:2 }}>Notes de frais & charges professionnelles</div>
        </div>
      )}

      {/* Bouton ajouter */}
      <div style={{ padding: isDesktop ? 0 : '0 14px' }}>
        <button
          onClick={() => setModal({ data: null })}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', padding:'10px 18px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:10, fontSize:'.88rem', fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(255,102,0,.22)', fontFamily:'inherit' }}
        >
          + Ajouter une dépense
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding: isDesktop ? 0 : '0 14px' }}>
        <KpiCard label="Total TTC" value={fmt(totalTTC)} sub={`${depenses.length} dépense${depenses.length !== 1 ? 's' : ''}`} accentColor="var(--re)" />
        <KpiCard label="TVA déductible" value={fmt(totalTVA)} sub="À récupérer" accentColor="var(--gr)" valueColor="var(--gr)" />
      </div>

      {/* Liste des dépenses */}
      <div style={{ margin: isDesktop ? 0 : '0 14px 14px', background:'#fff', borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05)', border:'1px solid var(--bd)', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px 8px' }}>
          <div style={{ fontFamily:'Lato,sans-serif', fontWeight:900, fontSize:'.95rem', color:'var(--navy)', marginBottom:10 }}>Toutes les dépenses</div>

          {/* Filtres mois / catégorie */}
          {!chargement && depenses.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <select
                value={filtreMois}
                onChange={e => setFiltreMois(e.target.value)}
                style={{ flex:1, minWidth:120, border:'1.5px solid var(--bd)', borderRadius:7, padding:'6px 10px', fontSize:'.78rem', color:'var(--navy)', background:'#f8f9fa', cursor:'pointer', fontFamily:'inherit' }}
              >
                <option value="">Tous les mois</option>
                {moisDispos.map(m => <option key={m} value={m}>{fmtMois(m)}</option>)}
              </select>
              <select
                value={filtreCategorie}
                onChange={e => setFiltreCategorie(e.target.value)}
                style={{ flex:1, minWidth:120, border:'1.5px solid var(--bd)', borderRadius:7, padding:'6px 10px', fontSize:'.78rem', color:'var(--navy)', background:'#f8f9fa', cursor:'pointer', fontFamily:'inherit' }}
              >
                <option value="">Toutes catégories</option>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        {chargement && (
          <div style={{ textAlign:'center', padding:'40px 14px', color:'var(--mu)', fontSize:'.84rem' }}>Chargement…</div>
        )}

        {!chargement && depenses.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 14px' }}>
            <div style={{ fontSize:'2.4rem', opacity:.18, marginBottom:8 }}>💸</div>
            <div style={{ fontSize:'.83rem', color:'var(--mu)', fontWeight:600 }}>Aucune dépense enregistrée</div>
          </div>
        )}

        {!chargement && depensesFiltrees.length === 0 && depenses.length > 0 && (
          <div style={{ textAlign:'center', padding:'32px 14px', color:'var(--mu)', fontSize:'.83rem' }}>
            Aucune dépense pour ce filtre.
          </div>
        )}

        {!chargement && depensesFiltrees.map(d => (
          <LigneDepense
            key={d.id}
            d={d}
            onEdit={() => setModal({ data: d })}
            onDelete={() => handleDelete(d.id)}
          />
        ))}
      </div>

      {/* Modal ajout / modification */}
      {modal && (
        <ModalDepense
          init={modal.data}
          isDesktop={isDesktop}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:76, right:14, left:14, zIndex:200, pointerEvents:'none' }}>
          <div style={{
            background: toast.type === 'success' ? 'var(--gr)' : toast.type === 'error' ? 'var(--re)' : 'var(--navy)',
            color:'#fff', padding:'11px 16px', borderRadius:10, boxShadow:'0 6px 20px rgba(0,0,0,.22)',
            fontSize:'.84rem', fontWeight:600, display:'flex', alignItems:'center', gap:9,
          }}>
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Composant ligne dépense ──────────────────────────────────── */
function LigneDepense({ d, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onEdit}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display:'flex', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--bd)', gap:12, cursor:'pointer', minHeight:56, background: hover ? '#fafbfc' : '' }}
    >
      <div style={{ width:36, height:36, borderRadius:9, background:'#f0f2f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
        {CATS_IC[d.categorie] || '💸'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.fournisseur}</div>
        <div style={{ fontSize:'.72rem', color:'var(--t2)', marginTop:2, display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
          <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:20, fontSize:'.67rem', fontWeight:700, background:'#eff6ff', color:'var(--navy)' }}>{d.categorie}</span>
          {d.description && <span style={{ color:'var(--mu)' }}>{d.description}</span>}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
        <div style={{ fontFamily:'Lato,sans-serif', fontWeight:700, fontSize:'.9rem', color:'var(--navy)' }}>{fmt(d.montant_ttc)}</div>
        <div style={{ fontSize:'.7rem', color:'var(--mu)' }}>{fmtD(d.date_depense)}</div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {d.piece_jointe && (
            <a
              href={`/uploads/${d.piece_jointe}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title="Voir le reçu"
              style={{ textDecoration:'none', fontSize:'.8rem', lineHeight:1 }}
            >
              📎
            </a>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background:'transparent', color:'var(--re)', border:'none', borderRadius:5, padding:'2px 5px', fontSize:'.76rem', cursor:'pointer' }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── KPI card ─────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, accentColor, valueColor }) {
  return (
    <div style={{ background:'#fff', borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05)', border:'1px solid var(--bd)', padding:16, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:accentColor, borderRadius:'10px 0 0 10px' }}/>
      <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', color:'var(--mu)', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'Lato,sans-serif', fontWeight:900, fontSize:'1.35rem', color: valueColor || accentColor, letterSpacing:'-.3px', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:'.68rem', color:'var(--mu)', marginTop:5, fontWeight:600 }}>{sub}</div>}
    </div>
  );
}

/* ── Modal formulaire ─────────────────────────────────────────── */
const FI = {
  width:'100%', background:'#fff', border:'1.5px solid var(--bd)', borderRadius:6,
  padding:'10px 12px', color:'var(--t)', fontSize:'.9rem', fontFamily:'inherit',
  outline:'none', minHeight:42,
};

function ModalDepense({ init, isDesktop = false, onClose, onSave }) {
  const [form, setForm] = useState({
    date_depense: init?.date_depense || today(),
    fournisseur:  init?.fournisseur  || '',
    montant_ttc:  init?.montant_ttc  || '',
    taux_tva:     init?.taux_tva     ?? 20,
    categorie:    init?.categorie    || 'Divers',
    description:  init?.description  || '',
  });
  const [fichier, setFichier]             = useState(null);
  const [supprimerRecu, setSupprimerRecu] = useState(false);
  const [extraction, setExtraction]       = useState(null); // null | 'en_cours' | 'ok' | 'vide' | 'heic' | {erreur: string}


  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFichierChange = async (f) => {
    setFichier(f);
    setSupprimerRecu(false);
    setExtraction(null);
    // OCR déclenché pour images (tous formats courants mobile/desktop) et PDFs
    const typesOCR      = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const typesNonSupp  = ['image/heic', 'image/heif'];
    if (!f) return;
    if (typesNonSupp.includes(f.type)) {
      setExtraction('heic');
      return;
    }
    // Fallback : si le type est inconnu mais que c'est une image, on tente quand même
    if (!typesOCR.includes(f.type) && !f.type.startsWith('image/')) return;
    setExtraction('en_cours');
    try {
      const r = await ocrFichier(f);
      if (r.error) { setExtraction({ erreur: r.error }); return; }
      if (!r.data) { setExtraction('vide'); return; }
      const { date_depense, montant_ttc, fournisseur, categorie } = r.data;
      if (!date_depense && !montant_ttc && !fournisseur) { setExtraction('vide'); return; }
      setForm(p => ({
        ...p,
        ...(date_depense  ? { date_depense }  : {}),
        ...(montant_ttc   ? { montant_ttc }   : {}),
        ...(fournisseur   ? { fournisseur }   : {}),
        ...(categorie     ? { categorie }     : {}),
      }));
      setExtraction('ok');
    } catch {
      setExtraction('vide');
    }
  };

  const ttc  = parseFloat(form.montant_ttc) || 0;
  const tva  = parseFloat(form.taux_tva) || 0;
  const ht   = ttc / (1 + tva / 100);
  const tvaM = ttc - ht;

  const recuExistant = init?.piece_jointe && !supprimerRecu && !fichier;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', padding:24, boxShadow:'0 8px 40px rgba(0,0,0,.16)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontFamily:'Lato,sans-serif', fontWeight:900, fontSize:'1.1rem', color:'var(--navy)' }}>
            {init ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </div>
          <button onClick={onClose} style={{ background:'#f0f2f5', border:'none', borderRadius:7, width:30, height:30, cursor:'pointer', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>✕</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form, fichier, supprimerRecu); }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:13 }}>
            <div>
              <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Date</label>
              <input type="date" style={FI} value={form.date_depense} onChange={e => set('date_depense', e.target.value)} required />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Catégorie</label>
              <select style={{ ...FI, cursor:'pointer' }} value={form.categorie} onChange={e => set('categorie', e.target.value)}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:13 }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Fournisseur</label>
            <input style={FI} value={form.fournisseur} onChange={e => set('fournisseur', e.target.value)} placeholder="SNCF, Amazon…" required />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:13 }}>
            <div>
              <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Montant TTC (€)</label>
              <input type="number" step="0.01" min="0" style={FI} value={form.montant_ttc} onChange={e => set('montant_ttc', e.target.value)} placeholder="0,00" required />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>TVA</label>
              <select style={{ ...FI, cursor:'pointer' }} value={form.taux_tva} onChange={e => set('taux_tva', parseFloat(e.target.value))}>
                <option value={20}>20 %</option>
                <option value={10}>10 %</option>
                <option value={5.5}>5,5 %</option>
                <option value={0}>0 %</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom:13 }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Note</label>
            <input style={FI} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optionnel…" />
          </div>

          {/* Pièce jointe */}
          <div style={{ marginBottom:13 }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:5 }}>Reçu</label>

            {/* Reçu existant */}
            {recuExistant && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'#f0f7ff', border:'1.5px solid #c7d7ff', borderRadius:6, fontSize:'.82rem' }}>
                <span>📎</span>
                <a
                  href={`/uploads/${init.piece_jointe}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color:'var(--navy)', fontWeight:600, flex:1, textDecoration:'none' }}
                >
                  Voir le reçu joint
                </a>
                <button
                  type="button"
                  onClick={() => setSupprimerRecu(true)}
                  style={{ background:'transparent', border:'none', color:'var(--re)', cursor:'pointer', fontSize:'.8rem', fontWeight:700 }}
                >
                  Supprimer
                </button>
              </div>
            )}

            {/* Suppression demandée */}
            {supprimerRecu && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'#fff5f5', border:'1.5px solid #ffcdd2', borderRadius:6, fontSize:'.82rem', color:'var(--re)' }}>
                <span>⚠</span>
                <span style={{ flex:1 }}>Reçu supprimé à la sauvegarde</span>
                <button
                  type="button"
                  onClick={() => setSupprimerRecu(false)}
                  style={{ background:'transparent', border:'none', color:'var(--navy)', cursor:'pointer', fontSize:'.8rem', fontWeight:700 }}
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Input fichier */}
            {!recuExistant && (
              <>
                {/* Deux boutons : Photo (caméra sur mobile, images sur desktop) et Fichier (PDF/image) */}
                <div style={{ display:'flex', gap:8 }}>
                  <label style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 12px', background:'var(--navy)', color:'#fff', borderRadius:8, fontSize:'.82rem', fontWeight:700, cursor:'pointer', textAlign:'center' }}>
                    📷 Photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display:'none' }}
                      onChange={e => handleFichierChange(e.target.files[0] || null)}
                    />
                  </label>
                  <label style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 12px', background:'#f0f2f5', color:'var(--navy)', borderRadius:8, fontSize:'.82rem', fontWeight:700, cursor:'pointer', textAlign:'center' }}>
                    📁 Fichier
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      style={{ display:'none' }}
                      onChange={e => handleFichierChange(e.target.files[0] || null)}
                    />
                  </label>
                </div>
                {fichier && (
                  <div style={{ fontSize:'.72rem', color:'var(--mu)', marginTop:4 }}>
                    {fichier.name}{init?.piece_jointe ? ' — remplace le reçu existant' : ''}
                  </div>
                )}
                <div style={{ fontSize:'.7rem', color:'var(--mu)', marginTop:4 }}>JPG, PNG ou PDF — 10 Mo max — extraction OCR automatique</div>

                {/* Indicateur OCR */}
                {extraction === 'en_cours' && (
                  <div style={{ marginTop:6, padding:'7px 12px', background:'#eff6ff', border:'1.5px solid #c7d7ff', borderRadius:6, fontSize:'.78rem', color:'var(--navy)', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⏳</span>
                    Analyse du justificatif…
                  </div>
                )}
                {extraction === 'ok' && (
                  <div style={{ marginTop:6, padding:'7px 12px', background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:6, fontSize:'.78rem', color:'#166534', display:'flex', alignItems:'center', gap:6 }}>
                    ✨ Champs pré-remplis automatiquement — vérifiez et corrigez si besoin
                  </div>
                )}
                {extraction === 'vide' && (
                  <div style={{ marginTop:6, padding:'7px 12px', background:'#fefce8', border:'1.5px solid #fde047', borderRadius:6, fontSize:'.78rem', color:'#713f12', display:'flex', alignItems:'center', gap:6 }}>
                    ⚠️ Aucune donnée extraite — saisissez les champs manuellement
                  </div>
                )}
                {extraction === 'heic' && (
                  <div style={{ marginTop:6, padding:'7px 12px', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:6, fontSize:'.78rem', color:'#991b1b', display:'flex', alignItems:'center', gap:6 }}>
                    ❌ Format HEIC non supporté — Réglages iPhone → Appareil photo → Formats → Compatibilité maximale (JPEG)
                  </div>
                )}
                {extraction?.erreur && (
                  <div style={{ marginTop:6, padding:'7px 12px', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:6, fontSize:'.78rem', color:'#991b1b', display:'flex', alignItems:'center', gap:6 }}>
                    ❌ {extraction.erreur}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Aperçu montant */}
          {ttc > 0 && (
            <div style={{ background:'#eff6ff', border:'1.5px solid #c7d7ff', borderRadius:6, padding:'12px 14px', marginBottom:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.84rem', padding:'3px 0', color:'var(--t2)' }}>
                <span>HT</span><span>{fmt(ht)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.84rem', padding:'3px 0', color:'var(--t2)' }}>
                <span>TVA {tva}%</span><span>{fmt(tvaM)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.84rem', borderTop:'1px solid #c7d7ff', marginTop:7, paddingTop:8, fontWeight:700, color:'var(--navy)' }}>
                <span>TTC</span><span style={{ color:'var(--orange)' }}>{fmt(ttc)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 18px', background:'#fff', color:'var(--navy)', border:'1.5px solid var(--bd)', borderRadius:10, fontSize:'.88rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Annuler
            </button>
            <button type="submit" style={{ padding:'10px 18px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:10, fontSize:'.88rem', fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(255,102,0,.22)', fontFamily:'inherit' }}>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

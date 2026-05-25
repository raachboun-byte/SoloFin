import { useState, useEffect } from 'react';
import { listerFactures, creerFacture, modifierFacture, supprimerFacture, telechargerPDF, changerStatut } from '../api/factures';
import { listerClients, creerClient, modifierClient, supprimerClient } from '../api/clients';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUTS = {
  brouillon: { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon'  },
  envoyee:   { bg: '#eff6ff', color: '#1d4ed8', label: 'Envoyée'    },
  payee:     { bg: '#f0fdf4', color: '#16a34a', label: 'Payée'      },
  en_retard: { bg: '#fef2f2', color: '#dc2626', label: 'En retard'  },
};

const TVA_OPTIONS = [20, 10, 5.5, 0];

const today = () => new Date().toISOString().split('T')[0];
const todayPlus30 = () => {
  const d = new Date(); d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) + ' €';

const fmtMois = (ym) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  return `${MOIS[parseInt(m) - 1]} ${y}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const FORM_FACTURE_VIDE = {
  client_id: '', mois_prestation: '', nb_jours: '', tjm: '',
  taux_tva: 20, date_emission: today(), date_echeance: todayPlus30(),
};

const FORM_CLIENT_VIDE = { raison_sociale: '', adresse: '', siret: '', tjm: '' };

// ── Composant : badge statut ────────────────────────────
function BadgeStatut({ statut }) {
  const s = STATUTS[statut] || STATUTS.brouillon;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 9px', borderRadius: 20, fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── Composant : carte KPI ───────────────────────────────
function KpiCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: '.7rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: color || 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>{value}</div>
    </div>
  );
}

// Prochaine transition possible par statut
const NEXT_STATUT = {
  brouillon: { statut: 'envoyee', label: 'Marquer envoyée', bg: '#eff6ff', color: '#1d4ed8' },
  envoyee:   { statut: 'payee',   label: 'Marquer payée',   bg: '#f0fdf4', color: '#16a34a' },
  en_retard: { statut: 'payee',   label: 'Marquer payée',   bg: '#f0fdf4', color: '#16a34a' },
};

// ── Composant : ligne facture ───────────────────────────
function LigneFacture({ f, onEdit, onDelete, onChangerStatut, isDesktop }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [statLoading, setStatLoading] = useState(false);

  async function handlePDF() {
    setPdfLoading(true);
    try { await telechargerPDF(f.id, f.numero); }
    catch { alert('Erreur lors de la génération du PDF'); }
    finally { setPdfLoading(false); }
  }

  async function handleChangerStatut(next) {
    setStatLoading(true);
    try { await onChangerStatut(f, next.statut); }
    finally { setStatLoading(false); }
  }

  const next = NEXT_STATUT[f.statut];

  return (
    <div style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
      {/* Infos principales */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>{f.numero}</span>
          <BadgeStatut statut={f.statut} />
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--t2)', marginTop: 3 }}>
          {f.raison_sociale} · {fmtMois(f.mois_prestation)} · {f.nb_jours} j × {fmt(f.tjm)}/j
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--mu)', marginTop: 2 }}>
          Émis le {fmtDate(f.date_emission)} · Échéance {fmtDate(f.date_echeance)}
        </div>
      </div>

      {/* Montants */}
      <div style={{ textAlign: isDesktop ? 'right' : 'left', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>{fmt(f.montant_ttc)}</div>
        <div style={{ fontSize: '.72rem', color: 'var(--t2)' }}>HT : {fmt(f.montant_ht)}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Bouton transition statut */}
        {next && (
          <button onClick={() => handleChangerStatut(next)} disabled={statLoading}
            style={{ padding: '6px 10px', background: next.bg, color: next.color, border: `1.5px solid ${next.color}22`, borderRadius: 7, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, opacity: statLoading ? .6 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {statLoading ? '…' : next.label}
          </button>
        )}
        <button onClick={handlePDF} disabled={pdfLoading} title="Télécharger le PDF"
          style={{ padding: '6px 10px', background: '#f8fafc', color: 'var(--t2)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, opacity: pdfLoading ? .6 : 1 }}>
          {pdfLoading ? '…' : '⬇ PDF'}
        </button>
        {f.statut === 'brouillon' && (
          <>
            <button onClick={() => onEdit(f)} title="Modifier"
              style={{ padding: '6px 10px', background: '#f1f5f9', color: 'var(--t)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '.8rem' }}>
              ✏️
            </button>
            <button onClick={() => onDelete(f)} title="Supprimer"
              style={{ padding: '6px 10px', background: '#fef2f2', color: 'var(--re)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '.8rem' }}>
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Composant : modal facture ───────────────────────────
function ModalFacture({ facture, clients, onSave, onClose }) {
  const [form, setForm]   = useState(facture
    ? { ...facture, taux_tva: Math.round(facture.taux_tva * 100) }
    : { ...FORM_FACTURE_VIDE });
  const [err, setErr]     = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Pré-remplir TJM depuis client sélectionné
  function handleClientChange(cid) {
    set('client_id', cid);
    const c = clients.find(c => String(c.id) === String(cid));
    if (c && !facture) set('tjm', String(c.tjm));
  }

  // Calcul aperçu temps réel
  const previewHT  = (parseFloat(form.nb_jours) || 0) * (parseFloat(form.tjm) || 0);
  const previewTVA = previewHT * ((parseFloat(form.taux_tva) || 0) / 100);
  const previewTTC = previewHT + previewTVA;

  const numeroPreview = form.mois_prestation
    ? `TNS_CONSULTING-${form.mois_prestation}`
    : '—';

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!form.client_id) return setErr('Sélectionnez un client');
    if (!form.mois_prestation) return setErr('Choisissez le mois de prestation');
    if (!form.nb_jours || parseFloat(form.nb_jours) <= 0) return setErr('Nombre de jours invalide');
    if (!form.tjm || parseFloat(form.tjm) <= 0) return setErr('TJM invalide');

    setSaving(true);
    try {
      const r = facture
        ? await modifierFacture(facture.id, form)
        : await creerFacture(form);
      if (r.error) return setErr(r.error);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid var(--bd)', borderRadius: 8, fontSize: '.88rem', fontFamily: 'inherit', background: '#fff' };
  const labelStyle = { fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        {/* En-tête */}
        <div style={{ background: 'var(--navy)', padding: '16px 20px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1rem', color: '#fff' }}>
            {facture ? 'Modifier la facture' : 'Nouvelle facture'}
          </span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 7, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Numéro auto (lecture seule) */}
          <div>
            <label style={labelStyle}>N° de facture (auto-généré)</label>
            <div style={{ ...inputStyle, background: '#f8fafc', color: 'var(--t2)', fontFamily: 'monospace', fontSize: '.82rem' }}>
              {numeroPreview}
            </div>
          </div>

          {/* Client */}
          <div>
            <label style={labelStyle}>Client *</label>
            {clients.length === 0
              ? <div style={{ padding: '10px', background: '#fff5ef', border: '1px solid #fed7aa', borderRadius: 8, fontSize: '.82rem', color: '#c2410c' }}>
                  Aucun client — créez d'abord un client dans le carnet clients ci-dessous.
                </div>
              : <select value={form.client_id} onChange={e => handleClientChange(e.target.value)} required style={inputStyle}>
                  <option value="">Sélectionner un client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.raison_sociale} (TJM: {fmt(c.tjm)})</option>)}
                </select>
            }
          </div>

          {/* Mois de prestation */}
          <div>
            <label style={labelStyle}>Mois de prestation *</label>
            <input type="month" value={form.mois_prestation} onChange={e => set('mois_prestation', e.target.value)} required style={inputStyle} />
          </div>

          {/* Jours + TJM côte à côte */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre de jours *</label>
              <input type="number" min="0.5" step="0.5" value={form.nb_jours} onChange={e => set('nb_jours', e.target.value)} placeholder="17,5" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>TJM (€ HT/j) *</label>
              <input type="number" min="1" step="1" value={form.tjm} onChange={e => set('tjm', e.target.value)} placeholder="750" required style={inputStyle} />
            </div>
          </div>

          {/* TVA */}
          <div>
            <label style={labelStyle}>Taux de TVA</label>
            <select value={form.taux_tva} onChange={e => set('taux_tva', e.target.value)} style={inputStyle}>
              {TVA_OPTIONS.map(t => <option key={t} value={t}>{t} %</option>)}
            </select>
          </div>

          {/* Dates côte à côte */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date d'émission</label>
              <input type="date" value={form.date_emission} onChange={e => set('date_emission', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date d'échéance</label>
              <input type="date" value={form.date_echeance} onChange={e => set('date_echeance', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Aperçu HT / TVA / TTC */}
          {(previewHT > 0) && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '.83rem' }}>
              <span style={{ color: 'var(--t2)' }}>HT : <strong style={{ color: 'var(--navy)' }}>{fmt(previewHT)}</strong></span>
              <span style={{ color: 'var(--t2)' }}>TVA : <strong style={{ color: 'var(--navy)' }}>{fmt(previewTVA)}</strong></span>
              <span style={{ color: 'var(--t2)' }}>TTC : <strong style={{ color: 'var(--orange)', fontSize: '.9rem' }}>{fmt(previewTTC)}</strong></span>
            </div>
          )}

          {err && <div style={{ background: '#fef2f2', color: 'var(--re)', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: '.82rem' }}>{err}</div>}

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 18px', background: '#f1f5f9', color: 'var(--t)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '.87rem', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving || clients.length === 0}
              style={{ padding: '9px 20px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '.87rem', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
              {saving ? 'Enregistrement…' : (facture ? 'Enregistrer' : 'Créer la facture')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Composant : modal client ────────────────────────────
function ModalClient({ client, onSave, onClose }) {
  const [form, setForm]   = useState(client ? { ...client } : { ...FORM_CLIENT_VIDE });
  const [err, setErr]     = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const r = client
        ? await modifierClient(client.id, form)
        : await creerClient(form);
      if (r.error) return setErr(r.error);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid var(--bd)', borderRadius: 8, fontSize: '.88rem', fontFamily: 'inherit' };
  const labelStyle = { fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ background: 'var(--navy)', padding: '16px 20px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1rem', color: '#fff' }}>
            {client ? 'Modifier le client' : 'Nouveau client'}
          </span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 7, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Raison sociale *</label>
            <input type="text" value={form.raison_sociale} onChange={e => set('raison_sociale', e.target.value)} required maxLength={100} placeholder="ACME Corp" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Adresse complète *</label>
            <textarea value={form.adresse} onChange={e => set('adresse', e.target.value)} required rows={3} placeholder={"12 rue de la Paix\n75001 Paris"} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>SIRET (optionnel)</label>
              <input type="text" value={form.siret} onChange={e => set('siret', e.target.value)} maxLength={20} placeholder="123 456 789 00012" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>TJM contractuel (€ HT) *</label>
              <input type="number" min="1" step="1" value={form.tjm} onChange={e => set('tjm', e.target.value)} required placeholder="750" style={inputStyle} />
            </div>
          </div>

          {err && <div style={{ background: '#fef2f2', color: 'var(--re)', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: '.82rem' }}>{err}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 18px', background: '#f1f5f9', color: 'var(--t)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '.87rem', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '9px 20px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '.87rem', fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
              {saving ? 'Enregistrement…' : (client ? 'Enregistrer' : 'Créer le client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale Facturation ─────────────────────────
export default function Facturation({ isDesktop }) {
  const [factures, setFactures]         = useState([]);
  const [clients,  setClients]          = useState([]);
  const [loading,  setLoading]          = useState(true);
  const [filtre,   setFiltre]           = useState('toutes');
  const [showClients, setShowClients]   = useState(false);
  const [modalFacture, setModalFacture] = useState(null); // null | 'nouveau' | objet facture
  const [modalClient,  setModalClient]  = useState(null); // null | 'nouveau' | objet client
  const [confirmDel,   setConfirmDel]   = useState(null); // { type, item }

  async function charger() {
    const [rf, rc] = await Promise.all([listerFactures(), listerClients()]);
    setFactures(rf.data || []);
    setClients(rc.data  || []);
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  // ── KPIs ──
  const kpiFacture = factures.filter(f => f.statut !== 'brouillon').reduce((s, f) => s + f.montant_ht, 0);
  const kpiEncaisse = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ht, 0);
  const kpiAttente  = factures.filter(f => f.statut === 'envoyee' || f.statut === 'en_retard').reduce((s, f) => s + f.montant_ht, 0);

  // ── Filtrage ──
  const FILTRES = [
    { id: 'toutes',    label: 'Toutes'    },
    { id: 'brouillon', label: 'Brouillon' },
    { id: 'envoyee',   label: 'Envoyée'   },
    { id: 'payee',     label: 'Payée'     },
    { id: 'en_retard', label: 'En retard' },
  ];

  const facturesFiltrees = filtre === 'toutes'
    ? factures
    : factures.filter(f => f.statut === filtre);

  // ── Handlers ──
  async function handleChangerStatut(facture, nouveauStatut) {
    const r = await changerStatut(facture.id, nouveauStatut);
    if (r.error) { alert(r.error); return; }
    charger();
  }

  async function handleSupprimerFacture() {
    const { item } = confirmDel;
    const r = await supprimerFacture(item.id);
    if (r.error) { alert(r.error); return; }
    setConfirmDel(null);
    charger();
  }

  async function handleSupprimerClient() {
    const { item } = confirmDel;
    const r = await supprimerClient(item.id);
    if (r.error) { alert(r.error); return; }
    setConfirmDel(null);
    charger();
  }

  const pad   = isDesktop ? 0 : '0 14px';
  const padSt = isDesktop ? { padding: 0 } : { padding: '0 14px' };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--t2)' }}>Chargement…</div>;
  }

  return (
    <div>
      {/* ── Hero (mobile uniquement) ─────────────────── */}
      {!isDesktop && (
        <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)', padding: '22px 18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            TNS Consulting
          </div>
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#fff', marginBottom: 2 }}>Facturation</div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.65)' }}>Créez et gérez vos factures</div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, ...padSt }}>
        <KpiCard label="Total facturé HT"  value={fmt(kpiFacture)}  color="var(--navy)" />
        <KpiCard label="Encaissé HT"       value={fmt(kpiEncaisse)} color="var(--gr)"   />
        <KpiCard label="En attente HT"     value={fmt(kpiAttente)}  color="var(--am)"   />
      </div>

      {/* ── Bouton + filtres ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, ...padSt }}>
        <button onClick={() => setModalFacture('nouveau')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: '.87rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,102,0,.3)' }}>
          + Nouvelle facture
        </button>
      </div>

      {/* ── Onglets filtre ───────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', ...padSt }}>
        {FILTRES.map(ft => (
          <button key={ft.id} onClick={() => setFiltre(ft.id)}
            style={{ padding: '5px 12px', borderRadius: 20, border: filtre === ft.id ? '1.5px solid var(--navy)' : '1.5px solid var(--bd)', background: filtre === ft.id ? 'var(--navy)' : '#fff', color: filtre === ft.id ? '#fff' : 'var(--t2)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {ft.label}
          </button>
        ))}
      </div>

      {/* ── Liste des factures ───────────────────────── */}
      <div style={{ marginBottom: 20, ...padSt }}>
        {facturesFiltrees.length === 0
          ? (
            <div style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 12, padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧾</div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                {filtre === 'toutes' ? 'Aucune facture' : `Aucune facture "${STATUTS[filtre]?.label || filtre}"`}
              </div>
              {filtre === 'toutes' && (
                <div style={{ fontSize: '.84rem', color: 'var(--t2)' }}>
                  {clients.length === 0
                    ? 'Commencez par créer un client dans le carnet clients ci-dessous.'
                    : 'Créez votre première facture avec le bouton + Nouvelle facture.'}
                </div>
              )}
            </div>
          )
          : facturesFiltrees.map(f => (
            <LigneFacture key={f.id} f={f} isDesktop={isDesktop}
              onEdit={() => setModalFacture(f)}
              onDelete={() => setConfirmDel({ type: 'facture', item: f })}
              onChangerStatut={handleChangerStatut}
            />
          ))
        }
      </div>

      {/* ── Carnet clients (section pliable) ─────────── */}
      <div style={{ ...padSt, marginBottom: 32 }}>
        <button onClick={() => setShowClients(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)', padding: 0, marginBottom: showClients ? 12 : 0 }}>
          <span style={{ fontSize: '.75rem', transition: 'transform .2s', display: 'inline-block', transform: showClients ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          Carnet clients ({clients.length})
        </button>

        {showClients && (
          <div>
            <button onClick={() => setModalClient('nouveau')}
              style={{ marginBottom: 10, padding: '7px 14px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', fontFamily: 'inherit' }}>
              + Nouveau client
            </button>

            {clients.length === 0
              ? <div style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 10, padding: '20px', textAlign: 'center', color: 'var(--t2)', fontSize: '.84rem' }}>
                  Aucun client. Créez votre premier client pour pouvoir émettre des factures.
                </div>
              : clients.map(c => (
                <div key={c.id} style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)' }}>{c.raison_sociale}</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--t2)', marginTop: 2 }}>
                      {c.siret ? `SIRET : ${c.siret} · ` : ''}TJM : {fmt(c.tjm)}/j
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModalClient(c)}
                      style={{ padding: '5px 9px', background: '#f1f5f9', color: 'var(--t)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '.8rem' }}>
                      ✏️
                    </button>
                    <button onClick={() => setConfirmDel({ type: 'client', item: c })}
                      style={{ padding: '5px 9px', background: '#fef2f2', color: 'var(--re)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '.8rem' }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* ── Modale facture ────────────────────────────── */}
      {modalFacture && (
        <ModalFacture
          facture={modalFacture === 'nouveau' ? null : modalFacture}
          clients={clients}
          onSave={() => { setModalFacture(null); charger(); }}
          onClose={() => setModalFacture(null)}
        />
      )}

      {/* ── Modale client ─────────────────────────────── */}
      {modalClient && (
        <ModalClient
          client={modalClient === 'nouveau' ? null : modalClient}
          onSave={() => { setModalClient(null); charger(); }}
          onClose={() => setModalClient(null)}
        />
      )}

      {/* ── Confirmation suppression ──────────────────── */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 22px', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: 10 }}>Confirmer la suppression</div>
            <div style={{ fontSize: '.88rem', color: 'var(--t2)', marginBottom: 20 }}>
              {confirmDel.type === 'facture'
                ? `Supprimer la facture "${confirmDel.item.numero}" ? Cette action est irréversible.`
                : `Supprimer le client "${confirmDel.item.raison_sociale}" ?`
              }
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDel(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', color: 'var(--t)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '.87rem', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button onClick={confirmDel.type === 'facture' ? handleSupprimerFacture : handleSupprimerClient}
                style={{ padding: '8px 16px', background: 'var(--re)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '.87rem', fontFamily: 'inherit' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

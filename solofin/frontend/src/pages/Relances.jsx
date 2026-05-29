import { useState, useEffect } from 'react';
import { historiqueRelances } from '../api/relances';

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) + ' €';

const fmtDate = (d) => {
  if (!d) return '—';
  const str = d.split('T')[0];
  const [y, m, day] = str.split('-');
  return `${day}/${m}/${y}`;
};

const fmtDateHeure = (d) => {
  if (!d) return '—';
  const [date, heure] = d.split(' ');
  const [y, m, day] = date.split('-');
  return `${day}/${m}/${y} ${heure?.slice(0, 5) || ''}`;
};

const NIVEAUX = {
  1: { label: 'Rappel J+15',    bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  2: { label: 'Relance J+30',   bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  3: { label: 'Mise en demeure', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

function BadgeNiveau({ niveau }) {
  const n = NIVEAUX[niveau] || NIVEAUX[1];
  return (
    <span style={{ background: n.bg, color: n.color, border: `1px solid ${n.border}`, padding: '2px 8px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {n.label}
    </span>
  );
}

function BadgeStatut({ statut }) {
  const ok = statut === 'envoye';
  return (
    <span style={{ background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {ok ? '✓ Envoyé' : '✗ Erreur'}
    </span>
  );
}

export default function Relances({ isDesktop }) {
  const [relances, setRelances] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreMois,   setFiltreMois]   = useState('');

  async function charger() {
    const r = await historiqueRelances();
    setRelances(r.data || []);
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  // KPIs
  const maintenant = new Date();
  const moisCourant = maintenant.toISOString().slice(0, 7);

  const enRetardActives = new Set(
    relances.filter(r => r.statut === 'envoye').map(r => r.facture_id)
  ).size;

  const envoiesCeMois = relances.filter(r =>
    r.statut === 'envoye' && r.date_envoi?.startsWith(moisCourant)
  ).length;

  const enErreur = relances.filter(r => r.statut === 'erreur').length;

  // Mois disponibles pour le filtre
  const moisDispos = [...new Set(
    relances.map(r => r.date_envoi?.slice(0, 7)).filter(Boolean)
  )].sort((a, b) => b.localeCompare(a));

  // Filtrage
  const relancesFiltrees = relances.filter(r => {
    if (filtreStatut !== 'tous' && r.statut !== filtreStatut) return false;
    if (filtreMois && !r.date_envoi?.startsWith(filtreMois)) return false;
    return true;
  });

  const padSt = isDesktop ? { padding: 0 } : { padding: '0 14px' };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--t2)' }}>Chargement…</div>;
  }

  return (
    <div>
      {/* ── Hero (mobile uniquement) ─────────────────── */}
      {!isDesktop && (
        <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)', padding: '22px 18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>TNS Consulting</div>
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#fff', marginBottom: 2 }}>Relances</div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.65)' }}>Suivi des relances clients automatiques</div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, ...padSt }}>
        <KpiCard label="Factures relancées"  value={enRetardActives} color="var(--navy)"  />
        <KpiCard label="Envoyées ce mois"    value={envoiesCeMois}   color="var(--orange)" />
        <KpiCard label="En erreur"           value={enErreur}        color={enErreur > 0 ? 'var(--re)' : 'var(--gr)'} />
      </div>

      {/* ── Filtres ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', ...padSt }}>
        {[
          { id: 'tous',   label: 'Toutes'  },
          { id: 'envoye', label: 'Envoyées' },
          { id: 'erreur', label: 'En erreur' },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltreStatut(f.id)}
            style={{ padding: '5px 12px', borderRadius: 20, border: filtreStatut === f.id ? '1.5px solid var(--navy)' : '1.5px solid var(--bd)', background: filtreStatut === f.id ? 'var(--navy)' : '#fff', color: filtreStatut === f.id ? '#fff' : 'var(--t2)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {f.label}
          </button>
        ))}

        {moisDispos.length > 0 && (
          <select value={filtreMois} onChange={e => setFiltreMois(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 20, border: '1.5px solid var(--bd)', background: '#fff', color: 'var(--t2)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
            <option value="">Tous les mois</option>
            {moisDispos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* ── Tableau historique ───────────────────────── */}
      <div style={{ ...padSt, marginBottom: 32 }}>
        {relancesFiltrees.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔔</div>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Aucune relance</div>
            <div style={{ fontSize: '.84rem', color: 'var(--t2)' }}>
              Les relances s'envoient automatiquement à J+15, J+30 et J+45 pour les factures en retard.
            </div>
          </div>
        ) : relancesFiltrees.map(r => (
          <div key={r.id} style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>
                    {r.facture_numero}
                  </span>
                  <BadgeNiveau niveau={r.niveau} />
                  <BadgeStatut statut={r.statut} />
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--t2)', marginBottom: 2 }}>
                  {r.raison_sociale} · {fmtDateHeure(r.date_envoi)} · {r.email_destinataire}
                </div>
                {r.statut === 'erreur' && r.erreur_message && (
                  <div style={{ fontSize: '.74rem', color: 'var(--re)', background: '#fef2f2', borderRadius: 6, padding: '3px 8px', marginTop: 4, display: 'inline-block' }}>
                    {r.erreur_message}
                  </div>
                )}
              </div>
              <div style={{ textAlign: isDesktop ? 'right' : 'left', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>
                  {fmt(r.montant_ttc)}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--mu)' }}>TTC</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: '.7rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: color || 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>{value}</div>
    </div>
  );
}

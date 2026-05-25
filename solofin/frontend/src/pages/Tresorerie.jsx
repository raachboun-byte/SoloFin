import { useState, useEffect } from 'react';
import { getTresorerie } from '../api/tresorerie';

const MOIS_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const CATS_ICONS = {
  Abonnement: '💻', Matériel: '📦', Déplacement: '🚆',
  Restaurant: '🍽️', Hébergement: '🏨', Télécom: '📱',
  Formation: '📚', Divers: '📎',
};

function moisCourant() {
  return new Date().toISOString().slice(0, 7);
}

function moisPrecedent(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function moisSuivant(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function labelMois(ym) {
  const [y, m] = ym.split('-');
  return `${MOIS_LABELS[parseInt(m) - 1]} ${y}`;
}

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) + ' €';

const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

// ── Carte KPI ────────────────────────────────────────────
function KpiCard({ label, value, color, subtitle }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: '.7rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color || 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '.7rem', color: 'var(--mu)', marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

// ── Section détail dépliable ─────────────────────────────
function SectionDetail({ titre, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)', padding: '0 0 8px 0' }}>
        <span style={{ fontSize: '.75rem', transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        {titre} ({count})
      </button>
      {open && children}
    </div>
  );
}

// ── Page Trésorerie ──────────────────────────────────────
export default function Tresorerie({ isDesktop }) {
  const [mois,    setMois]    = useState(moisCourant());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  async function charger(m) {
    setLoading(true);
    try {
      const r = await getTresorerie(m);
      setData(r.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { charger(mois); }, [mois]);

  function allerMois(nouveau) {
    setMois(nouveau);
  }

  const padSt = isDesktop ? {} : { padding: '0 14px' };
  const estMoisCourant = mois === moisCourant();

  return (
    <div>
      {/* ── Hero (mobile uniquement) ─────────────────── */}
      {!isDesktop && (
        <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)', padding: '22px 18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            TNS Consulting
          </div>
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#fff', marginBottom: 2 }}>Trésorerie</div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.65)' }}>Vue mensuelle entrées / sorties</div>
        </div>
      )}

      {/* ── Navigation mois ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, ...padSt }}>
        <button onClick={() => allerMois(moisPrecedent(mois))}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--bd)', background: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: 700 }}>
          ‹
        </button>
        <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.15rem', color: 'var(--navy)', minWidth: 160, textAlign: 'center' }}>
          {labelMois(mois)}
        </div>
        <button onClick={() => allerMois(moisSuivant(mois))}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--bd)', background: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: 700 }}>
          ›
        </button>
        {!estMoisCourant && (
          <button onClick={() => allerMois(moisCourant())}
            style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid var(--bd)', background: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', fontFamily: 'inherit' }}>
            Ce mois
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--t2)' }}>Chargement…</div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--re)' }}>Erreur de chargement</div>
      ) : (
        <>
          {/* ── KPIs ligne 1 : flux financiers ────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, ...padSt }}>
            <KpiCard
              label="Entrées HT"
              value={fmt(data.entrees_ht)}
              color="var(--gr)"
              subtitle={`${data.factures.length} facture${data.factures.length > 1 ? 's' : ''} payée${data.factures.length > 1 ? 's' : ''}`}
            />
            <KpiCard
              label="Sorties TTC"
              value={fmt(data.sorties_ttc)}
              color="var(--re)"
              subtitle={`${data.depenses.length} dépense${data.depenses.length > 1 ? 's' : ''}`}
            />
            <KpiCard
              label="Solde estimé"
              value={fmt(data.solde)}
              color={data.solde >= 0 ? 'var(--gr)' : 'var(--re)'}
            />
          </div>

          {/* ── KPIs ligne 2 : TVA ────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, ...padSt }}>
            <KpiCard
              label="TVA collectée"
              value={fmt(data.tva_collectee)}
              color="var(--navy)"
              subtitle="Sur factures payées"
            />
            <KpiCard
              label="TVA déductible"
              value={fmt(data.tva_deductible)}
              color="var(--navy)"
              subtitle="Sur dépenses"
            />
            <KpiCard
              label="TVA nette estimée"
              value={fmt(data.tva_nette)}
              color={data.tva_nette >= 0 ? 'var(--am)' : 'var(--gr)'}
              subtitle={data.tva_nette >= 0 ? 'À reverser (estimation)' : 'Crédit de TVA'}
            />
          </div>

          {/* ── Détail factures payées ────────────────── */}
          <div style={{ ...padSt }}>
            <SectionDetail titre="Factures encaissées" count={data.factures.length} defaultOpen={data.factures.length > 0}>
              {data.factures.length === 0
                ? <div style={{ background: '#f8fafc', border: '1px solid var(--bd)', borderRadius: 10, padding: '16px', textAlign: 'center', color: 'var(--t2)', fontSize: '.84rem' }}>
                    Aucune facture payée ce mois.
                  </div>
                : data.factures.map((f, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)', fontFamily: 'Lato,sans-serif' }}>{f.numero}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--t2)', marginTop: 2 }}>{f.raison_sociale} · {f.nb_jours} j × {fmt(f.tjm)}/j</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--gr)' }}>+{fmt(f.montant_ht)}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--t2)' }}>TVA : {fmt(f.montant_tva)}</div>
                    </div>
                  </div>
                ))
              }
            </SectionDetail>

            {/* ── Détail dépenses ───────────────────────── */}
            <SectionDetail titre="Dépenses" count={data.depenses.length} defaultOpen={data.depenses.length > 0}>
              {data.depenses.length === 0
                ? <div style={{ background: '#f8fafc', border: '1px solid var(--bd)', borderRadius: 10, padding: '16px', textAlign: 'center', color: 'var(--t2)', fontSize: '.84rem' }}>
                    Aucune dépense ce mois.
                  </div>
                : data.depenses.map(d => (
                  <div key={d.id} style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 10, padding: '11px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{CATS_ICONS[d.categorie] || '📎'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--t)' }}>{d.fournisseur}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--t2)', marginTop: 2 }}>{d.categorie} · {fmtDate(d.date_depense)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--re)' }}>−{fmt(d.montant_ttc)}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--t2)' }}>TVA déd. : {fmt(d.tva_deductible)}</div>
                    </div>
                  </div>
                ))
              }
            </SectionDetail>
          </div>

          {/* ── Note indicative ───────────────────────── */}
          <div style={{ ...padSt, marginBottom: 32 }}>
            <div style={{ background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', fontSize: '.75rem', color: '#92400e' }}>
              ⚠️ La TVA nette est une estimation indicative. Consultez votre expert-comptable pour la déclaration officielle.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

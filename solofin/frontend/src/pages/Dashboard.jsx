import { useState, useEffect } from 'react';
import { logout } from '../api/auth';
import { listerFactures } from '../api/factures';
import { listerDepenses } from '../api/frais';
import Frais from './Frais';
import Facturation from './Facturation';
import Tresorerie from './Tresorerie';
import Parametres from './Parametres';
import GmailImport from './GmailImport';
import DriveImport from './DriveImport';

const SIDEBAR_W = 240;
const TOPBAR_H  = 56;
const BNAV_H    = 58;

const NAV = [
  { id: 'dashboard',   icon: '🏠', label: 'Accueil'     },
  { id: 'frais',       icon: '💸', label: 'Frais'       },
  { id: 'facturation', icon: '🧾', label: 'Factures'    },
  { id: 'tresorerie',  icon: '📊', label: 'Trésorerie'  },
  { id: 'gmail',       icon: '📧', label: 'Gmail'       },
  { id: 'drive',       icon: '📁', label: 'Drive'       },
  { id: 'parametres',  icon: '⚙️', label: 'Paramètres'  },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 769);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 769);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
}

export default function Dashboard({ user, onLogout }) {
  const [page, setPage]     = useState('dashboard');
  const [drawer, setDrawer] = useState(false);
  const isDesktop           = useIsDesktop();

  async function handleLogout() {
    await logout();
    onLogout();
  }

  const go = (id) => { setPage(id); setDrawer(false); };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── SIDEBAR — desktop uniquement ─────────────────── */}
      {isDesktop && (
        <aside style={{
          width: SIDEBAR_W, background: 'var(--navy)',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 40, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ width: 32, height: 32, background: 'var(--orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '.9rem', color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(255,102,0,.35)' }}>SF</div>
            <span style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>SoloFin</span>
          </div>

          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--orange),#ff8a4d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem', flexShrink: 0, border: '2px solid rgba(255,255,255,.15)' }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TNS Consulting</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '8px 0' }}>
            <div style={{ fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,.3)', fontWeight: 700, padding: '12px 16px 4px' }}>Navigation</div>
            {NAV.map(n => (
              <NavItem key={n.id} n={n} active={page === n.id} onClick={() => go(n.id)} />
            ))}
          </nav>

          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 9, background: 'rgba(220,38,38,.15)', color: '#fca5a5', border: 'none', borderRadius: 7, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ↪ Se déconnecter
            </button>
          </div>
        </aside>
      )}

      {/* ── TOPBAR — mobile uniquement ───────────────────── */}
      {!isDesktop && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: TOPBAR_H, background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px', boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setDrawer(o => !o)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, width: 40, height: 40, cursor: 'pointer', background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8 }}>
              {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 19, height: 2, background: '#fff', borderRadius: 2 }} />)}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>
              <div style={{ width: 30, height: 30, background: 'var(--orange)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.88rem', color: '#fff' }}>S</div>
              SoloFin
            </div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--orange),#ff8a4d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem' }}>
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </header>
      )}

      {/* ── DRAWER — mobile uniquement ───────────────────── */}
      {!isDesktop && drawer && (
        <>
          <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 282, zIndex: 70, background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '4px 0 28px rgba(0,0,0,.18)' }}>
            <div style={{ background: 'var(--navy)', padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>
                <div style={{ width: 30, height: 30, background: 'var(--orange)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.88rem', color: '#fff' }}>S</div>
                SoloFin
              </div>
              <button onClick={() => setDrawer(false)} style={{ width: 32, height: 32, background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '14px 16px', background: '#eff6ff', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,var(--orange),#ff8a4d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.95rem', flexShrink: 0 }}>
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div><div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '.9rem' }}>TNS Consulting</div><div style={{ fontSize: '.74rem', color: 'var(--t2)' }}>{user?.email}</div></div>
            </div>
            <nav style={{ flex: 1, padding: '6px 0' }}>
              {NAV.map(n => (
                <div key={n.id} onClick={() => go(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer', borderLeft: page === n.id ? '3px solid var(--orange)' : '3px solid transparent', background: page === n.id ? '#fff5ef' : 'transparent', color: page === n.id ? 'var(--orange)' : 'var(--t)' }}>
                  <span style={{ fontSize: '1.05rem', width: 22, textAlign: 'center' }}>{n.icon}</span>{n.label}
                </div>
              ))}
            </nav>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--bd)' }}>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 11, background: '#fee2e2', color: 'var(--re)', border: 'none', borderRadius: 8, fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ↪ Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── CONTENU PRINCIPAL ────────────────────────────── */}
      <div style={{
        marginLeft: isDesktop ? SIDEBAR_W : 0,
        paddingTop:  isDesktop ? 0 : TOPBAR_H,
        paddingBottom: isDesktop ? 0 : BNAV_H,
        minHeight: '100vh',
      }}>
        <div style={{
          maxWidth: isDesktop ? 900 : 'none',
          margin: '0 auto',
          padding: isDesktop ? '28px 32px 48px' : 0,
        }}>
          {page === 'dashboard'   && <PageAccueil user={user} onNav={setPage} isDesktop={isDesktop} />}
          {page === 'frais'       && <Frais isDesktop={isDesktop} />}
          {page === 'facturation' && <Facturation isDesktop={isDesktop} />}
          {page === 'tresorerie'  && <Tresorerie  isDesktop={isDesktop} />}
          {page === 'gmail'       && <GmailImport isDesktop={isDesktop} onNav={setPage} />}
          {page === 'drive'       && <DriveImport isDesktop={isDesktop} />}
          {page === 'parametres'  && <Parametres />}
        </div>
      </div>

      {/* ── NAV BASSE — mobile uniquement ───────────────── */}
      {!isDesktop && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#fff', borderTop: '1px solid var(--bd)', display: 'flex', boxShadow: '0 -2px 10px rgba(0,0,0,.06)' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 3px 6px', cursor: 'pointer', fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: page === n.id ? 'var(--orange)' : 'var(--mu)', background: 'none', border: 'none', fontFamily: 'inherit', borderTop: page === n.id ? '2.5px solid var(--orange)' : '2.5px solid transparent', minHeight: 54, gap: 2 }}>
              <span style={{ fontSize: '1.22rem' }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

/* ── Élément de navigation sidebar ─────────────────────── */
function NavItem({ n, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', fontSize: '.87rem', fontWeight: 600, cursor: 'pointer', transition: 'all .14s', borderLeft: active ? '3px solid var(--orange)' : '3px solid transparent', background: active ? 'rgba(255,102,0,.15)' : hover ? 'rgba(255,255,255,.07)' : 'transparent', color: active || hover ? '#fff' : 'rgba(255,255,255,.62)' }}
    >
      <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
      {n.label}
    </div>
  );
}

/* ── Utilitaires ────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

const STATUTS_LBL = {
  brouillon: { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon' },
  envoyee:   { bg: '#eff6ff', color: '#1d4ed8', label: 'Envoyée'   },
  payee:     { bg: '#f0fdf4', color: '#16a34a', label: 'Payée'     },
  en_retard: { bg: '#fef2f2', color: '#dc2626', label: 'En retard' },
};

const ICO_STATUT_BG = {
  brouillon: '#f1f5f9', envoyee: '#eff6ff', payee: '#f0fdf4', en_retard: '#fef2f2',
};

/* Retourne les N derniers mois sous forme [{key:'YYYY-MM', label:'Jan'}] */
function derniersNMois(n) {
  const today = new Date();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key   = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
    result.push({ key, label });
  }
  return result;
}

/* ── KPI card avec barre colorée gauche ─────────────────── */
function KPICard({ couleur, label, valeur, valeurColor, sous, sousOk, onClick }) {
  const BORD = { cn: 'var(--navy)', co: 'var(--orange)', cg: 'var(--gr)', cr: 'var(--re)', cam: 'var(--am)' };
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff', borderRadius: 10, border: '1px solid var(--bd)',
        boxShadow: hover ? '0 4px 18px rgba(0,0,0,.09)' : '0 1px 3px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05)',
        padding: '16px 16px 16px 20px', position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'transform .12s, box-shadow .12s',
      }}
    >
      {/* barre colorée gauche */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: BORD[couleur] || 'var(--navy)', borderRadius: '10px 0 0 10px' }} />
      <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--mu)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.35rem', color: valeurColor || 'var(--navy)', letterSpacing: '-.3px', lineHeight: 1 }}>{valeur}</div>
      {sous && <div style={{ fontSize: '.68rem', color: sousOk ? 'var(--gr)' : 'var(--mu)', marginTop: 5, fontWeight: 600 }}>{sous}</div>}
    </div>
  );
}

/* ── Graphique en barres ─────────────────────────────────── */
function BarChart({ barData, maxBar }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, margin: '6px 0 8px' }}>
      {barData.map((b, i) => (
        <div key={b.key}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
        >
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0', minHeight: b.val > 0 ? 4 : 2,
            background: hovered === i ? 'var(--orange)' : 'var(--navy)',
            opacity: hovered === i ? 1 : 0.8,
            height: `${Math.max((b.val / maxBar) * 100, b.val > 0 ? 5 : 2)}%`,
            transition: 'all .22s ease',
          }} />
          <span style={{ fontSize: '.62rem', color: 'var(--mu)', fontWeight: 700 }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Page d'accueil — Tableau de bord ──────────────────── */
function PageAccueil({ user, onNav, isDesktop }) {
  const [factures, setFactures] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function charger() {
      try {
        const [rf, rd] = await Promise.all([listerFactures(), listerDepenses()]);
        setFactures(rf.data || []);
        setDepenses(rd.data || []);
      } catch { /* silencieux */ }
      finally { setLoading(false); }
    }
    charger();
  }, []);

  const annee = new Date().getFullYear();

  /* KPIs */
  const ca            = factures.filter(f => f.statut !== 'brouillon').reduce((s, f) => s + f.montant_ht, 0);
  const encaisse      = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ht, 0);
  const attente       = factures.filter(f => f.statut === 'envoyee' || f.statut === 'en_retard').reduce((s, f) => s + f.montant_ht, 0);
  const enRetard      = factures.filter(f => f.statut === 'en_retard');
  const tvaCollectee  = factures.filter(f => f.statut !== 'brouillon').reduce((s, f) => s + (f.montant_tva || 0), 0);
  const tvaDeductible = depenses.reduce((s, d) => s + (d.tva_deductible || 0), 0);
  const tvaNette      = tvaCollectee - tvaDeductible;

  /* Graphique : 6 derniers mois */
  const moisListe = derniersNMois(6);
  const moisMap   = {};
  factures.filter(f => f.statut === 'payee').forEach(f => {
    if (f.mois_prestation) moisMap[f.mois_prestation] = (moisMap[f.mois_prestation] || 0) + f.montant_ht;
  });
  const barData = moisListe.map(m => ({ ...m, val: moisMap[m.key] || 0 }));
  const maxBar  = Math.max(...barData.map(b => b.val), 1);

  /* 5 dernières factures */
  const recentes = [...factures].slice(0, 5);

  const padH = isDesktop ? {} : { padding: '0 14px' };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--t2)' }}>Chargement…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Hero mobile */}
      {!isDesktop && (
        <div style={{ background: 'linear-gradient(135deg,var(--navy),var(--navy2))', padding: '15px 14px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#fff' }}>Bonjour 👋</div>
          <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Exercice {annee} · TNS Consulting</div>
        </div>
      )}

      {/* En-tête desktop avec CTA */}
      {isDesktop && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '1.5rem', color: 'var(--navy)' }}>Bonjour 👋</div>
          <div style={{ fontSize: '.83rem', color: 'var(--t2)', marginTop: 3 }}>Exercice {annee} · TNS Consulting</div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('facturation')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,102,0,.22)' }}>
              + Nouvelle facture
            </button>
            <button onClick={() => onNav('frais')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#fff', color: 'var(--navy)', border: '1.5px solid var(--bd)', borderRadius: 10, fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              💸 Ajouter une dépense
            </button>
          </div>
        </div>
      )}

      {/* Bannière alerte factures en retard */}
      {enRetard.length > 0 && (
        <div onClick={() => onNav('facturation')}
          style={{ ...padH, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', margin: isDesktop ? '0' : '0 14px' }}>
          <span>⚠️</span>
          <span>
            <strong>{enRetard.length} facture{enRetard.length > 1 ? 's' : ''} en retard</strong>
            {' · '}{fmt(enRetard.reduce((s, f) => s + f.montant_ht, 0))} à relancer
          </span>
        </div>
      )}

      {/* 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 12, ...padH }}>
        <KPICard
          couleur="cn" label={`CA ${annee}`}
          valeur={fmt(ca)} sous="Voir →"
          onClick={() => onNav('facturation')}
        />
        <KPICard
          couleur="cg" label="Encaissé"
          valeur={fmt(encaisse)} valeurColor="var(--gr)"
          sous="Payées" sousOk
          onClick={() => onNav('facturation')}
        />
        <KPICard
          couleur="co" label="En attente"
          valeur={fmt(attente)} valeurColor="var(--orange)"
          sous="→"
          onClick={() => onNav('facturation')}
        />
        <KPICard
          couleur="cam" label="TVA à reverser"
          valeur={fmt(tvaNette)} valeurColor="var(--am)"
          sous="→"
          onClick={() => onNav('tresorerie')}
        />
      </div>

      {/* Grille 2 col : graphique + dernières factures */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 14, alignItems: 'start', ...padH }}>

        {/* Graphique activité mensuelle */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--bd)', boxShadow: '0 1px 3px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
            <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '.95rem', color: 'var(--navy)' }}>Activité mensuelle {annee}</div>
            <button onClick={() => onNav('tresorerie')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: 'var(--orange)', fontWeight: 700, fontFamily: 'inherit' }}>Trésorerie →</button>
          </div>
          <div style={{ padding: '0 16px 14px' }}>
            <BarChart barData={barData} maxBar={maxBar} />
            <div style={{ fontSize: '.67rem', color: 'var(--mu)', fontWeight: 600 }}>Recettes HT · survolez une barre</div>
          </div>
        </div>

        {/* Dernières factures */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--bd)', boxShadow: '0 1px 3px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
            <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 900, fontSize: '.95rem', color: 'var(--navy)' }}>Dernières factures</div>
            <button onClick={() => onNav('facturation')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: 'var(--orange)', fontWeight: 700, fontFamily: 'inherit' }}>Tout voir →</button>
          </div>
          {recentes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 14px' }}>
              <div style={{ fontSize: '2.4rem', opacity: .18, marginBottom: 8 }}>🧾</div>
              <div style={{ fontSize: '.83rem', color: 'var(--mu)', fontWeight: 600 }}>Aucune facture</div>
            </div>
          )}
          {recentes.map((f, idx) => {
            const s = STATUTS_LBL[f.statut] || STATUTS_LBL.brouillon;
            return (
              <div key={f.id}
                onClick={() => onNav('facturation')}
                style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: idx < recentes.length - 1 ? '1px solid var(--bd)' : 'none', gap: 12, cursor: 'pointer', minHeight: 56, transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: ICO_STATUT_BG[f.statut] || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🧾</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.raison_sociale}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--t2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: '.67rem' }}>{s.label}</span>
                    <span style={{ color: 'var(--mu)', fontSize: '.68rem' }}>{f.numero}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Lato,sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)' }}>{fmt(f.montant_ht)}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--mu)' }}>
                    {f.date_emission ? new Date(f.date_emission).toLocaleDateString('fr-FR') : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

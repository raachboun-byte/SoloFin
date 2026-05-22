// Dashboard principal — design maquette (topbar navy, nav basse, drawer)
import { useState } from 'react';
import { logout } from '../api/auth';

/* ── Navigation MVP ──────────────────────────────────────────── */
const NAV = [
  { id: 'dashboard',  icon: '🏠', label: 'Accueil'   },
  { id: 'frais',      icon: '💸', label: 'Frais'     },
  { id: 'facturation',icon: '🧾', label: 'Factures'  },
  { id: 'tresorerie', icon: '📊', label: 'Trésorerie'},
];

export default function Dashboard({ user, onLogout }) {
  const [page, setPage]     = useState('dashboard');
  const [drawer, setDrawer] = useState(false);

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'var(--bg)'}}>

      {/* ── TOPBAR ───────────────────────────────────────────────── */}
      <header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:50,
        height:56,background:'var(--navy)',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 14px',boxShadow:'0 2px 8px rgba(0,0,0,.18)',
      }}>
        {/* Bouton hamburger */}
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button
            onClick={() => setDrawer(o => !o)}
            style={{
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              gap:5,width:40,height:40,cursor:'pointer',
              background:'rgba(255,255,255,.1)',border:'none',borderRadius:8,
            }}
          >
            {[0,1,2].map(i => (
              <span key={i} style={{display:'block',width:19,height:2,background:'#fff',borderRadius:2}}/>
            ))}
          </button>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:8,fontFamily:'Lato,sans-serif',fontWeight:900,fontSize:'1.05rem',color:'#fff'}}>
            <div style={{width:30,height:30,background:'var(--orange)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'.88rem',color:'#fff',boxShadow:'0 2px 6px rgba(255,102,0,.4)'}}>S</div>
            SoloFin
          </div>
        </div>

        {/* Avatar */}
        <div style={{
          width:32,height:32,borderRadius:'50%',
          background:'linear-gradient(135deg,var(--orange),#ff8a4d)',
          color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
          fontWeight:700,fontSize:'.85rem',cursor:'pointer',
          border:'2px solid rgba(255,255,255,.15)',
        }}>
          {user?.email?.[0]?.toUpperCase() || 'A'}
        </div>
      </header>

      {/* ── OVERLAY DRAWER ───────────────────────────────────────── */}
      {drawer && (
        <div
          onClick={() => setDrawer(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:60}}
        />
      )}

      {/* ── DRAWER ───────────────────────────────────────────────── */}
      <div style={{
        position:'fixed',top:0,left:0,bottom:0,width:282,zIndex:70,
        background:'#fff',
        transform: drawer ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .27s cubic-bezier(.4,0,.2,1)',
        boxShadow:'4px 0 28px rgba(0,0,0,.18)',
        display:'flex',flexDirection:'column',overflowY:'auto',
      }}>
        {/* En-tête drawer */}
        <div style={{background:'var(--navy)',padding:'18px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontFamily:'Lato,sans-serif',fontWeight:900,fontSize:'1.05rem',color:'#fff'}}>
            <div style={{width:30,height:30,background:'var(--orange)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'.88rem',color:'#fff'}}>S</div>
            SoloFin
          </div>
          <button onClick={() => setDrawer(false)} style={{width:32,height:32,background:'rgba(255,255,255,.12)',border:'none',borderRadius:7,cursor:'pointer',color:'#fff',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* Infos utilisateur */}
        <div style={{padding:'14px 16px',background:'#eff6ff',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,var(--orange),#ff8a4d)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.95rem',flexShrink:0}}>
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:'var(--navy)',fontSize:'.9rem'}}>TNS Consulting</div>
            <div style={{fontSize:'.74rem',color:'var(--t2)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
          </div>
        </div>

        {/* Liens de navigation */}
        <nav style={{flex:1,padding:'6px 0'}}>
          <div style={{fontSize:'.62rem',textTransform:'uppercase',letterSpacing:'1.3px',color:'var(--mu)',fontWeight:700,padding:'12px 16px 4px'}}>
            Navigation
          </div>
          {NAV.map(n => (
            <div
              key={n.id}
              onClick={() => { setPage(n.id); setDrawer(false); }}
              style={{
                display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
                fontSize:'.9rem',fontWeight:600,cursor:'pointer',
                borderLeft: page === n.id ? '3px solid var(--orange)' : '3px solid transparent',
                background: page === n.id ? '#fff5ef' : 'transparent',
                color: page === n.id ? 'var(--orange)' : 'var(--t)',
              }}
            >
              <span style={{fontSize:'1.05rem',width:22,textAlign:'center'}}>{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>

        {/* Déconnexion */}
        <div style={{padding:'10px 14px',borderTop:'1px solid var(--bd)'}}>
          <button
            onClick={handleLogout}
            style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              width:'100%',padding:11,
              background:'#fee2e2',color:'var(--re)',border:'none',borderRadius:8,
              fontSize:'.85rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',
            }}
          >
            ↪ Se déconnecter
          </button>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ────────────────────────────────────── */}
      <main style={{flex:1,paddingTop:56,paddingBottom:70,minHeight:'100vh'}}>
        {page === 'dashboard'   && <PageAccueil user={user} onNav={setPage}/>}
        {page === 'frais'       && <PageVide titre="Notes de frais"  icon="💸" message="Module disponible au Sprint 2"/>}
        {page === 'facturation' && <PageVide titre="Facturation"     icon="🧾" message="Module disponible au Sprint 3"/>}
        {page === 'tresorerie'  && <PageVide titre="Trésorerie"      icon="📊" message="Module disponible au Sprint 5"/>}
      </main>

      {/* ── NAVIGATION BASSE ─────────────────────────────────────── */}
      <nav style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:50,
        background:'#fff',borderTop:'1px solid var(--bd)',
        display:'flex',boxShadow:'0 -2px 10px rgba(0,0,0,.06)',
      }}>
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              padding:'8px 3px 6px',cursor:'pointer',
              fontSize:'.58rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.4px',
              color: page === n.id ? 'var(--orange)' : 'var(--mu)',
              background:'none',border:'none',fontFamily:'inherit',
              borderTop: page === n.id ? '2.5px solid var(--orange)' : '2.5px solid transparent',
              minHeight:54,gap:2,
            }}
          >
            <span style={{fontSize:'1.22rem'}}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── Page d'accueil ─────────────────────────────────────────── */
function PageAccueil({ user, onNav }) {
  return (
    <div>
      {/* Hero */}
      <div style={{background:'var(--navy)',padding:'16px 14px 32px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-30,top:-30,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,.04)'}}/>
        <div style={{fontFamily:'Lato,sans-serif',fontWeight:900,fontSize:'1.28rem',color:'#fff',letterSpacing:'-.2px'}}>
          Bonjour 👋
        </div>
        <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.6)',marginTop:3}}>
          TNS Consulting SARL · {new Date().toLocaleDateString('fr-FR', {month:'long',year:'numeric'})}
        </div>
      </div>

      <div style={{padding:'0 14px',marginTop:14,display:'flex',flexDirection:'column',gap:11}}>

        {/* Raccourcis modules */}
        {[
          {id:'frais',       icon:'💸', titre:'Notes de frais',  desc:'Saisir une dépense'},
          {id:'facturation', icon:'🧾', titre:'Facturation',     desc:'Créer une facture'},
          {id:'tresorerie',  icon:'📊', titre:'Trésorerie',      desc:'Vue mensuelle'},
        ].map(m => (
          <div
            key={m.id}
            onClick={() => onNav(m.id)}
            style={{
              background:'#fff',borderRadius:10,
              boxShadow:'0 1px 4px rgba(0,0,0,.08),0 2px 12px rgba(0,0,0,.06)',
              border:'1px solid var(--bd)',
              display:'flex',alignItems:'center',gap:14,
              padding:14,cursor:'pointer',
            }}
          >
            <div style={{width:44,height:44,borderRadius:10,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>
              {m.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'Lato,sans-serif',fontWeight:700,fontSize:'.9rem',color:'var(--navy)'}}>{m.titre}</div>
              <div style={{fontSize:'.75rem',color:'var(--t2)',marginTop:2}}>{m.desc}</div>
            </div>
            <div style={{color:'var(--mu)',fontSize:'.9rem'}}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page placeholder (modules à venir) ─────────────────────── */
function PageVide({ titre, icon, message }) {
  return (
    <div>
      <div style={{background:'var(--navy)',padding:'16px 14px 32px'}}>
        <div style={{fontFamily:'Lato,sans-serif',fontWeight:900,fontSize:'1.28rem',color:'#fff'}}>{titre}</div>
      </div>
      <div style={{textAlign:'center',padding:'60px 14px'}}>
        <div style={{fontSize:'2.5rem',opacity:.2,marginBottom:10}}>{icon}</div>
        <div style={{fontSize:'.85rem',color:'var(--mu)',fontWeight:600}}>{message}</div>
      </div>
    </div>
  );
}

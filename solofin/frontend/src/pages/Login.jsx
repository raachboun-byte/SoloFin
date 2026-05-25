// Page de connexion SoloFin — design maquette (navy + orange)
import { useState } from 'react';
import { login } from '../api/auth';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur]     = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    const res = await login(email, password);
    setChargement(false);
    if (res.error) setErreur(res.error);
    else onLoginSuccess(res.data);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0d1f3d 0%, #1b3a6b 50%, #243f6f 100%)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '32px 24px', overflow: 'hidden',
    }}>

      {/* Cercles décoratifs */}
      <div style={{position:'absolute',top:-100,right:-100,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,102,0,.18),transparent 70%)'}}/>
      <div style={{position:'absolute',bottom:-120,left:-120,width:340,height:340,borderRadius:'50%',background:'radial-gradient(circle,rgba(100,150,255,.15),transparent 70%)'}}/>

      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:380}}>

        {/* Logo */}
        <div style={{
          width:74,height:74,borderRadius:18,
          background:'var(--orange)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontFamily:'Lato,sans-serif',fontWeight:900,fontSize:'2rem',color:'#fff',
          margin:'0 auto 22px',
          boxShadow:'0 10px 30px rgba(255,102,0,.45)',
        }}>S</div>

        <h1 style={{fontFamily:'Lato,sans-serif',fontWeight:900,fontSize:'1.9rem',color:'#fff',textAlign:'center',letterSpacing:'-.5px',marginBottom:6}}>
          SoloFin
        </h1>
        <p style={{fontSize:'.95rem',color:'rgba(255,255,255,.65)',textAlign:'center',marginBottom:36}}>
          La gestion financière simple pour freelance
        </p>

        {/* Carte formulaire */}
        <div style={{background:'#fff',borderRadius:16,padding:'24px 20px',boxShadow:'0 12px 40px rgba(0,0,0,.25)'}}>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:13}}>

            <div>
              <label style={{display:'block',fontSize:'.76rem',fontWeight:700,color:'var(--t2)',marginBottom:5}}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="r.aachboun@gmail.com"
                style={{
                  width:'100%',border:'1.5px solid var(--bd)',borderRadius:6,
                  padding:'11px 12px',fontSize:'.93rem',fontFamily:'inherit',
                  outline:'none',transition:'border-color .14s',
                }}
                onFocus={e => e.target.style.borderColor='var(--orange)'}
                onBlur={e  => e.target.style.borderColor='var(--bd)'}
              />
            </div>

            <div>
              <label style={{display:'block',fontSize:'.76rem',fontWeight:700,color:'var(--t2)',marginBottom:5}}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width:'100%',border:'1.5px solid var(--bd)',borderRadius:6,
                  padding:'11px 12px',fontSize:'.93rem',fontFamily:'inherit',
                  outline:'none',transition:'border-color .14s',
                }}
                onFocus={e => e.target.style.borderColor='var(--orange)'}
                onBlur={e  => e.target.style.borderColor='var(--bd)'}
              />
            </div>

            {/* Message d'erreur */}
            {erreur && (
              <div style={{background:'#fee2e2',color:'var(--re)',borderRadius:6,padding:'10px 12px',fontSize:'.82rem',fontWeight:600}}>
                {erreur}
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              style={{
                width:'100%',background: chargement ? '#94a3b8' : 'var(--orange)',
                color:'#fff',border:'none',borderRadius:10,
                padding:'13px',fontFamily:'inherit',fontSize:'.93rem',fontWeight:700,
                cursor: chargement ? 'not-allowed' : 'pointer',
                boxShadow:'0 2px 8px rgba(255,102,0,.28)',
                transition:'background .15s',
              }}
            >
              {chargement ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Points clés */}
        <div style={{marginTop:26,display:'flex',flexDirection:'column',gap:10}}>
          {[
            ['🧾','Facturation conforme — mentions légales incluses'],
            ['💸','Notes de frais avec calcul TVA automatique'],
            ['📊','Vue trésorerie mensuelle entrées / sorties'],
          ].map(([icon, txt]) => (
            <div key={txt} style={{display:'flex',alignItems:'center',gap:10,color:'rgba(255,255,255,.8)',fontSize:'.85rem'}}>
              <div style={{width:28,height:28,background:'rgba(255,255,255,.1)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'.9rem'}}>
                {icon}
              </div>
              {txt}
            </div>
          ))}
        </div>
      </div>

      <div style={{position:'absolute',bottom:24,left:0,right:0,textAlign:'center',color:'rgba(255,255,255,.4)',fontSize:'.72rem',zIndex:1}}>
        TNS Consulting SARL · SIRET 809 419 468 00016
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════════
//  ComptaPro v3 — Design meilleurtaux · Mobile-first · 12 modules
//  + Login Google simulé · Toasts · Tout cliquable · Safe area iOS
// ══════════════════════════════════════════════════════════════════════════════

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Source+Sans+3:wght@400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --n:#1b3a6b;--n2:#122b54;--n3:#0d1f3d;--o:#ff6600;--o2:#e65c00;
  --bg:#f5f6f8;--w:#fff;--bd:#e8eaed;
  --t:#2d3748;--t2:#64748b;--mu:#94a3b8;
  --gr:#16a34a;--grl:#dcfce7;--re:#dc2626;--rel:#fee2e2;
  --am:#d97706;--aml:#fef3c7;--bl:#eff6ff;--pu:#7c3aed;--pul:#f3e8ff;
  --r:10px;--r2:6px;
  --sh:0 1px 4px rgba(0,0,0,.08),0 2px 12px rgba(0,0,0,.06);
  --sh2:0 4px 20px rgba(0,0,0,.12);
}
html,body{-webkit-text-size-adjust:100%;overflow-x:hidden;}
body{background:var(--bg);color:var(--t);font-family:'Source Sans 3','Lato',sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;min-height:100vh;}
button{font-family:inherit;}
.app{display:flex;flex-direction:column;min-height:100vh;}

/* ════ LOGIN ════ */
.login-bg{
  position:fixed;inset:0;
  background:linear-gradient(135deg,#0d1f3d 0%,#1b3a6b 50%,#243f6f 100%);
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:32px 24px;overflow:hidden;
}
.login-bg::before{
  content:'';position:absolute;top:-100px;right:-100px;
  width:300px;height:300px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,102,0,.18),transparent 70%);
}
.login-bg::after{
  content:'';position:absolute;bottom:-120px;left:-120px;
  width:340px;height:340px;border-radius:50%;
  background:radial-gradient(circle,rgba(100,150,255,.15),transparent 70%);
}
.login-content{position:relative;z-index:1;width:100%;max-width:380px;animation:fadeUp .6s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.login-logo{
  width:74px;height:74px;border-radius:18px;background:var(--o);
  display:flex;align-items:center;justify-content:center;
  font-family:'Lato',sans-serif;font-weight:900;font-size:2rem;color:#fff;
  margin:0 auto 22px;box-shadow:0 10px 30px rgba(255,102,0,.45);
}
.login-title{font-family:'Lato',sans-serif;font-weight:900;font-size:1.9rem;color:#fff;text-align:center;letter-spacing:-.5px;margin-bottom:6px;}
.login-sub{font-size:.95rem;color:rgba(255,255,255,.65);text-align:center;margin-bottom:36px;}
.login-card{background:#fff;border-radius:16px;padding:24px 20px;box-shadow:0 12px 40px rgba(0,0,0,.25);}
.login-tagline{font-size:.83rem;color:var(--t2);text-align:center;margin-bottom:18px;line-height:1.5;}
.btn-google{
  width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
  padding:13px;background:#fff;color:#1f2937;border:1.5px solid var(--bd);
  border-radius:10px;font-size:.93rem;font-weight:700;cursor:pointer;
  transition:all .15s;font-family:'Source Sans 3',sans-serif;
}
.btn-google:active{background:#f9fafb;transform:scale(.99);}
.google-ic{width:20px;height:20px;flex-shrink:0;}
.login-features{margin-top:26px;display:flex;flex-direction:column;gap:10px;}
.lf{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.8);font-size:.85rem;}
.lf-i{width:28px;height:28px;background:rgba(255,255,255,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.9rem;}
.login-foot{position:absolute;bottom:24px;left:0;right:0;text-align:center;color:rgba(255,255,255,.4);font-size:.72rem;z-index:1;}

/* Google account picker */
.gpicker{background:#fff;border-radius:14px;padding:24px 22px;max-width:380px;width:100%;}
.gpicker-h{display:flex;align-items:center;gap:8px;font-size:1.05rem;font-weight:600;color:#1f2937;margin-bottom:4px;}
.gpicker-s{font-size:.83rem;color:#5f6368;margin-bottom:20px;}
.gacc{display:flex;align-items:center;gap:14px;padding:12px 10px;border-radius:8px;cursor:pointer;transition:background .14s;}
.gacc:active{background:#f3f4f6;}
.gacc-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--o),#ff8a4d);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;}
.gacc-av.alt{background:linear-gradient(135deg,#4285f4,#34a853);}
.gacc-i{flex:1;min-width:0;}
.gacc-n{font-weight:600;color:#202124;font-size:.92rem;}
.gacc-e{font-size:.78rem;color:#5f6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gpicker-add{display:flex;align-items:center;gap:14px;padding:12px 10px;border-radius:8px;cursor:pointer;color:#1a73e8;font-size:.88rem;font-weight:500;margin-top:6px;}
.gpicker-add:active{background:#f3f4f6;}
.gpicker-add-ic{width:40px;height:40px;border-radius:50%;background:#f1f3f4;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#5f6368;}

/* Loading splash */
.splash{position:fixed;inset:0;background:#fff;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;}
.spinner{width:42px;height:42px;border:3px solid var(--bd);border-top-color:var(--o);border-radius:50%;animation:spin 0.85s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.splash-t{font-size:.88rem;color:var(--t2);font-weight:600;}

/* ════ TOPBAR ════ */
.topbar{position:fixed;top:0;left:0;right:0;z-index:50;height:56px;background:var(--n);display:flex;align-items:center;justify-content:space-between;padding:0 14px;box-shadow:0 2px 8px rgba(0,0,0,.18);}
.tl{display:flex;align-items:center;gap:10px;}
.logo{display:flex;align-items:center;gap:8px;font-family:'Lato',sans-serif;font-weight:900;font-size:1.05rem;color:#fff;}
.logo-ic{width:30px;height:30px;background:var(--o);border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.88rem;color:#fff;box-shadow:0 2px 6px rgba(255,102,0,.4);}
.tb-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--o),#ff8a4d);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;cursor:pointer;border:2px solid rgba(255,255,255,.15);}
.tb-avatar:active{transform:scale(.92);}

.burger{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:40px;height:40px;cursor:pointer;background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:0;flex-shrink:0;-webkit-tap-highlight-color:transparent;}
.burger:active{background:rgba(255,255,255,.2);}
.burger span{display:block;width:19px;height:2px;background:#fff;border-radius:2px;transition:transform .27s ease,opacity .27s ease;transform-origin:center;}
.burger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
.burger.open span:nth-child(2){opacity:0;transform:scaleX(0);}
.burger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}

/* ════ DRAWER ════ */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:60;opacity:0;pointer-events:none;transition:opacity .24s;}
.ov.on{opacity:1;pointer-events:all;}
.drawer{position:fixed;top:0;left:0;bottom:0;width:282px;z-index:70;background:var(--w);display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .27s cubic-bezier(.4,0,.2,1);box-shadow:4px 0 28px rgba(0,0,0,.18);overflow-y:auto;}
.drawer.on{transform:translateX(0);}
.dw-head{background:var(--n);padding:18px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.dw-close{width:32px;height:32px;background:rgba(255,255,255,.12);border:none;border-radius:7px;cursor:pointer;color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;}
.dw-close:active{background:rgba(255,255,255,.25);}
.dw-user{padding:14px 16px;background:linear-gradient(135deg,var(--bl),#fff);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:12px;}
.dw-user-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--o),#ff8a4d);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;flex-shrink:0;}
.dw-user-name{font-weight:700;color:var(--n);font-size:.9rem;}
.dw-user-sub{font-size:.74rem;color:var(--t2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dw-nav{flex:1;padding:6px 0;}
.dw-sec{font-size:.62rem;text-transform:uppercase;letter-spacing:1.3px;color:var(--mu);font-weight:700;padding:12px 16px 4px;}
.dw-item{display:flex;align-items:center;gap:12px;padding:12px 16px;font-size:.9rem;font-weight:600;color:var(--t);cursor:pointer;border-left:3px solid transparent;-webkit-tap-highlight-color:transparent;}
.dw-item:active{background:var(--bg);}
.dw-item.active{color:var(--o);border-left-color:var(--o);background:#fff5ef;font-weight:700;}
.dw-icon{font-size:1.05rem;width:22px;text-align:center;flex-shrink:0;}
.dw-foot{padding:10px 14px;border-top:1px solid var(--bd);}
.dw-logout{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;background:var(--rel);color:var(--re);border:none;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'Source Sans 3',sans-serif;-webkit-tap-highlight-color:transparent;}
.dw-logout:active{background:#fcd1d1;}

/* ════ MAIN ════ */
.main{flex:1;padding:56px 0 calc(58px + env(safe-area-inset-bottom,0px));min-height:100vh;}
.page{padding:0;}
.hero{background:var(--n);margin:0;padding:16px 14px 32px;position:relative;overflow:hidden;}
.hero::after{content:'';position:absolute;right:-30px;top:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.04);}
.hero-t{font-family:'Lato',sans-serif;font-weight:900;font-size:1.28rem;color:#fff;letter-spacing:-.2px;}
.hero-s{font-size:.78rem;color:rgba(255,255,255,.6);margin-top:3px;}
.pb{padding:0 14px;margin-top:0;display:flex;flex-direction:column;gap:11px;}

/* ════ CARDS ════ */
.card{background:var(--w);border-radius:var(--r);box-shadow:var(--sh);border:1px solid var(--bd);overflow:hidden;}
.cp{padding:14px;}
.ct{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.1px;color:var(--mu);}

/* ════ KPI ════ */
.kr{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px;}
.kpi{background:var(--w);border-radius:var(--r);box-shadow:var(--sh);border:1px solid var(--bd);padding:13px;position:relative;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .14s;}
.kpi:active{transform:scale(.98);}
.kpi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:var(--r) 0 0 var(--r);}
.kpi.cn::before{background:var(--n);}
.kpi.co::before{background:var(--o);}
.kpi.cg::before{background:var(--gr);}
.kpi.cr::before{background:var(--re);}
.kpi.cam::before{background:var(--am);}
.kpi.cp2::before{background:var(--pu);}
.kl{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.9px;color:var(--mu);margin-bottom:5px;}
.kv{font-family:'Lato',sans-serif;font-weight:900;font-size:1.28rem;color:var(--n);letter-spacing:-.4px;line-height:1;}
.kv.vo{color:var(--o);}.kv.vg{color:var(--gr);}.kv.vr{color:var(--re);}.kv.vam{color:var(--am);}
.ks{font-size:.68rem;color:var(--mu);margin-top:4px;font-weight:600;}
.ks.ok{color:var(--gr);}

/* ════ LIST ITEMS ════ */
.ir{display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid var(--bd);gap:11px;-webkit-tap-highlight-color:transparent;cursor:pointer;min-height:60px;}
.ir:last-child{border-bottom:none;}
.ir:active{background:var(--bg);}
.iico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}
.ib{background:var(--bl);}.ig{background:var(--grl);}.ir2{background:var(--rel);}.iam{background:var(--aml);}.igr{background:var(--bg);}.ipu{background:var(--pul);}
.ii{flex:1;min-width:0;}
.it{font-weight:700;font-size:.86rem;color:var(--n);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.is{font-size:.73rem;color:var(--t2);margin-top:1px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.irr{text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
.iam2{font-family:'Lato',sans-serif;font-weight:700;font-size:.9rem;color:var(--n);}
.idat{font-size:.7rem;color:var(--mu);}
.iact{display:flex;gap:1px;flex-shrink:0;margin-top:2px;}

/* ════ BADGES ════ */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:.67rem;font-weight:700;white-space:nowrap;}
.bp{background:var(--grl);color:var(--gr);}
.bpd{background:var(--aml);color:var(--am);}
.bl2{background:var(--rel);color:var(--re);}
.bd2{background:var(--bg);color:var(--mu);border:1px solid var(--bd);}
.bcat{background:var(--bl);color:var(--n);}
.dot{width:5px;height:5px;border-radius:50%;display:inline-block;}
.dg{background:var(--gr);}.dam{background:var(--am);}.dr{background:var(--re);}.dmu{background:var(--mu);}

/* ════ BUTTONS ════ */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 18px;border-radius:var(--r);font-size:.88rem;font-weight:700;cursor:pointer;border:none;font-family:'Source Sans 3',sans-serif;white-space:nowrap;transition:all .14s;-webkit-tap-highlight-color:transparent;min-height:44px;}
.bc{background:var(--o);color:#fff;box-shadow:0 2px 8px rgba(255,102,0,.28);}
.bc:active{background:var(--o2);transform:scale(.98);}
.bn{background:var(--n);color:#fff;}
.bn:active{background:var(--n2);}
.bo{background:#fff;color:var(--n);border:1.5px solid var(--bd);box-shadow:var(--sh);}
.bo:active{border-color:var(--n);background:var(--bl);}
.bg{background:transparent;color:var(--t2);padding:6px 8px;font-size:.8rem;border-radius:6px;min-height:32px;}
.bg:active{background:var(--bg);}
.bgr{background:transparent;color:var(--re);padding:6px 8px;font-size:.8rem;border-radius:6px;min-height:32px;}
.bgr:active{background:var(--rel);}
.bsm{padding:8px 13px;font-size:.8rem;min-height:36px;}
.bic{width:34px;height:34px;padding:0;border-radius:7px;font-size:.92rem;min-height:34px;}
.bfl{width:100%;}

/* ════ FORMS ════ */
.fg{margin-bottom:13px;}
.fl{display:block;font-size:.76rem;font-weight:700;color:var(--t2);margin-bottom:5px;}
.fi{width:100%;background:#fff;border:1.5px solid var(--bd);border-radius:var(--r2);padding:11px 12px;color:var(--t);font-size:.93rem;font-family:'Source Sans 3',sans-serif;outline:none;transition:border-color .14s;-webkit-appearance:none;min-height:44px;}
.fi:focus{border-color:var(--o);box-shadow:0 0 0 3px rgba(255,102,0,.1);}
.fi::placeholder{color:var(--mu);}
.fr2{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
select.fi{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;padding-right:32px;}
textarea.fi{resize:vertical;min-height:70px;}

/* ════ MODAL ════ */
.moo{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px);}
.moo.center{align-items:center;padding:16px;}
.mo{background:#fff;border-radius:18px 18px 0 0;width:100%;max-height:94vh;overflow-y:auto;padding:18px 14px 30px;animation:su .21s ease;box-shadow:0 -4px 28px rgba(0,0,0,.15);}
.moo.center .mo{border-radius:14px;max-width:380px;}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pop{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.moo.center .mo{animation:pop .2s ease;}
.moh{width:34px;height:4px;background:var(--bd);border-radius:2px;margin:0 auto 14px;}
.mot{font-family:'Lato',sans-serif;font-weight:900;font-size:1.08rem;color:var(--n);margin-bottom:16px;}
.mof{margin-top:16px;display:flex;flex-direction:column;gap:9px;}

/* ════ ALERTS ════ */
.alert{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:var(--r2);font-size:.8rem;font-weight:600;margin-bottom:10px;flex-wrap:wrap;word-break:break-word;min-height:40px;}
.alert span:first-child{flex-shrink:0;}
.alert span:last-child{flex:1;min-width:0;word-break:break-word;}
.ar{background:var(--rel);color:var(--re);}
.aa{background:var(--aml);color:var(--am);}
.ab2{background:var(--bl);color:var(--n);}
.ag{background:var(--grl);color:var(--gr);}

/* ════ TABS ════ */
.tabs{display:flex;overflow-x:auto;scrollbar-width:none;background:#fff;border-bottom:1px solid var(--bd);margin:0;padding:0 4px;}
.tabs::-webkit-scrollbar{display:none;}
.tab{padding:11px 14px;font-size:.8rem;font-weight:700;color:var(--t2);cursor:pointer;white-space:nowrap;border-bottom:2.5px solid transparent;background:none;border-top:none;border-left:none;border-right:none;font-family:'Source Sans 3',sans-serif;flex-shrink:0;-webkit-tap-highlight-color:transparent;}
.tab.active{color:var(--o);border-bottom-color:var(--o);}

/* ════ CHART ════ */
.mchart{display:flex;align-items:flex-end;gap:5px;height:74px;margin:4px 0 6px;}
.mcc{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.mcb{width:100%;border-radius:4px 4px 0 0;background:var(--n);opacity:.85;min-height:3px;transition:all .3s ease;}
.mcc:active .mcb{background:var(--o);opacity:1;}
.mcl{font-size:.62rem;color:var(--mu);font-weight:700;}

/* ════ TVA BOX ════ */
.tvabox{background:linear-gradient(135deg,var(--n),var(--n2));border-radius:var(--r);padding:14px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;}
.tvabox-l{font-size:.8rem;color:rgba(255,255,255,.65);font-weight:600;}
.tvabox-v{font-family:'Lato',sans-serif;font-weight:900;font-size:1.2rem;color:#fff;}

/* ════ SECTIONS ════ */
.sh{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 8px;}
.st{font-family:'Lato',sans-serif;font-weight:900;font-size:.96rem;color:var(--n);}
.sl{font-size:.78rem;color:var(--o);font-weight:700;cursor:pointer;background:none;border:none;-webkit-tap-highlight-color:transparent;}

/* ════ SCAN ════ */
.sz{border:2px dashed var(--bd);border-radius:var(--r);padding:30px 14px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg);position:relative;-webkit-tap-highlight-color:transparent;}
.sz.drag,.sz:active{border-color:var(--o);background:#fff5ef;}
.sz input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.sz-i{font-size:2.2rem;display:block;margin-bottom:6px;}
.sz-t{font-weight:700;font-size:.92rem;color:var(--n);margin-bottom:3px;}
.sz-s{font-size:.76rem;color:var(--mu);}
.strk{width:100%;height:4px;background:var(--bd);border-radius:4px;overflow:hidden;margin:12px 0 7px;}
.sfil{height:100%;background:linear-gradient(90deg,var(--n),var(--o));animation:sf 1.8s ease-in-out infinite;border-radius:4px;}
@keyframes sf{0%{width:0%}60%{width:72%}100%{width:100%}}
.sok{display:inline-flex;align-items:center;gap:5px;font-size:.72rem;color:var(--gr);background:var(--grl);padding:4px 9px;border-radius:20px;font-weight:700;margin-bottom:11px;}
.simg{width:100%;max-height:150px;object-fit:contain;border-radius:8px;background:var(--bg);padding:6px;margin-bottom:9px;}

/* ════ AMOUNT PREVIEW ════ */
.ap{background:var(--bl);border:1.5px solid #c7d7ff;border-radius:var(--r2);padding:11px 13px;margin:3px 0 13px;}
.apr{display:flex;justify-content:space-between;font-size:.84rem;padding:3px 0;color:var(--t2);}
.apr.tot{border-top:1px solid #c7d7ff;margin-top:7px;padding-top:8px;font-weight:700;color:var(--n);}
.apr.tot span:last-child{color:var(--o);font-size:.95rem;}

/* ════ CLIENT CARD ════ */
.cc{background:var(--w);border-radius:var(--r);box-shadow:var(--sh);border:1px solid var(--bd);padding:13px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.cc:active{background:#fafbfc;}
.cav{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--n),var(--n2));color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Lato',sans-serif;font-weight:900;font-size:1rem;flex-shrink:0;}
.cname{font-weight:700;font-size:.9rem;color:var(--n);}
.cdet{font-size:.75rem;color:var(--t2);margin-top:1px;display:flex;align-items:center;gap:5px;}
.csir{font-size:.68rem;background:var(--bg);color:var(--mu);padding:2px 7px;border-radius:4px;font-weight:600;display:inline-block;margin:5px 0 8px;}
.cst{display:flex;gap:14px;border-top:1px solid var(--bd);padding-top:8px;margin-top:8px;}
.cstt{font-size:.72rem;color:var(--mu);font-weight:600;}
.cstt strong{display:block;font-family:'Lato',sans-serif;color:var(--n);font-size:.86rem;font-weight:900;}

/* ════ GRAND LIVRE ════ */
.glw{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.gl-row{display:flex;font-size:.78rem;padding:9px 14px;border-bottom:1px solid var(--bd);gap:8px;align-items:center;min-width:480px;}
.gl-row:last-child{border-bottom:none;}
.gl-row.header{background:var(--bg);font-weight:700;font-size:.66rem;text-transform:uppercase;letter-spacing:.8px;color:var(--mu);padding:9px 14px;}
.gl-date{width:64px;flex-shrink:0;color:var(--t2);}
.gl-lib{flex:1;min-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--t);}
.gl-cpt{width:58px;flex-shrink:0;color:var(--mu);font-size:.72rem;}
.gl-deb,.gl-cre{width:74px;text-align:right;flex-shrink:0;font-family:'Lato',sans-serif;font-weight:700;}
.gl-deb{color:var(--re);}.gl-cre{color:var(--gr);}

/* ════ BANK ════ */
.bank-row{display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid var(--bd);gap:10px;-webkit-tap-highlight-color:transparent;}
.bank-row:last-child{border-bottom:none;}
.bank-row:active{background:var(--bg);}
.bank-lib{flex:1;min-width:0;}
.bank-lib-t{font-size:.85rem;font-weight:600;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bank-lib-s{font-size:.7rem;color:var(--mu);margin-top:1px;}
.bank-amt{font-family:'Lato',sans-serif;font-weight:700;font-size:.9rem;flex-shrink:0;}
.bank-amt.pos{color:var(--gr);}
.bank-amt.neg{color:var(--re);}
.match-btn{font-size:.68rem;padding:5px 10px;border-radius:14px;cursor:pointer;border:1px solid var(--bd);background:#fff;color:var(--t2);font-weight:600;font-family:'Source Sans 3',sans-serif;-webkit-tap-highlight-color:transparent;min-height:30px;white-space:nowrap;}
.match-btn.matched{background:var(--grl);color:var(--gr);border-color:var(--gr);}
.match-btn:active{transform:scale(.95);}

/* ════ RELANCE ════ */
.relcard{background:var(--w);border-radius:var(--r);box-shadow:var(--sh);border:1px solid var(--bd);padding:13px;}
.relcard.urgent{border-left:4px solid var(--re);}
.relcard.warn{border-left:4px solid var(--am);}

/* ════ BILAN ════ */
.bilan-head{font-family:'Lato',sans-serif;font-weight:900;font-size:.88rem;color:var(--n);padding:11px 14px;background:var(--bg);border-bottom:1px solid var(--bd);}
.bilan-row{display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid var(--bd);font-size:.84rem;}
.bilan-row:last-child{border-bottom:none;}
.bilan-row.total{background:var(--n);color:#fff;font-weight:700;border-radius:0 0 var(--r) var(--r);padding:11px 14px;}
.bilan-row.total span:last-child{font-family:'Lato',sans-serif;font-weight:900;}

/* ════ PARAMS ════ */
.param-row{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-bottom:1px solid var(--bd);cursor:pointer;-webkit-tap-highlight-color:transparent;}
.param-row:last-child{border-bottom:none;}
.param-row:active{background:var(--bg);}
.param-label{font-size:.88rem;font-weight:600;color:var(--t);}
.param-sub{font-size:.72rem;color:var(--mu);margin-top:1px;}

/* ════ BOTTOM NAV ════ */
.bnav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:#fff;border-top:1px solid var(--bd);display:flex;padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -2px 10px rgba(0,0,0,.06);}
.bni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 3px 6px;cursor:pointer;font-size:.58rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.4px;gap:2px;-webkit-tap-highlight-color:transparent;position:relative;min-height:54px;}
.bni .ti{font-size:1.22rem;transition:transform .14s;}
.bni.active{color:var(--o);}
.bni.active .ti{transform:scale(1.1);}
.bni.active::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:22px;height:2.5px;background:var(--o);border-radius:0 0 3px 3px;}

/* ════ TOAST ════ */
.toast-zone{position:fixed;bottom:calc(70px + env(safe-area-inset-bottom,0px));left:14px;right:14px;z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
.toast{background:var(--n);color:#fff;padding:11px 16px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.25);font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:10px;animation:toastIn .25s ease;pointer-events:all;}
.toast.success{background:var(--gr);}
.toast.error{background:var(--re);}
.toast.info{background:var(--n);}
@keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

/* ════ MISC ════ */
.mono{font-family:'Lato',sans-serif;font-weight:700;}
.gc{display:flex;flex-direction:column;gap:10px;}
.empty{text-align:center;padding:40px 14px;}
.ei{font-size:2.2rem;opacity:.22;margin-bottom:7px;}
.et{font-size:.82rem;color:var(--mu);font-weight:600;}
.divrow{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--bd);font-size:.84rem;}
.divrow:last-child{border-bottom:none;}
`;

// ─── SEED DATA ─────────────────────────────────────────────────────────────────
const CATS = ["Abonnement","Matériel","Déplacement","Restaurant","Hébergement","Télécom","Formation","Divers"];
const CATS_IC = {Abonnement:'💻',Matériel:'📦',Déplacement:'🚆',Restaurant:'🍽️',Hébergement:'🏨',Télécom:'📱',Formation:'📚',Divers:'📎'};
const M5 = ["Jan","Fév","Mar","Avr","Mai"];
const BARS = [4800,2400,6200,1900,3500];

const I0 = [
  {id:"F-2026-001",client:"Agence Lumière",date:"2026-01-15",amount:4800,tva:20,status:"paid",desc:"Développement site web",due:"2026-02-15"},
  {id:"F-2026-002",client:"Studio Forma",date:"2026-02-03",amount:2400,tva:20,status:"paid",desc:"Identité visuelle",due:"2026-03-03"},
  {id:"F-2026-003",client:"TechVenture SAS",date:"2026-03-20",amount:6200,tva:20,status:"pending",desc:"Audit SEO & stratégie",due:"2026-04-20"},
  {id:"F-2026-004",client:"Maison Dupont",date:"2026-04-01",amount:1900,tva:20,status:"late",desc:"Maintenance mensuelle",due:"2026-05-01"},
  {id:"F-2026-005",client:"Agence Lumière",date:"2026-05-10",amount:3500,tva:20,status:"draft",desc:"Campagne email",due:"2026-06-10"},
];
const Q0 = [
  {id:"D-2026-001",client:"Studio Forma",date:"2026-04-10",amount:3200,tva:20,status:"accepted",desc:"Refonte charte graphique",due:"2026-05-10"},
  {id:"D-2026-002",client:"TechVenture SAS",date:"2026-05-02",amount:8500,tva:20,status:"sent",desc:"Développement app mobile",due:"2026-06-02"},
  {id:"D-2026-003",client:"Maison Dupont",date:"2026-05-08",amount:1200,tva:20,status:"draft",desc:"Formation WordPress",due:"2026-06-08"},
];
const E0 = [
  {id:1,date:"2026-01-10",merchant:"Adobe Creative Cloud",amount:59.99,tva:20,cat:"Abonnement",note:"",matched:true},
  {id:2,date:"2026-02-14",merchant:"SNCF",amount:87.50,tva:10,cat:"Déplacement",note:"Paris-Lyon",matched:true},
  {id:3,date:"2026-03-05",merchant:"Amazon Business",amount:320,tva:20,cat:"Matériel",note:"Disque SSD",matched:false},
  {id:4,date:"2026-04-22",merchant:"Le Grand Véfour",amount:145,tva:10,cat:"Restaurant",note:"Déjeuner client",matched:false},
];
const C0 = [
  {id:1,name:"Agence Lumière",email:"contact@lumiere.fr",phone:"01 23 45 67 89",siret:"123 456 789 00012"},
  {id:2,name:"Studio Forma",email:"hello@studioforma.io",phone:"06 12 34 56 78",siret:"987 654 321 00045"},
  {id:3,name:"TechVenture SAS",email:"billing@techventure.co",phone:"01 98 76 54 32",siret:"456 123 789 00078"},
  {id:4,name:"Maison Dupont",email:"admin@maisondupont.fr",phone:"04 56 78 90 12",siret:"321 987 654 00091"},
];
const BANK0 = [
  {id:1,date:"2026-05-08",label:"VIR AGENCE LUMIÈRE",amount:5760,matched:true},
  {id:2,date:"2026-05-07",label:"PRÉLÈV ADOBE SYSTEMS",amount:-59.99,matched:true},
  {id:3,date:"2026-05-05",label:"VIR STUDIO FORMA",amount:2880,matched:true},
  {id:4,date:"2026-05-03",label:"CB AMAZON BUSINESS",amount:-320,matched:false},
  {id:5,date:"2026-04-28",label:"PRÉLÈV ORANGE PRO",amount:-45,matched:false},
];

const fmt = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0);
const fmtD = d => new Date(d).toLocaleDateString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];
const nxtInv = a => `F-2026-${String(Math.max(0,...a.map(i=>+i.id.split('-').pop()))+1).padStart(3,'0')}`;
const nxtQ = a => `D-2026-${String(Math.max(0,...a.map(i=>+i.id.split('-').pop()))+1).padStart(3,'0')}`;
const dl = (text,filename,mime='text/plain') => {
  const blob = new Blob([text],{type:mime+';charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),100);
};

const QBADGE = {accepted:<span className="badge bp"><span className="dot dg"/>Accepté</span>,sent:<span className="badge bpd"><span className="dot dam"/>Envoyé</span>,draft:<span className="badge bd2"><span className="dot dmu"/>Brouillon</span>,refused:<span className="badge bl2"><span className="dot dr"/>Refusé</span>};
const IBADGE = {paid:<span className="badge bp"><span className="dot dg"/>Payée</span>,pending:<span className="badge bpd"><span className="dot dam"/>Envoyée</span>,late:<span className="badge bl2"><span className="dot dr"/>En retard</span>,draft:<span className="badge bd2"><span className="dot dmu"/>Brouillon</span>};

// ─── GOOGLE ICON ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="google-ic" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [invs, setInvs] = useState(I0);
  const [quotes, setQuotes] = useState(Q0);
  const [exps, setExps] = useState(E0);
  const [clients, setClients] = useState(C0);
  const [bank, setBank] = useState(BANK0);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Toast system
  const toast = useCallback((msg, type='info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2400);
  }, []);

  // Auth
  const loginWith = (acc) => {
    setLoadingAuth(true);
    setTimeout(() => {
      setUser(acc);
      setLoadingAuth(false);
      toast(`Bienvenue ${acc.name.split(' ')[0]} 👋`, 'success');
    }, 1100);
  };
  const logout = () => {
    setUser(null);
    setDrawer(false);
    setPage('dashboard');
    toast('Vous êtes déconnecté', 'info');
  };

  // Computed
  const ca = invs.filter(i=>i.status!=='draft').reduce((s,i)=>s+i.amount,0);
  const paid = invs.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0);
  const pend = invs.filter(i=>i.status==='pending'||i.status==='late').reduce((s,i)=>s+i.amount,0);
  const expt = exps.reduce((s,e)=>s+e.amount,0);
  const tvaC = invs.filter(i=>i.status!=='draft').reduce((s,i)=>s+i.amount*i.tva/100,0);
  const tvaD = exps.reduce((s,e)=>s+e.amount*e.tva/100,0);
  const tvaDue = tvaC - tvaD;
  const res = ca - expt;

  const NAV1 = [
    {id:"dashboard",icon:"🏠",label:"Accueil"},
    {id:"invoices",icon:"🧾",label:"Factures"},
    {id:"expenses",icon:"💸",label:"Dépenses"},
    {id:"tva",icon:"📋",label:"TVA"},
    {id:"clients",icon:"👥",label:"Clients"},
  ];
  const NAV2 = [
    {id:"quotes",icon:"📝",label:"Devis"},
    {id:"bank",icon:"🏦",label:"Banque"},
    {id:"relances",icon:"🔔",label:"Relances"},
    {id:"grandlivre",icon:"📒",label:"Grand Livre"},
    {id:"bilan",icon:"⚖️",label:"Bilan"},
    {id:"fec",icon:"📤",label:"Export FEC"},
    {id:"params",icon:"⚙️",label:"Paramètres"},
  ];
  const go = p => { setPage(p); setDrawer(false); };
  const om = (type, data=null) => setModal({type, data});
  const cm = () => setModal(null);
  const curLabel = [...NAV1, ...NAV2].find(n => n.id === page)?.label || "";

  // ─── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <style>{CSS}</style>
        {loadingAuth && (
          <div className="splash">
            <div className="spinner"/>
            <div className="splash-t">Connexion en cours…</div>
          </div>
        )}
        <LoginScreen onLogin={loginWith} />
        <ToastZone toasts={toasts}/>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* TOPBAR */}
        <header className="topbar">
          <div className="tl">
            <button className={`burger ${drawer?'open':''}`} onClick={()=>setDrawer(o=>!o)} aria-label="Menu">
              <span/><span/><span/>
            </button>
            <div className="logo"><div className="logo-ic">C</div>ComptaPro</div>
          </div>
          <div className="tb-avatar" onClick={()=>setDrawer(true)}>{user.name[0]}</div>
        </header>

        {/* DRAWER */}
        <div className={`ov ${drawer?'on':''}`} onClick={()=>setDrawer(false)}/>
        <div className={`drawer ${drawer?'on':''}`}>
          <div className="dw-head">
            <div className="logo" style={{color:'#fff'}}><div className="logo-ic">C</div>ComptaPro</div>
            <button className="dw-close" onClick={()=>setDrawer(false)}>✕</button>
          </div>
          <div className="dw-user">
            <div className="dw-user-av">{user.name[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="dw-user-name">{user.name}</div>
              <div className="dw-user-sub">{user.email}</div>
            </div>
          </div>
          <nav className="dw-nav">
            <div className="dw-sec">Navigation principale</div>
            {NAV1.map(n=>(
              <div key={n.id} className={`dw-item ${page===n.id?'active':''}`} onClick={()=>go(n.id)}>
                <span className="dw-icon">{n.icon}</span>{n.label}
              </div>
            ))}
            <div className="dw-sec" style={{marginTop:6}}>Comptabilité avancée</div>
            {NAV2.map(n=>(
              <div key={n.id} className={`dw-item ${page===n.id?'active':''}`} onClick={()=>go(n.id)}>
                <span className="dw-icon">{n.icon}</span>{n.label}
              </div>
            ))}
          </nav>
          <div className="dw-foot">
            <button className="dw-logout" onClick={logout}>
              <span>↪</span>Se déconnecter
            </button>
          </div>
        </div>

        {/* MAIN */}
        <main className="main">
          {page==="dashboard" && <Dashboard {...{invs,exps,quotes,ca,paid,pend,expt,tvaDue,tvaD,res,onNav:go,om,toast,user}}/>}
          {page==="invoices" && <Invoices {...{invs,setInvs,clients,modal,om,cm,toast}}/>}
          {page==="quotes" && <Quotes {...{quotes,setQuotes,clients,invs,setInvs,modal,om,cm,toast}}/>}
          {page==="expenses" && <Expenses {...{exps,setExps,modal,om,cm,toast}}/>}
          {page==="bank" && <Bank {...{bank,setBank,toast}}/>}
          {page==="tva" && <TVA {...{invs,exps,tvaC,tvaD,tvaDue,toast}}/>}
          {page==="clients" && <Clients {...{clients,setClients,invs,modal,om,cm,toast}}/>}
          {page==="relances" && <Relances {...{invs,setInvs,toast}}/>}
          {page==="grandlivre" && <GrandLivre {...{invs,exps,toast}}/>}
          {page==="bilan" && <Bilan {...{invs,exps,ca,expt,res,toast}}/>}
          {page==="fec" && <FEC {...{invs,exps,toast,user}}/>}
          {page==="params" && <Params {...{user,toast}}/>}
        </main>

        {/* BOTTOM NAV */}
        <nav className="bnav">
          {NAV1.map(n=>(
            <div key={n.id} className={`bni ${page===n.id?'active':''}`} onClick={()=>go(n.id)}>
              <span className="ti">{n.icon}</span>{n.label}
            </div>
          ))}
        </nav>

        <ToastZone toasts={toasts}/>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [picker, setPicker] = useState(false);
  const accs = [
    {name:"Rachid Benziane", email:"rachid.benziane@gmail.com", color:"o"},
    {name:"Jean Dupont", email:"jean.dupont@example.com", color:"alt"},
  ];
  return (
    <div className="login-bg">
      <div className="login-content">
        <div className="login-logo">C</div>
        <div className="login-title">ComptaPro</div>
        <div className="login-sub">La compta simple pour indépendants</div>

        <div className="login-card">
          <div className="login-tagline">
            Connectez-vous pour gérer factures, dépenses, TVA et bilan.
          </div>
          <button className="btn-google" onClick={()=>setPicker(true)}>
            <GoogleIcon/>
            Continuer avec Google
          </button>
        </div>

        <div className="login-features">
          <div className="lf"><div className="lf-i">🧾</div>Facturation conforme 2026</div>
          <div className="lf"><div className="lf-i">📸</div>Scan ticket par IA</div>
          <div className="lf"><div className="lf-i">📤</div>Export FEC officiel</div>
        </div>
      </div>
      <div className="login-foot">v3.0 · Démonstration · Données fictives</div>

      {picker && (
        <div className="moo center" onClick={()=>setPicker(false)}>
          <div className="gpicker" onClick={e=>e.stopPropagation()}>
            <div className="gpicker-h">
              <GoogleIcon/>
              <span>Se connecter avec Google</span>
            </div>
            <div className="gpicker-s">Choisissez un compte pour continuer vers ComptaPro</div>
            {accs.map((a,i)=>(
              <div key={i} className="gacc" onClick={()=>{setPicker(false);onLogin(a);}}>
                <div className={`gacc-av ${a.color==='alt'?'alt':''}`}>{a.name[0]}</div>
                <div className="gacc-i">
                  <div className="gacc-n">{a.name}</div>
                  <div className="gacc-e">{a.email}</div>
                </div>
              </div>
            ))}
            <div className="gpicker-add" onClick={()=>{setPicker(false);onLogin({name:"Utilisateur Démo",email:"demo@comptapro.fr",color:"o"});}}>
              <div className="gpicker-add-ic">+</div>
              <span>Utiliser un autre compte</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST ZONE
// ═══════════════════════════════════════════════════════════════════════════════
function ToastZone({ toasts }) {
  return (
    <div className="toast-zone">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({invs,exps,quotes,ca,paid,pend,expt,tvaDue,tvaD,res,onNav,om,toast,user}){
  const late = invs.filter(i=>i.status==='late');
  const recent = [...invs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
  const max = Math.max(...BARS);
  const firstName = user.name.split(' ')[0];
  return(
    <div className="page">
      <div className="hero">
        <div className="hero-t">Bonjour {firstName} 👋</div>
        <div className="hero-s">Exercice 2026 · EURL · TVA réel normal</div>
      </div>
      <div className="pb">
        {late.length>0&&
          <div className="alert ar" onClick={()=>onNav('relances')} style={{cursor:'pointer'}}>
            <span>⚠️</span>
            <span><strong>{late.length} facture{late.length>1?'s':''} en retard</strong> · {fmt(late.reduce((s,i)=>s+i.amount,0))} · Tapez pour relancer</span>
          </div>}
        <div className="kr">
          <div className="kpi cn" onClick={()=>onNav('invoices')}><div className="kl">CA 2026</div><div className="kv">{fmt(ca)}</div><div className="ks">Voir factures →</div></div>
          <div className="kpi cg" onClick={()=>{toast(`${fmt(paid)} déjà encaissés`,'success')}}><div className="kl">Encaissé</div><div className="kv vg">{fmt(paid)}</div><div className="ks ok">Payées</div></div>
        </div>
        <div className="kr">
          <div className="kpi co" onClick={()=>onNav('relances')}><div className="kl">En attente</div><div className="kv vo">{fmt(pend)}</div><div className="ks">À encaisser →</div></div>
          <div className="kpi cam" onClick={()=>onNav('tva')}><div className="kl">TVA à payer</div><div className="kv vam" style={{fontSize:'1.1rem'}}>{fmt(tvaDue)}</div><div className="ks">Voir détail →</div></div>
        </div>
        <div className="card">
          <div className="sh" style={{paddingBottom:4}}><div className="st">Activité 2026</div><button className="sl" onClick={()=>toast('Recettes HT mensuelles 2026','info')}>Détails →</button></div>
          <div style={{padding:'0 14px 12px'}}>
            <div className="mchart">{BARS.map((v,i)=><div key={i} className="mcc" onClick={()=>toast(`${M5[i]} : ${fmt(v)}`,'info')}><div className="mcb" style={{height:`${(v/max)*100}%`}}/><span className="mcl">{M5[i]}</span></div>)}</div>
            <div style={{fontSize:'.68rem',color:'var(--mu)',fontWeight:600}}>Recettes HT (€) · Tapez une barre</div>
          </div>
        </div>
        <div className="card">
          <div className="sh"><div className="st">Dernières factures</div><button className="sl" onClick={()=>onNav('invoices')}>Tout voir →</button></div>
          <div>
            {recent.map(inv=>(
              <div key={inv.id} className="ir" onClick={()=>{onNav('invoices');toast(`${inv.id} · ${inv.client}`,'info');}}>
                <div className={`iico ${inv.status==='paid'?'ig':inv.status==='late'?'ir2':'iam'}`}>🧾</div>
                <div className="ii"><div className="it">{inv.client}</div><div className="is">{IBADGE[inv.status]}</div></div>
                <div className="irr"><div className="iam2">{fmt(inv.amount)}</div><div className="idat">{fmtD(inv.date)}</div></div>
              </div>
            ))}
          </div>
        </div>
        {quotes.filter(q=>q.status==='accepted').length>0&&
          <div className="alert ab2" onClick={()=>onNav('quotes')} style={{cursor:'pointer'}}>
            <span>📝</span>
            <span><strong>{quotes.filter(q=>q.status==='accepted').length} devis accepté(s)</strong> · à convertir en facture</span>
          </div>}
        <button className="btn bc bfl" onClick={()=>{onNav('invoices');om('inv',null);}}>+ Créer une facture</button>
        <button className="btn bo bfl" onClick={()=>onNav('quotes')}>📝 Voir mes devis</button>
        <button className="btn bo bfl" onClick={()=>onNav('expenses')}>📸 Scanner un ticket</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════════════════════════════
function Invoices({invs,setInvs,clients,modal,om,cm,toast}){
  const [f,setF]=useState("all");
  const list=f==="all"?invs:invs.filter(i=>i.status===f);
  const save=d=>{
    if(modal?.data){setInvs(p=>p.map(i=>i.id===modal.data.id?{...i,...d}:i));toast('Facture mise à jour ✓','success');}
    else{setInvs(p=>[...p,{...d,id:nxtInv(p)}]);toast('Facture créée ✓','success');}
    cm();
  };
  const genPDF=(inv)=>{
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture ${inv.id}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#1b3a6b;max-width:700px;margin:0 auto;}
    h1{font-size:2rem;margin-bottom:4px;color:#1b3a6b;}.sub{color:#94a3b8;font-size:.9rem;margin-bottom:32px;}
    .row{display:flex;justify-content:space-between;border-bottom:1px solid #e8eaed;padding:8px 0;font-size:.9rem;}
    .total{font-weight:700;font-size:1.1rem;background:#1b3a6b;color:#fff;padding:12px 16px;border-radius:8px;display:flex;justify-content:space-between;margin-top:12px;}
    .info{margin-bottom:24px;}.info p{margin:2px 0;font-size:.88rem;}
    </style></head><body>
    <h1>FACTURE</h1><div class="sub">${inv.id} · émise le ${fmtD(inv.date)}</div>
    <div class="info"><p><strong>Mon EURL</strong></p><p>SIRET : 123 456 789 00099</p><p>TVA : FR12 123456789</p></div>
    <div class="info"><p><strong>Client :</strong> ${inv.client}</p><p>Échéance : ${fmtD(inv.due||inv.date)}</p></div>
    <div class="row"><span>Prestation</span><span>${inv.desc}</span></div>
    <div class="row"><span>Montant HT</span><span>${fmt(inv.amount)}</span></div>
    <div class="row"><span>TVA ${inv.tva}%</span><span>${fmt(inv.amount*inv.tva/100)}</span></div>
    <div class="total"><span>Total TTC</span><span>${fmt(inv.amount*(1+inv.tva/100))}</span></div>
    <p style="margin-top:24px;font-size:.78rem;color:#94a3b8;">IBAN : FR76 1234 5678 9012 3456 7890 123</p>
    </body></html>`;
    dl(html,`facture-${inv.id}.html`,'text/html');
    toast(`PDF ${inv.id} téléchargé`,'success');
  };
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Facturation</div><div className="hero-s">{invs.length} factures · 2026</div></div>
      <div className="pb">
        <button className="btn bc bfl" onClick={()=>om('inv',null)}>+ Nouvelle facture</button>
        <div className="card" style={{paddingBottom:0}}>
          <div className="tabs">{[["all","Toutes"],["paid","Payées"],["pending","Envoyées"],["late","Retard"],["draft","Brouillons"]].map(([v,l])=>(<button key={v} className={`tab ${f===v?'active':''}`} onClick={()=>setF(v)}>{l}</button>))}</div>
          <div>
            {list.length===0&&<div className="empty"><div className="ei">🧾</div><div className="et">Aucune facture</div></div>}
            {list.map(inv=>(
              <div key={inv.id} className="ir" onClick={()=>om('inv',inv)}>
                <div className={`iico ${inv.status==='paid'?'ig':inv.status==='late'?'ir2':'iam'}`}>🧾</div>
                <div className="ii">
                  <div className="it">{inv.client}</div>
                  <div className="is"><span style={{color:'var(--mu)',fontSize:'.7rem'}}>{inv.id}</span>{IBADGE[inv.status]}</div>
                </div>
                <div className="irr">
                  <div className="iam2">{fmt(inv.amount)}</div>
                  <div className="idat">{fmtD(inv.date)}</div>
                  <div className="iact">
                    {inv.status!=='paid'&&<button className="btn bg bic" title="Payée" onClick={e=>{e.stopPropagation();setInvs(p=>p.map(i=>i.id===inv.id?{...i,status:'paid'}:i));toast('Facture marquée payée','success');}}>✓</button>}
                    <button className="btn bg bic" title="PDF" onClick={e=>{e.stopPropagation();genPDF(inv);}}>📄</button>
                    <button className="btn bgr bic" onClick={e=>{e.stopPropagation();setInvs(p=>p.filter(i=>i.id!==inv.id));toast('Facture supprimée','info');}}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {modal?.type==='inv'&&<InvModal cm={cm} onSave={save} init={modal.data} clients={clients}/>}
    </div>
  );
}

function InvModal({cm,onSave,init,clients}){
  const [f,sf]=useState({client:init?.client||"",date:init?.date||today(),amount:init?.amount||"",tva:init?.tva||20,status:init?.status||"draft",desc:init?.desc||"",due:init?.due||""});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return(
    <div className="moo" onClick={cm}>
      <div className="mo" onClick={e=>e.stopPropagation()}>
        <div className="moh"/>
        <div className="mot">{init?"Modifier la facture":"Nouvelle facture"}</div>
        <div className="fg"><label className="fl">Client</label>
          <select className="fi" value={f.client} onChange={e=>s('client',e.target.value)}>
            <option value="">— Choisir —</option>
            {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">Description</label><input className="fi" value={f.desc} onChange={e=>s('desc',e.target.value)} placeholder="Prestation…"/></div>
        <div className="fr2">
          <div className="fg"><label className="fl">Émission</label><input type="date" className="fi" value={f.date} onChange={e=>s('date',e.target.value)}/></div>
          <div className="fg"><label className="fl">Échéance</label><input type="date" className="fi" value={f.due} onChange={e=>s('due',e.target.value)}/></div>
        </div>
        <div className="fr2">
          <div className="fg"><label className="fl">Montant HT (€)</label><input type="number" className="fi" inputMode="decimal" value={f.amount} onChange={e=>s('amount',parseFloat(e.target.value)||0)} placeholder="0,00"/></div>
          <div className="fg"><label className="fl">TVA</label>
            <select className="fi" value={f.tva} onChange={e=>s('tva',parseFloat(e.target.value))}>
              <option value={20}>20 %</option><option value={10}>10 %</option><option value={5.5}>5,5 %</option><option value={0}>0 %</option>
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">Statut</label>
          <select className="fi" value={f.status} onChange={e=>s('status',e.target.value)}>
            <option value="draft">Brouillon</option><option value="pending">Envoyée</option><option value="paid">Payée</option><option value="late">En retard</option>
          </select>
        </div>
        {f.amount>0&&<div className="ap">
          <div className="apr"><span>HT</span><span>{fmt(+f.amount)}</span></div>
          <div className="apr"><span>TVA {f.tva}%</span><span>{fmt(+f.amount*f.tva/100)}</span></div>
          <div className="apr tot"><span>TTC</span><span>{fmt(+f.amount*(1+f.tva/100))}</span></div>
        </div>}
        <div className="mof">
          <button className="btn bc bfl" onClick={()=>onSave(f)}>Enregistrer</button>
          <button className="btn bo bfl" onClick={cm}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════════════════════
function Quotes({quotes,setQuotes,clients,invs,setInvs,modal,om,cm,toast}){
  const [f,setF]=useState("all");
  const list=f==="all"?quotes:quotes.filter(q=>q.status===f);
  const save=d=>{
    if(modal?.data){setQuotes(p=>p.map(q=>q.id===modal.data.id?{...q,...d}:q));toast('Devis mis à jour ✓','success');}
    else{setQuotes(p=>[...p,{...d,id:nxtQ(p)}]);toast('Devis créé ✓','success');}
    cm();
  };
  const convert=q=>{
    setInvs(p=>[...p,{...q,id:nxtInv(p),status:'pending',due:q.due||q.date}]);
    setQuotes(p=>p.map(x=>x.id===q.id?{...x,status:'accepted'}:x));
    toast('Devis converti en facture ✓','success');
  };
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Devis</div><div className="hero-s">{quotes.length} devis · 2026</div></div>
      <div className="pb">
        <button className="btn bc bfl" onClick={()=>om('quote',null)}>+ Nouveau devis</button>
        <div className="card" style={{paddingBottom:0}}>
          <div className="tabs">{[["all","Tous"],["draft","Brouillons"],["sent","Envoyés"],["accepted","Acceptés"],["refused","Refusés"]].map(([v,l])=>(<button key={v} className={`tab ${f===v?'active':''}`} onClick={()=>setF(v)}>{l}</button>))}</div>
          <div>
            {list.length===0&&<div className="empty"><div className="ei">📝</div><div className="et">Aucun devis</div></div>}
            {list.map(q=>(
              <div key={q.id} className="ir" onClick={()=>om('quote',q)}>
                <div className="iico ipu">📝</div>
                <div className="ii">
                  <div className="it">{q.client}</div>
                  <div className="is"><span style={{color:'var(--mu)',fontSize:'.7rem'}}>{q.id}</span>{QBADGE[q.status]}</div>
                </div>
                <div className="irr">
                  <div className="iam2">{fmt(q.amount)}</div>
                  <div className="idat">{fmtD(q.date)}</div>
                  <div className="iact">
                    {(q.status==='sent'||q.status==='accepted')&&<button className="btn bg" style={{padding:'4px 6px',fontSize:'.65rem',minHeight:'28px'}} onClick={e=>{e.stopPropagation();convert(q);}}>→ FAC</button>}
                    <button className="btn bgr bic" onClick={e=>{e.stopPropagation();setQuotes(p=>p.filter(x=>x.id!==q.id));toast('Devis supprimé','info');}}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="alert ab2"><span>💡</span><span>Un devis envoyé ou accepté peut être converti en facture via <strong>→ FAC</strong></span></div>
      </div>
      {modal?.type==='quote'&&<QModal cm={cm} onSave={save} init={modal.data} clients={clients}/>}
    </div>
  );
}

function QModal({cm,onSave,init,clients}){
  const [f,sf]=useState({client:init?.client||"",date:init?.date||today(),amount:init?.amount||"",tva:init?.tva||20,status:init?.status||"draft",desc:init?.desc||"",due:init?.due||""});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return(
    <div className="moo" onClick={cm}>
      <div className="mo" onClick={e=>e.stopPropagation()}>
        <div className="moh"/>
        <div className="mot">{init?"Modifier le devis":"Nouveau devis"}</div>
        <div className="fg"><label className="fl">Client</label>
          <select className="fi" value={f.client} onChange={e=>s('client',e.target.value)}>
            <option value="">— Choisir —</option>
            {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">Description</label><input className="fi" value={f.desc} onChange={e=>s('desc',e.target.value)} placeholder="Prestation proposée…"/></div>
        <div className="fr2">
          <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={f.date} onChange={e=>s('date',e.target.value)}/></div>
          <div className="fg"><label className="fl">Validité</label><input type="date" className="fi" value={f.due} onChange={e=>s('due',e.target.value)}/></div>
        </div>
        <div className="fr2">
          <div className="fg"><label className="fl">Montant HT (€)</label><input type="number" className="fi" inputMode="decimal" value={f.amount} onChange={e=>s('amount',parseFloat(e.target.value)||0)}/></div>
          <div className="fg"><label className="fl">TVA</label>
            <select className="fi" value={f.tva} onChange={e=>s('tva',parseFloat(e.target.value))}>
              <option value={20}>20 %</option><option value={10}>10 %</option><option value={5.5}>5,5 %</option><option value={0}>0 %</option>
            </select>
          </div>
        </div>
        <div className="fg"><label className="fl">Statut</label>
          <select className="fi" value={f.status} onChange={e=>s('status',e.target.value)}>
            <option value="draft">Brouillon</option><option value="sent">Envoyé</option><option value="accepted">Accepté</option><option value="refused">Refusé</option>
          </select>
        </div>
        {f.amount>0&&<div className="ap">
          <div className="apr"><span>HT</span><span>{fmt(+f.amount)}</span></div>
          <div className="apr tot"><span>TTC</span><span>{fmt(+f.amount*(1+f.tva/100))}</span></div>
        </div>}
        <div className="mof">
          <button className="btn bc bfl" onClick={()=>onSave(f)}>Enregistrer</button>
          <button className="btn bo bfl" onClick={cm}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════════
function Expenses({exps,setExps,modal,om,cm,toast}){
  const [scan,setScan]=useState(false);
  const save=d=>{
    if(modal?.data){setExps(p=>p.map(e=>e.id===modal.data.id?{...e,...d}:e));toast('Dépense mise à jour ✓','success');}
    else{setExps(p=>[...p,{...d,id:Date.now(),matched:false}]);toast('Dépense enregistrée ✓','success');}
    cm();
  };
  const total=exps.reduce((s,e)=>s+e.amount,0);
  const tvaD=exps.reduce((s,e)=>s+e.amount*e.tva/100,0);
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Dépenses</div><div className="hero-s">Notes de frais & charges</div></div>
      <div className="pb">
        <div className="kr">
          <div className="kpi cr" onClick={()=>toast(`${exps.length} dépenses · ${fmt(total)} TTC`,'info')}><div className="kl">Total TTC</div><div className="kv vr">{fmt(total)}</div><div className="ks">{exps.length} lignes</div></div>
          <div className="kpi cg" onClick={()=>toast(`${fmt(tvaD)} de TVA récupérable`,'success')}><div className="kl">TVA déductible</div><div className="kv vg">{fmt(tvaD)}</div><div className="ks ok">À récupérer</div></div>
        </div>
        <div style={{display:'flex',gap:9}}>
          <button className="btn bc" style={{flex:1}} onClick={()=>setScan(true)}>📸 Scanner</button>
          <button className="btn bn" style={{flex:1}} onClick={()=>om('exp',null)}>+ Ajouter</button>
        </div>
        <div className="card">
          <div className="sh"><div className="st">Toutes les dépenses</div></div>
          <div>
            {exps.length===0&&<div className="empty"><div className="ei">💸</div><div className="et">Aucune dépense</div></div>}
            {exps.map(e=>(
              <div key={e.id} className="ir" onClick={()=>om('exp',e)}>
                <div className="iico igr">{CATS_IC[e.cat]||'💸'}</div>
                <div className="ii">
                  <div className="it">{e.merchant}</div>
                  <div className="is"><span className="badge bcat">{e.cat}</span>{e.matched&&<span className="badge bp">✓ Lettré</span>}</div>
                </div>
                <div className="irr">
                  <div className="iam2">{fmt(e.amount)}</div>
                  <div className="idat">{fmtD(e.date)}</div>
                  <div className="iact">
                    <button className="btn bgr bic" onClick={ev=>{ev.stopPropagation();setExps(p=>p.filter(x=>x.id!==e.id));toast('Dépense supprimée','info');}}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {modal?.type==='exp'&&<EModal cm={cm} onSave={save} init={modal.data}/>}
      {scan&&<ScanModal onClose={()=>setScan(false)} onSave={d=>{setExps(p=>[...p,{...d,id:Date.now(),matched:false}]);setScan(false);toast('Dépense scannée ✓','success');}} toast={toast}/>}
    </div>
  );
}

function EModal({cm,onSave,init}){
  const [f,sf]=useState({date:init?.date||today(),merchant:init?.merchant||"",amount:init?.amount||"",tva:init?.tva||20,cat:init?.cat||"Divers",note:init?.note||""});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return(
    <div className="moo" onClick={cm}>
      <div className="mo" onClick={e=>e.stopPropagation()}>
        <div className="moh"/>
        <div className="mot">{init?"Modifier":"Nouvelle dépense"}</div>
        <div className="fr2">
          <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={f.date} onChange={e=>s('date',e.target.value)}/></div>
          <div className="fg"><label className="fl">Catégorie</label><select className="fi" value={f.cat} onChange={e=>s('cat',e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="fg"><label className="fl">Fournisseur</label><input className="fi" value={f.merchant} onChange={e=>s('merchant',e.target.value)} placeholder="SNCF, Amazon…"/></div>
        <div className="fr2">
          <div className="fg"><label className="fl">Montant TTC (€)</label><input type="number" className="fi" inputMode="decimal" value={f.amount} onChange={e=>s('amount',parseFloat(e.target.value)||0)}/></div>
          <div className="fg"><label className="fl">TVA</label><select className="fi" value={f.tva} onChange={e=>s('tva',parseFloat(e.target.value))}><option value={20}>20 %</option><option value={10}>10 %</option><option value={5.5}>5,5 %</option><option value={0}>0 %</option></select></div>
        </div>
        <div className="fg"><label className="fl">Note</label><input className="fi" value={f.note} onChange={e=>s('note',e.target.value)} placeholder="Optionnel…"/></div>
        <div className="mof">
          <button className="btn bc bfl" onClick={()=>onSave(f)}>Enregistrer</button>
          <button className="btn bo bfl" onClick={cm}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN OCR
// ═══════════════════════════════════════════════════════════════════════════════
function ScanModal({onClose,onSave,toast}){
  const [step,setStep]=useState("upload");
  const [img,setImg]=useState(null);
  const [drag,setDrag]=useState(false);
  const [form,setForm]=useState({date:"",merchant:"",amount:"",tva:20,cat:"Divers",note:""});
  const [err,setErr]=useState(null);
  const ref=useRef();
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  const process=useCallback(async file=>{
    if(!file||!file.type.startsWith("image/"))return;
    const r=new FileReader();
    r.onload=async ev=>{
      const src=ev.target.result;setImg(src);setStep("scanning");setErr(null);
      try{
        const b64=src.split(",")[1];
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type,data:b64}},{type:"text",text:`Analyse ce ticket. JSON UNIQUEMENT:\n{"merchant":"nom","date":"YYYY-MM-DD défaut ${today()}","amount":ttc_float,"tva":entier_défaut_20,"cat":"Abonnement|Matériel|Déplacement|Restaurant|Hébergement|Télécom|Formation|Divers","note":"description courte"}`}]}]})});
        const d=await res.json();
        const p=JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
        setForm({date:p.date||today(),merchant:p.merchant||"",amount:p.amount||"",tva:p.tva||20,cat:p.cat||"Divers",note:p.note||""});
        setStep("review");
      }catch{setErr("Ticket illisible. Réessayez avec une photo plus nette.");setStep("upload");}
    };
    r.readAsDataURL(file);
  },[]);
  return(
    <div className="moo" onClick={onClose}>
      <div className="mo" onClick={e=>e.stopPropagation()}>
        <div className="moh"/>
        <div className="mot">📸 Scanner un ticket</div>
        {step==="upload"&&<>
          <div className="alert ab2"><span>✨</span><span>L'IA extrait automatiquement les infos du ticket.</span></div>
          <div className={`sz ${drag?'drag':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);process(e.dataTransfer.files[0])}} onClick={()=>ref.current?.click()}>
            <span className="sz-i">🧾</span><div className="sz-t">Photo ou importer</div><div className="sz-s">JPG · PNG · HEIC</div>
            <input ref={ref} type="file" accept="image/*" capture="environment" onChange={e=>process(e.target.files[0])} style={{display:'none'}}/>
          </div>
          {err&&<div className="alert ar" style={{marginTop:9}}><span>⚠️</span><span>{err}</span></div>}
          <div className="mof"><button className="btn bo bfl" onClick={onClose}>Annuler</button></div>
        </>}
        {step==="scanning"&&<div style={{padding:'18px 0',textAlign:'center'}}>
          {img&&<img src={img} className="simg" alt="ticket"/>}
          <div className="strk"><div className="sfil"/></div>
          <div style={{fontSize:'.8rem',color:'var(--mu)',fontWeight:600}}>Analyse IA en cours…</div>
        </div>}
        {step==="review"&&<>
          {img&&<img src={img} className="simg" alt="ticket"/>}
          <div className="sok">✓ Données extraites — vérifiez ci-dessous</div>
          <div className="fr2">
            <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={form.date} onChange={e=>s('date',e.target.value)}/></div>
            <div className="fg"><label className="fl">Catégorie</label><select className="fi" value={form.cat} onChange={e=>s('cat',e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="fg"><label className="fl">Fournisseur</label><input className="fi" value={form.merchant} onChange={e=>s('merchant',e.target.value)}/></div>
          <div className="fr2">
            <div className="fg"><label className="fl">Montant TTC</label><input type="number" className="fi" inputMode="decimal" value={form.amount} onChange={e=>s('amount',parseFloat(e.target.value)||0)}/></div>
            <div className="fg"><label className="fl">TVA</label><select className="fi" value={form.tva} onChange={e=>s('tva',parseFloat(e.target.value))}><option value={20}>20 %</option><option value={10}>10 %</option><option value={5.5}>5,5 %</option><option value={0}>0 %</option></select></div>
          </div>
          <div className="mof">
            <button className="btn bc bfl" onClick={()=>onSave(form)}>✓ Enregistrer</button>
            <button className="btn bo bfl" onClick={()=>setStep("upload")}>↩ Rescanner</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANK
// ═══════════════════════════════════════════════════════════════════════════════
function Bank({bank,setBank,toast}){
  const solde=bank.reduce((s,b)=>s+b.amount,0);
  const matched=bank.filter(b=>b.matched).length;
  const toggle=id=>{
    setBank(p=>p.map(b=>b.id===id?{...b,matched:!b.matched}:b));
    const b=bank.find(x=>x.id===id);
    toast(b.matched?'Lettrage retiré':'Mouvement lettré ✓',b.matched?'info':'success');
  };
  const [csv,setCsv]=useState("");
  const importCSV=()=>{
    const lines=csv.trim().split('\n').filter(l=>l.trim());
    const rows=lines.map((l,i)=>{
      const c=l.split(/[;,]/);
      const a=parseFloat((c[2]||c[1]||"0").replace(/[^0-9.-]/g,""))||0;
      return{id:Date.now()+i,date:c[0]?.trim()||today(),label:c[1]?.trim()||"Import CSV",amount:a,matched:false};
    }).filter(r=>r.amount!==0);
    if(rows.length){setBank(p=>[...rows,...p]);setCsv("");toast(`${rows.length} ligne(s) importée(s)`,'success');}
    else toast('Aucune ligne valide','error');
  };
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Banque</div><div className="hero-s">Rapprochement bancaire</div></div>
      <div className="pb">
        <div className="kr">
          <div className="kpi cn"><div className="kl">Solde estimé</div><div className="kv" style={{fontSize:'1.05rem'}}>{fmt(solde)}</div><div className="ks">Mouvements saisis</div></div>
          <div className="kpi cg"><div className="kl">Lettrés</div><div className="kv vg">{matched}/{bank.length}</div><div className="ks ok">Rapprochés</div></div>
        </div>
        <div className="card cp">
          <div className="ct" style={{marginBottom:8}}>Import relevé bancaire (CSV)</div>
          <textarea className="fi" style={{minHeight:60,fontSize:'.78rem'}} value={csv} onChange={e=>setCsv(e.target.value)} placeholder={"date;libellé;montant\n2026-05-10;VIR CLIENT;1200\n2026-05-09;CB AMAZON;-89.99"}/>
          <button className="btn bn bfl" style={{marginTop:8}} onClick={importCSV}>Importer les lignes</button>
        </div>
        <div className="card">
          <div className="sh"><div className="st">Mouvements</div><div style={{fontSize:'.7rem',color:'var(--mu)'}}>Tapez pour lettrer</div></div>
          <div>
            {bank.length===0&&<div className="empty"><div className="ei">🏦</div><div className="et">Aucun mouvement</div></div>}
            {bank.map(b=>(
              <div key={b.id} className="bank-row" onClick={()=>toggle(b.id)}>
                <div className={`iico ${b.amount>0?'ig':'ir2'}`}>{b.amount>0?'📥':'📤'}</div>
                <div className="bank-lib">
                  <div className="bank-lib-t">{b.label}</div>
                  <div className="bank-lib-s">{fmtD(b.date)}</div>
                </div>
                <div className={`bank-amt ${b.amount>0?'pos':'neg'}`}>{b.amount>0?'+':''}{fmt(b.amount)}</div>
                <button className={`match-btn ${b.matched?'matched':''}`} onClick={e=>{e.stopPropagation();toggle(b.id);}}>
                  {b.matched?'✓':'Lettrer'}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="alert ab2"><span>ℹ️</span><span>Lettrer chaque mouvement avec sa facture/dépense valide votre rapprochement.</span></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TVA
// ═══════════════════════════════════════════════════════════════════════════════
function TVA({invs,exps,tvaC,tvaD,tvaDue,toast}){
  const rows=M5.map((m,i)=>({m,coll:invs.filter(inv=>new Date(inv.date).getMonth()===i).reduce((s,inv)=>s+inv.amount*inv.tva/100,0),ded:exps.filter(e=>new Date(e.date).getMonth()===i).reduce((s,e)=>s+e.amount*e.tva/100,0)}));
  const baseHT=invs.filter(i=>i.status!=='draft').reduce((s,i)=>s+i.amount,0);
  const exportCA3=()=>{
    const txt=`DÉCLARATION CA3 - Exercice 2026
================================
Base imposable HT : ${fmt(baseHT)}
TVA collectée 20% : ${fmt(tvaC)}
TVA déductible    : ${fmt(tvaD)}
--------------------------------
TVA nette à payer : ${fmt(tvaDue)}`;
    dl(txt,'CA3-2026.txt');
    toast('Déclaration CA3 téléchargée ✓','success');
  };
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Déclaration TVA</div><div className="hero-s">CA3 · Régime réel normal</div></div>
      <div className="pb">
        <div className="kr">
          <div className="kpi cg" onClick={()=>toast(`TVA sur ${fmt(baseHT)} de CA HT`,'info')}><div className="kl">TVA collectée</div><div className="kv vg">{fmt(tvaC)}</div><div className="ks">Sur ventes</div></div>
          <div className="kpi cn" onClick={()=>toast(`${fmt(tvaD)} récupérable`,'info')}><div className="kl">TVA déductible</div><div className="kv">{fmt(tvaD)}</div><div className="ks ok">À récupérer</div></div>
        </div>
        <div className="card cp">
          <div className="ct" style={{marginBottom:10}}>Récapitulatif CA3</div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>Base imposable HT</span><span className="mono">{fmt(baseHT)}</span></div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>TVA brute collectée</span><span className="mono" style={{color:'var(--gr)'}}>{fmt(tvaC)}</span></div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>TVA déductible</span><span className="mono" style={{color:'var(--re)'}}>−{fmt(tvaD)}</span></div>
          <div className="tvabox"><span className="tvabox-l">TVA nette à reverser</span><span className="tvabox-v">{fmt(tvaDue)}</span></div>
        </div>
        <div className="card">
          <div className="sh"><div className="st">Détail mensuel</div></div>
          <div>
            {rows.map(r=>(
              <div key={r.m} className="ir" onClick={()=>toast(`${r.m} : solde ${fmt(r.coll-r.ded)}`,'info')}>
                <div className="iico ib">📅</div>
                <div className="ii"><div className="it">{r.m} 2026</div><div className="is"><span style={{color:'var(--gr)'}}>+{fmt(r.coll)}</span><span style={{color:'var(--mu)'}}>·</span><span style={{color:'var(--re)'}}>−{fmt(r.ded)}</span></div></div>
                <div className="irr"><div className="iam2" style={{color:r.coll-r.ded>=0?'var(--am)':'var(--gr)'}}>{fmt(r.coll-r.ded)}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="alert aa"><span>⏰</span><span>CA3 à déposer avant le <strong>20 du mois</strong> suivant la fin du trimestre</span></div>
        <button className="btn bn bfl" onClick={exportCA3}>📥 Exporter déclaration CA3</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RELANCES
// ═══════════════════════════════════════════════════════════════════════════════
function Relances({invs,setInvs,toast}){
  const list=invs.filter(i=>i.status==='late'||i.status==='pending');
  const [sent,setSent]=useState({});
  const send=id=>{setSent(p=>({...p,[id]:new Date().toLocaleDateString('fr-FR')}));toast('Relance envoyée ✓','success');};
  const pay=id=>{setInvs(p=>p.map(i=>i.id===id?{...i,status:'paid'}:i));toast('Facture marquée payée ✓','success');};
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Relances</div><div className="hero-s">Suivi des impayés</div></div>
      <div className="pb">
        <div className="kr">
          <div className="kpi cr"><div className="kl">En retard</div><div className="kv vr">{invs.filter(i=>i.status==='late').length}</div><div className="ks">factures</div></div>
          <div className="kpi cam"><div className="kl">En attente</div><div className="kv vam">{invs.filter(i=>i.status==='pending').length}</div><div className="ks">factures</div></div>
        </div>
        {list.length===0&&<div className="empty"><div className="ei">✅</div><div className="et">Aucune relance nécessaire !</div></div>}
        <div className="gc">
          {list.map(inv=>{
            const urgent=inv.status==='late';
            return(
              <div key={inv.id} className={`relcard ${urgent?'urgent':'warn'}`}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8,gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:'var(--n)',fontSize:'.92rem'}}>{inv.client}</div>
                    <div style={{fontSize:'.73rem',color:'var(--t2)',marginTop:1}}>{inv.id} · {inv.desc}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:'Lato',fontWeight:900,color:urgent?'var(--re)':'var(--am)',fontSize:'.95rem'}}>{fmt(inv.amount)}</div>
                    {inv.due&&<div style={{fontSize:'.7rem',color:'var(--mu)'}}>Éch. {fmtD(inv.due)}</div>}
                  </div>
                </div>
                {sent[inv.id]&&<div className="alert ag" style={{marginBottom:8,padding:'6px 10px'}}><span>✓</span><span>Relance envoyée le {sent[inv.id]}</span></div>}
                <div style={{display:'flex',gap:8}}>
                  <button className="btn bc bsm" style={{flex:1}} onClick={()=>send(inv.id)}>📧 Relancer</button>
                  <button className="btn bn bsm" style={{flex:1}} onClick={()=>pay(inv.id)}>✓ Payée</button>
                </div>
                <details style={{marginTop:8}}>
                  <summary style={{fontSize:'.73rem',color:'var(--o)',fontWeight:700,cursor:'pointer',padding:'4px 0'}}>Voir l'email type →</summary>
                  <div style={{marginTop:6,padding:10,background:'var(--bg)',borderRadius:'var(--r2)',fontSize:'.75rem',color:'var(--t2)',lineHeight:1.6}}>
                    <strong>Objet :</strong> Relance — Facture {inv.id}<br/><br/>
                    Madame, Monsieur,<br/><br/>
                    Sauf erreur de notre part, la facture <strong>{inv.id}</strong> de <strong>{fmt(inv.amount*(1+inv.tva/100))}</strong> TTC, émise le {fmtD(inv.date)}, demeure impayée.<br/><br/>
                    Nous vous remercions de procéder au règlement.<br/><br/>
                    Cordialement.
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRAND LIVRE
// ═══════════════════════════════════════════════════════════════════════════════
function GrandLivre({invs,exps,toast}){
  const entries=[
    ...invs.filter(i=>i.status!=='draft').map(i=>({date:i.date,lib:`Vente — ${i.client}`,cpt:"706000",deb:0,cre:i.amount})),
    ...invs.filter(i=>i.status!=='draft').map(i=>({date:i.date,lib:`TVA collectée`,cpt:"445710",deb:0,cre:i.amount*i.tva/100})),
    ...invs.filter(i=>i.status==='paid').map(i=>({date:i.date,lib:`Règlement — ${i.client}`,cpt:"411000",deb:i.amount*(1+i.tva/100),cre:0})),
    ...exps.map(e=>({date:e.date,lib:`Charge — ${e.merchant}`,cpt:"606000",deb:e.amount/(1+e.tva/100),cre:0})),
    ...exps.map(e=>({date:e.date,lib:`TVA déductible`,cpt:"445660",deb:e.amount*e.tva/100,cre:0})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const tDeb=entries.reduce((s,e)=>s+e.deb,0);
  const tCre=entries.reduce((s,e)=>s+e.cre,0);
  const exportCSV=()=>{
    const rows=["Date;Libellé;Compte;Débit;Crédit",...entries.map(e=>`${e.date};${e.lib};${e.cpt};${e.deb.toFixed(2)};${e.cre.toFixed(2)}`)];
    dl(rows.join('\n'),'grand-livre-2026.csv','text/csv');
    toast('Grand Livre exporté ✓','success');
  };
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Grand Livre</div><div className="hero-s">Journal des écritures 2026</div></div>
      <div className="pb">
        <div className="kr">
          <div className="kpi cn"><div className="kl">Total débit</div><div className="kv" style={{fontSize:'.95rem'}}>{fmt(tDeb)}</div></div>
          <div className="kpi cg"><div className="kl">Total crédit</div><div className="kv vg" style={{fontSize:'.95rem'}}>{fmt(tCre)}</div></div>
        </div>
        <button className="btn bn bfl" onClick={exportCSV}>📥 Exporter Grand Livre CSV</button>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div className="glw">
            <div className="gl-row header">
              <span className="gl-date">Date</span><span className="gl-lib">Libellé</span><span className="gl-cpt">Compte</span><span className="gl-deb">Débit</span><span className="gl-cre">Crédit</span>
            </div>
            {entries.map((e,i)=>(
              <div key={i} className="gl-row">
                <span className="gl-date">{fmtD(e.date)}</span>
                <span className="gl-lib">{e.lib}</span>
                <span className="gl-cpt">{e.cpt}</span>
                <span className="gl-deb">{e.deb>0?fmt(e.deb):'—'}</span>
                <span className="gl-cre">{e.cre>0?fmt(e.cre):'—'}</span>
              </div>
            ))}
            <div className="gl-row" style={{background:'var(--bg)',fontWeight:700}}>
              <span className="gl-date" style={{color:'var(--n)'}}>TOTAL</span>
              <span className="gl-lib"/><span className="gl-cpt"/>
              <span className="gl-deb">{fmt(tDeb)}</span>
              <span className="gl-cre">{fmt(tCre)}</span>
            </div>
          </div>
        </div>
        <div className="alert ab2"><span>↔️</span><span>Faites défiler le tableau horizontalement</span></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BILAN
// ═══════════════════════════════════════════════════════════════════════════════
function Bilan({invs,exps,ca,expt,res,toast}){
  const creances=invs.filter(i=>i.status==='pending'||i.status==='late').reduce((s,i)=>s+i.amount*(1+i.tva/100),0);
  const tvaD=exps.reduce((s,e)=>s+e.amount*e.tva/100,0);
  const tvaC=invs.filter(i=>i.status!=='draft').reduce((s,i)=>s+i.amount*i.tva/100,0);
  const tvaDue=Math.max(0,tvaC-tvaD);
  const dettes=exps.reduce((s,e)=>s+e.amount,0);
  const treso=5000;
  const actif=creances+tvaD+treso;
  const passif=res+tvaDue+dettes;
  const exportBilan=()=>{
    const txt=`BILAN SIMPLIFIÉ - Mon EURL
Exercice 2026 - au ${new Date().toLocaleDateString('fr-FR')}

ACTIF
-----
Créances clients (TTC) : ${fmt(creances)}
TVA déductible         : ${fmt(tvaD)}
Trésorerie estimée     : ${fmt(treso)}
TOTAL ACTIF            : ${fmt(actif)}

PASSIF
------
Résultat de l'exercice : ${fmt(res)}
TVA à reverser         : ${fmt(tvaDue)}
Dettes fournisseurs    : ${fmt(dettes)}
TOTAL PASSIF           : ${fmt(passif)}`;
    dl(txt,'bilan-2026.txt');
    toast('Bilan exporté ✓','success');
  };
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Bilan</div><div className="hero-s">Bilan simplifié 2026</div></div>
      <div className="pb">
        <div className="alert ab2"><span>ℹ️</span><span>Bilan basé sur vos données. Pour un bilan officiel, consultez votre expert-comptable.</span></div>
        <div className="card" style={{padding:0}}>
          <div className="bilan-head">ACTIF</div>
          <div className="bilan-row"><span>Créances clients (TTC)</span><span className="mono">{fmt(creances)}</span></div>
          <div className="bilan-row"><span>TVA déductible</span><span className="mono">{fmt(tvaD)}</span></div>
          <div className="bilan-row"><span>Trésorerie estimée</span><span className="mono">{fmt(treso)}</span></div>
          <div className="bilan-row total"><span>TOTAL ACTIF</span><span>{fmt(actif)}</span></div>
        </div>
        <div className="card" style={{padding:0}}>
          <div className="bilan-head">PASSIF</div>
          <div className="bilan-row"><span>Résultat de l'exercice</span><span className="mono" style={{color:res>=0?'var(--gr)':'var(--re)'}}>{fmt(res)}</span></div>
          <div className="bilan-row"><span>TVA à reverser</span><span className="mono" style={{color:'var(--am)'}}>{fmt(tvaDue)}</span></div>
          <div className="bilan-row"><span>Dettes fournisseurs</span><span className="mono">{fmt(dettes)}</span></div>
          <div className="bilan-row total"><span>TOTAL PASSIF</span><span>{fmt(passif)}</span></div>
        </div>
        <button className="btn bn bfl" onClick={exportBilan}>📄 Exporter Bilan</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEC
// ═══════════════════════════════════════════════════════════════════════════════
function FEC({invs,exps,toast,user}){
  const generate=()=>{
    const lines=["JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise"];
    let n=1;
    invs.filter(i=>i.status!=='draft').forEach(i=>{
      const d=i.date.replace(/-/g,'');
      lines.push(`VT|Ventes|${String(n).padStart(6,'0')}|${d}|411000|Clients|${(i.amount*(1+i.tva/100)).toFixed(2)}|0.00|||${d}||`);
      lines.push(`VT|Ventes|${String(n).padStart(6,'0')}|${d}|706000|Prestations|0.00|${i.amount.toFixed(2)}|||${d}||`);
      lines.push(`VT|Ventes|${String(n).padStart(6,'0')}|${d}|445710|TVA collectée|0.00|${(i.amount*i.tva/100).toFixed(2)}|||${d}||`);
      n++;
    });
    exps.forEach(e=>{
      const d=e.date.replace(/-/g,'');
      const ht=e.amount/(1+e.tva/100);
      lines.push(`AC|Achats|${String(n).padStart(6,'0')}|${d}|606000|Charges|${ht.toFixed(2)}|0.00|||${d}||`);
      lines.push(`AC|Achats|${String(n).padStart(6,'0')}|${d}|445660|TVA déductible|${(e.amount*e.tva/100).toFixed(2)}|0.00|||${d}||`);
      lines.push(`AC|Achats|${String(n).padStart(6,'0')}|${d}|401000|Fournisseurs|0.00|${e.amount.toFixed(2)}|||${d}||`);
      n++;
    });
    dl(lines.join('\n'),`FEC_MonEURL_2026.txt`);
    toast('FEC officiel téléchargé ✓','success');
  };
  const totalEcr=invs.filter(i=>i.status!=='draft').length*3+exps.length*3;
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Export FEC</div><div className="hero-s">Fichier des Écritures Comptables · DGFiP</div></div>
      <div className="pb">
        <div className="alert ab2"><span>📋</span><span>Le FEC est obligatoire en cas de contrôle fiscal.</span></div>
        <div className="card cp">
          <div className="ct" style={{marginBottom:10}}>Paramètres FEC</div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>Raison sociale</span><span style={{fontWeight:700,color:'var(--n)'}}>Mon EURL</span></div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>Exercice</span><span style={{fontWeight:700,color:'var(--n)'}}>2026</span></div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>Écritures</span><span style={{fontWeight:700,color:'var(--n)'}}>{totalEcr} lignes</span></div>
          <div className="divrow"><span style={{color:'var(--t2)'}}>Format</span><span className="badge bcat">TXT · DGFiP</span></div>
        </div>
        <div className="card">
          <div className="sh"><div className="st">Journaux inclus</div></div>
          <div>
            <div className="ir" onClick={()=>toast(`${invs.filter(i=>i.status!=='draft').length} factures dans le journal VT`,'info')}>
              <div className="iico ig">📗</div>
              <div className="ii"><div className="it">Journal des Ventes (VT)</div><div className="is">{invs.filter(i=>i.status!=='draft').length} factures · {invs.filter(i=>i.status!=='draft').length*3} écritures</div></div>
            </div>
            <div className="ir" onClick={()=>toast(`${exps.length} dépenses dans le journal AC`,'info')}>
              <div className="iico ir2">📕</div>
              <div className="ii"><div className="it">Journal des Achats (AC)</div><div className="is">{exps.length} dépenses · {exps.length*3} écritures</div></div>
            </div>
          </div>
        </div>
        <button className="btn bc bfl" onClick={generate}>📤 Générer et télécharger le FEC</button>
        <div className="alert aa"><span>⚠️</span><span>Validez votre FEC avec votre expert-comptable avant tout contrôle.</span></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════════
function Clients({clients,setClients,invs,modal,om,cm,toast}){
  const save=f=>{setClients(p=>[...p,{...f,id:Date.now()}]);toast('Client ajouté ✓','success');cm();};
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Clients</div><div className="hero-s">{clients.length} client{clients.length>1?'s':''}</div></div>
      <div className="pb">
        <button className="btn bc bfl" onClick={()=>om('cli',null)}>+ Nouveau client</button>
        <div className="gc">
          {clients.map(c=>{
            const nb=invs.filter(i=>i.client===c.name).length;
            const ca=invs.filter(i=>i.client===c.name&&i.status!=='draft').reduce((s,i)=>s+i.amount,0);
            return(
              <div key={c.id} className="cc" onClick={()=>toast(`${c.name} · ${nb} facture(s) · ${fmt(ca)}`,'info')}>
                <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:7}}>
                  <div className="cav">{c.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="cname">{c.name}</div>
                    <div className="cdet">✉ {c.email}</div>
                  </div>
                  <button className="btn bgr bic" onClick={e=>{e.stopPropagation();setClients(p=>p.filter(x=>x.id!==c.id));toast('Client supprimé','info');}}>🗑</button>
                </div>
                {c.phone&&<div className="cdet">📞 {c.phone}</div>}
                {c.siret&&<div className="csir">SIRET · {c.siret}</div>}
                <div className="cst">
                  <div className="cstt"><strong>{nb}</strong>factures</div>
                  <div className="cstt"><strong>{fmt(ca)}</strong>CA total</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {modal?.type==='cli'&&(
        <div className="moo" onClick={cm}>
          <div className="mo" onClick={e=>e.stopPropagation()}>
            <div className="moh"/>
            <div className="mot">Nouveau client</div>
            <CliForm onSave={save} onClose={cm}/>
          </div>
        </div>
      )}
    </div>
  );
}
function CliForm({onSave,onClose}){
  const [f,sf]=useState({name:"",email:"",phone:"",siret:""});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  return<>
    <div className="fg"><label className="fl">Raison sociale</label><input className="fi" value={f.name} onChange={e=>s('name',e.target.value)} placeholder="Agence Dupont SARL"/></div>
    <div className="fg"><label className="fl">Email</label><input type="email" className="fi" value={f.email} onChange={e=>s('email',e.target.value)} placeholder="contact@client.fr"/></div>
    <div className="fr2">
      <div className="fg"><label className="fl">Téléphone</label><input className="fi" value={f.phone} onChange={e=>s('phone',e.target.value)} placeholder="06 00 00 00"/></div>
      <div className="fg"><label className="fl">SIRET</label><input className="fi" value={f.siret} onChange={e=>s('siret',e.target.value)} placeholder="XXX XXX XXX"/></div>
    </div>
    <div className="mof">
      <button className="btn bc bfl" onClick={()=>onSave(f)}>Ajouter</button>
      <button className="btn bo bfl" onClick={onClose}>Annuler</button>
    </div>
  </>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARAMS
// ═══════════════════════════════════════════════════════════════════════════════
function Params({user,toast}){
  const [company,setCompany]=useState("Mon EURL");
  const [siret,setSiret]=useState("123 456 789 00099");
  const [tva,setTva]=useState("FR12 123456789");
  const [iban,setIban]=useState("FR76 1234 5678 9012 3456 7890 123");
  const [regime,setRegime]=useState("Réel normal");
  const save=()=>toast('Paramètres enregistrés ✓','success');
  return(
    <div className="page">
      <div className="hero"><div className="hero-t">Paramètres</div><div className="hero-s">Informations entreprise</div></div>
      <div className="pb">
        <div className="card cp">
          <div className="ct" style={{marginBottom:10}}>Compte connecté</div>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'4px 0'}}>
            <div className="dw-user-av">{user.name[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,color:'var(--n)'}}>{user.name}</div>
              <div style={{fontSize:'.78rem',color:'var(--t2)'}}>{user.email}</div>
            </div>
          </div>
        </div>
        <div className="card cp">
          <div className="ct" style={{marginBottom:12}}>Identité de l'entreprise</div>
          <div className="fg"><label className="fl">Raison sociale</label><input className="fi" value={company} onChange={e=>setCompany(e.target.value)}/></div>
          <div className="fg"><label className="fl">SIRET</label><input className="fi" value={siret} onChange={e=>setSiret(e.target.value)}/></div>
          <div className="fg"><label className="fl">TVA intracommunautaire</label><input className="fi" value={tva} onChange={e=>setTva(e.target.value)}/></div>
          <div className="fg"><label className="fl">IBAN</label><input className="fi" value={iban} onChange={e=>setIban(e.target.value)}/></div>
          <div className="fg"><label className="fl">Régime fiscal</label>
            <select className="fi" value={regime} onChange={e=>setRegime(e.target.value)}>
              <option>Réel normal</option><option>Réel simplifié</option><option>Micro-entreprise</option>
            </select>
          </div>
        </div>
        <div className="card">
          <div className="sh" style={{paddingBottom:8}}><div className="st">Modules actifs</div></div>
          {[["🧾","Facturation"],["📝","Devis"],["💸","Dépenses & OCR"],["🏦","Rapprochement bancaire"],["📋","TVA CA3"],["📒","Grand Livre"],["⚖️","Bilan"],["📤","Export FEC"],["🔔","Relances"]].map(([ic,lbl])=>(
            <div key={lbl} className="param-row" onClick={()=>toast(`${lbl} : actif`,'success')}>
              <div><div className="param-label">{ic} {lbl}</div></div>
              <span className="badge bp">Actif</span>
            </div>
          ))}
        </div>
        <button className="btn bc bfl" onClick={save}>💾 Enregistrer</button>
      </div>
    </div>
  );
}

// Service d'extraction de données depuis un PDF texte (regex, sans OCR)
const pdfParse = require('pdf-parse');

// Extraire les champs structurés depuis le texte brut d'un PDF
function extraireChamps(texte) {
  const champs = {};

  const chercheDateDansTous = (txt) => {
    // ISO YYYY-MM-DD
    const miso = txt.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (miso) { const [, a, mo, j] = miso; return `${a}-${mo}-${j}`; }
    const m4 = txt.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})\b/);
    if (m4) { const [, j, mo, a] = m4; return `${a}-${mo.padStart(2, '0')}-${j.padStart(2, '0')}`; }
    const m2 = txt.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})\b/);
    if (m2) { const [, j, mo, a] = m2; const fy = parseInt(a) < 50 ? '20' + a : '19' + a; return `${fy}-${mo.padStart(2, '0')}-${j.padStart(2, '0')}`; }
    const moisFR = { janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06', juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12' };
    const mm = txt.match(/\b(\d{1,2})\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+(\d{4})\b/i);
    if (mm) { const [, j, mois, a] = mm; const mo = moisFR[mois.toLowerCase()?.normalize('NFD').replace(/\p{Diacritic}/gu, '') || mois.toLowerCase()] || '01'; return `${a}-${mo}-${j.padStart(2, '0')}`; }
    // English: "Month DD, YYYY" or "Month DD YYYY"
    const moisEN = { january:'01', february:'02', march:'03', april:'04', may:'05', june:'06', july:'07', august:'08', september:'09', october:'10', november:'11', december:'12', jan:'01', feb:'02', mar:'03', apr:'04', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
    const men = txt.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})\b/i);
    if (men) { const [, mois, j, a] = men; const mo = moisEN[mois.toLowerCase()] || '01'; return `${a}-${mo}-${j.padStart(2, '0')}`; }
    return null;
  };

  // Patterns contextuels par ordre de priorité — on vérifie que le résultat est une vraie date
  const patternsDate = [
    /facture[^.:\n]{0,50}du\s+(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/i,
    /(?:date\s+de\s+facture|date\s+d[''](?:é|e)mission|factur[eé]\s+le)\s*[:\s]?\s*([\d\/\.\-]+(?:\s+\w+\s+\d{4})?)/i,
    /(?:émise?\s+le|éditée?\s+le|établie?\s+le)\s*[:\s]?\s*([\d\/\.\-]+)/i,
    /(?:invoice\s+date|date\s+of\s+issue|billing\s+date|issued)\s*[:\s]?\s*([\w\s,\/\-\.]+?\d{4})/i,
  ];
  for (const p of patternsDate) {
    const m = texte.match(p);
    if (m) {
      const d = chercheDateDansTous(m[1]);
      if (d) { champs.date_depense = d; break; }
    }
  }
  if (!champs.date_depense) champs.date_depense = chercheDateDansTous(texte);

  const texteFlat = texte.replace(/\n+/g, ' ').replace(/\s+/g, ' ');

  const patternsM = [
    /(?:total\s+ttc|montant\s+ttc|net\s+[àa]\s+payer|[àa]\s+r[eè]gler|total\s+d[uû]|montant\s+pr[eé]lev[eé]|total\s+pr[eé]lev[eé])\s*[:\s]\s*(\d[\d\s]*[,\.]\d{2})/i,
    /(?:amount\s+due|amount\s+paid|total\s+due|total\s+amount)\s*[:\s]\s*\$?\s*(\d[\d\s]*[,\.]\d{2})/i,
    /(?:total|[àa]\s+payer)\s*[:\s]\s*(\d[\d\s]*[,\.]\d{2})/i,
  ];
  for (const p of patternsM) {
    const m = texteFlat.match(p);
    if (m) { champs.montant_ttc = parseFloat(m[1].replace(/\s/g, '').replace(',', '.')); break; }
  }

  if (!champs.montant_ttc) {
    const montants = [...texteFlat.matchAll(/\$\s*(\d{1,3}(?:[.,]\d{3})*[,.]\d{2})/g)];
    if (montants.length > 0) {
      champs.montant_ttc = Math.max(...montants.map(m => parseFloat(m[1].replace(/,/g, ''))));
    }
  }

  if (!champs.montant_ttc) {
    const montants = [...texteFlat.matchAll(/\b(\d{1,3}(?:[.,]\d{3})*[,.]\d{2})\s*€/gi)];
    if (montants.length > 0) {
      champs.montant_ttc = Math.max(...montants.map(m => parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))));
    }
  }

  if (!champs.montant_ttc) {
    const lignesAmt = texte.split('\n');
    for (let i = 0; i < lignesAmt.length - 1; i++) {
      const curr = lignesAmt[i].trim();
      const next = lignesAmt[i + 1].trim();
      if (/^\d+[,\.]\d{2}$/.test(curr) && next === '€') {
        const val = parseFloat(curr.replace(',', '.'));
        if (!champs.montant_ttc || val > champs.montant_ttc) champs.montant_ttc = val;
      }
    }
  }

  const motsExclus = /^(date|total|tva|ttc|ht\b|facture|ticket|re[çc]u|receipt|invoice|merci|tel\b|t[eé]l\b|siret|siren|adresse|address|page\b|ref\b|num[eé]ro|n[o°]\b|www\.|http|bon\s+de|avoir|devis|votre|notre|vos\b|nos\b|d[eé]tail|synth[eè]se|information|conditions|mobile\b|offre\b|ligne\b|r[eé]capitulatif|relev[eé]|document|confirmation|cher|ch[eè]re|madame|monsieur|bonjour|objet|ci-joint|ci\s+joint|suite\s+[aà]|concernant|veuillez|nous\s+vous|coordonn|espace\s+client|compte\s+client|r[eé]sum[eé]|rappel\b|paiement\b)/i;
  const formeJuridique = /\b(sarl|sas|s\.a\.s|s\.a\.|s\.a\.r\.l|sasu|eurl|sci\b|snc\b)\b/i;

  const lignesRJ = texte.split('\n').map(l => l.trim()).filter(l => l.length >= 2 && l.length <= 60 && formeJuridique.test(l));
  const lignes = texte.split('\n').map(l => l.trim()).filter(l =>
    l.length >= 3 && l.length <= 50 &&
    !/^[\d\s\.,€%\-\/\*:@]+$/.test(l) &&   // ligne purement numérique/symbolique
    !/€/.test(l) &&                          // contient un montant
    !/^\d{4,6}\s/.test(l) &&                 // code postal + ville (ex: "45770 SARAN")
    !/\.$/.test(l) &&                        // phrase se terminant par un point (clause juridique)
    !motsExclus.test(l)
  );

  if (lignesRJ.length > 0) {
    champs.fournisseur = lignesRJ[0].replace(/\s*[-–]\s*(sarl|sas|s\.a\.s|s\.a\.|s\.a\.r\.l|sasu|eurl|sci|snc)\b.*/i, '').trim() || lignesRJ[0];
  } else if (lignes.length > 0) {
    champs.fournisseur = lignes[0];
  }

  // Si le fournisseur ressemble à un nom de client (M., Mme., Mr., etc.) → on l'ignore
  if (champs.fournisseur && /^(M\.?\s|Mme\.?\s|Mr\.?\s|Madame\s|Monsieur\s)/i.test(champs.fournisseur)) {
    champs.fournisseur = null;
  }

  const texteComplet = texte.toLowerCase();
  const ref = ((champs.fournisseur || '') + ' ' + texteComplet);

  // Marques connues : si détectées dans le texte entier, elles priment sur le fournisseur générique
  const marquesConnues = [
    { pattern: /\bsosh\b/,            nom: 'Sosh' },
    { pattern: /\borange\b/,          nom: 'Orange' },
    { pattern: /\bsfr\b/,             nom: 'SFR' },
    { pattern: /\bfree\b/,            nom: 'Free' },
    { pattern: /\bbouygues/,          nom: 'Bouygues Telecom' },
    { pattern: /\bnumericable\b/,     nom: 'Numericable' },
    { pattern: /\bamazon\b/,          nom: 'Amazon' },
    { pattern: /\bfnac\b/,            nom: 'Fnac' },
    { pattern: /\bdarty\b/,           nom: 'Darty' },
    { pattern: /\bboulanger\b/,       nom: 'Boulanger' },
    { pattern: /\bldlc\b/,            nom: 'LDLC' },
    { pattern: /\bsncf\b/,            nom: 'SNCF' },
    { pattern: /\bouigo\b/,           nom: 'Ouigo' },
    { pattern: /\bratp\b/,            nom: 'RATP' },
    { pattern: /\bcofiroute\b/,       nom: 'Cofiroute' },
    { pattern: /\bsanef\b/,           nom: 'Sanef' },
    { pattern: /\baprr\b/,            nom: 'APRR' },
    { pattern: /\bescota\b/,          nom: 'Escota' },
    { pattern: /vinci\s+autoroutes?/, nom: 'VINCI Autoroutes' },
    { pattern: /\bulys\b/,            nom: 'Ulys (VINCI)' },
    { pattern: /\bubер\b|\buber\b/,   nom: 'Uber' },
    { pattern: /\bairbnb\b/,          nom: 'Airbnb' },
    { pattern: /air\s*france\b/,      nom: 'Air France' },
    { pattern: /\beasyjet\b/,         nom: 'EasyJet' },
    { pattern: /\bryanair\b/,         nom: 'Ryanair' },
    { pattern: /\budemy\b/,           nom: 'Udemy' },
    { pattern: /openclassrooms\b/,    nom: 'OpenClassrooms' },
    { pattern: /\bcoursera\b/,        nom: 'Coursera' },
    { pattern: /\badobe\b/,           nom: 'Adobe' },
    { pattern: /microsoft\s*365\b/,   nom: 'Microsoft 365' },
    { pattern: /google\s+workspace\b/,nom: 'Google Workspace' },
    { pattern: /\bgithub\b/,          nom: 'GitHub' },
    { pattern: /\bnotion\b/,          nom: 'Notion' },
    { pattern: /\bslack\b/,           nom: 'Slack' },
    { pattern: /\bopenai\b/,          nom: 'OpenAI' },
    { pattern: /\bmistral\b/,         nom: 'Mistral AI' },
    { pattern: /\banthropic\b/,       nom: 'Anthropic' },
  ];

  for (const marque of marquesConnues) {
    if (marque.pattern.test(texteComplet)) {
      champs.fournisseur = marque.nom;
      break;
    }
  }

  if (/\bsosh\b|orange\b|sfr\b|free\b|bouygues|numericable|t[eé]l[eé]com|forfait|fibre|adsl/.test(ref)) {
    champs.categorie = 'Télécom';
  } else if (/sncf|tgv|ouigo|inoui|ratp|transilien|m[eé]tro\b|bus\b|taxi\b|uber\b|bolt\b|blablacar|avion\b|air\s*france|easyjet|ryanair|transavia|p[eé]age|autoroute/.test(ref)) {
    champs.categorie = 'Déplacement';
  } else if (/restaurant|brasserie|caf[eé]\b|pizzeria|mcdonald|burger\b|subway\b|sushi|traiteur|d[eé]jeuner|d[iî]ner/.test(ref)) {
    champs.categorie = 'Restaurant';
  } else if (/h[oô]tel|airbnb|booking\.com|expedia|h[eé]bergement|nuit[eé]e/.test(ref)) {
    champs.categorie = 'Hébergement';
  } else if (/amazon|fnac|darty|boulanger|ldlc|ordinateur|laptop|[eé]cran\b|clavier\b|souris\b|disque\b|imprimante/.test(ref)) {
    champs.categorie = 'Matériel';
  } else if (/udemy|openclassrooms|coursera|formation\b|certification\b/.test(ref)) {
    champs.categorie = 'Formation';
  } else if (/abonnement|mensuel|annuel|licence|adobe|microsoft\s*365|google\s+workspace|notion\b|slack\b|github\b/.test(ref)) {
    champs.categorie = 'Abonnement';
  }

  return champs;
}

// Extraire les champs directement depuis un Buffer PDF
async function extraireDepuisPDF(buffer) {
  const data = await pdfParse(buffer);
  return extraireChamps(data.text || '');
}

module.exports = { extraireChamps, extraireDepuisPDF };

// Service d'extraction de données depuis un PDF texte (regex, sans OCR)
const pdfParse = require('pdf-parse');

// Extraire les champs structurés depuis le texte brut d'un PDF
function extraireChamps(texte) {
  const champs = {};

  const chercheDateDansTous = (txt) => {
    const m4 = txt.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})\b/);
    if (m4) { const [, j, mo, a] = m4; return `${a}-${mo.padStart(2, '0')}-${j.padStart(2, '0')}`; }
    const m2 = txt.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})\b/);
    if (m2) { const [, j, mo, a] = m2; const fy = parseInt(a) < 50 ? '20' + a : '19' + a; return `${fy}-${mo.padStart(2, '0')}-${j.padStart(2, '0')}`; }
    const moisFR = { janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06', juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12' };
    const mm = txt.match(/\b(\d{1,2})\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+(\d{4})\b/i);
    if (mm) { const [, j, mois, a] = mm; const mo = moisFR[mois.toLowerCase()?.normalize('NFD').replace(/\p{Diacritic}/gu, '') || mois.toLowerCase()] || '01'; return `${a}-${mo}-${j.padStart(2, '0')}`; }
    return null;
  };

  const ctxDate = texte.match(/(?:date\s+de\s+facture|date\s+d[''](?:é|e)mission|factur[eé]\s+le|le\s*:)\s*[:\s]?\s*([\d\/\.\-]+(?:\s+\w+\s+\d{4})?)/i);
  if (ctxDate) champs.date_depense = chercheDateDansTous(ctxDate[1]);
  if (!champs.date_depense) champs.date_depense = chercheDateDansTous(texte);

  const texteFlat = texte.replace(/\n+/g, ' ').replace(/\s+/g, ' ');

  const patternsM = [
    /(?:total\s+ttc|montant\s+ttc|net\s+[àa]\s+payer|[àa]\s+r[eè]gler|total\s+d[uû]|montant\s+pr[eé]lev[eé]|total\s+pr[eé]lev[eé])\s*[:\s]\s*(\d[\d\s]*[,\.]\d{2})/i,
    /(?:total|[àa]\s+payer)\s*[:\s]\s*(\d[\d\s]*[,\.]\d{2})/i,
  ];
  for (const p of patternsM) {
    const m = texteFlat.match(p);
    if (m) { champs.montant_ttc = parseFloat(m[1].replace(/\s/g, '').replace(',', '.')); break; }
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

  const motsExclus = /^(date|total|tva|ttc|ht\b|facture|ticket|re[çc]u|receipt|invoice|merci|tel\b|t[eé]l\b|siret|siren|adresse|address|page\b|ref\b|num[eé]ro|n[o°]\b|www\.|http|bon\s+de|avoir|devis|votre|notre|d[eé]tail|synth[eè]se|information|conditions|mobile\b|offre\b|ligne\b|r[eé]capitulatif|relev[eé]|document|confirmation|cher|ch[eè]re|madame|monsieur|bonjour|objet|ci-joint|ci\s+joint|suite\s+[aà]|concernant|veuillez|nous\s+vous)/i;
  const formeJuridique = /\b(sarl|sas|s\.a\.s|s\.a\.|s\.a\.r\.l|sasu|eurl|sci\b|snc\b)\b/i;

  const lignesRJ = texte.split('\n').map(l => l.trim()).filter(l => l.length >= 2 && l.length <= 60 && formeJuridique.test(l));
  const lignes = texte.split('\n').map(l => l.trim()).filter(l =>
    l.length >= 3 && l.length <= 50 && !/^[\d\s\.,€%\-\/\*:@]+$/.test(l) && !/€/.test(l) && !motsExclus.test(l)
  );

  if (lignesRJ.length > 0) {
    champs.fournisseur = lignesRJ[0].replace(/\s*[-–]\s*(sarl|sas|s\.a\.s|s\.a\.|s\.a\.r\.l|sasu|eurl|sci|snc)\b.*/i, '').trim() || lignesRJ[0];
  } else if (lignes.length > 0) {
    champs.fournisseur = lignes[0];
  }

  const ref = ((champs.fournisseur || '') + ' ' + texte).toLowerCase();
  if (/sosh|orange\b|sfr\b|free\s|bouygues|numericable|t[eé]l[eé]com|forfait|mobile\b|fibre|adsl/.test(ref)) {
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

// Générateur de dataset synthétique pour modèle de prévision de consommation.
// Reproductible (seed fixe). Sortie : consommation_dataset.csv
const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20240823);
const noise = (pct) => 1 + (rnd() * 2 - 1) * pct;

// Profils régionaux (Tunisie-like)
const regions = [
  { region: 'Nord',     baseComp: 4200, baseConso: 1850, tRef: 17.5, pluie: 620, hddRef: 480, cddRef: 230, trend: 0.030, warm:  0.012 },
  { region: 'Sahel',    baseComp: 3100, baseConso: 1720, tRef: 19.0, pluie: 330, hddRef: 320, cddRef: 340, trend: 0.026, warm:  0.014 },
  { region: 'CapBon',   baseComp: 1800, baseConso: 1680, tRef: 18.5, pluie: 450, hddRef: 360, cddRef: 300, trend: 0.022, warm:  0.013 },
  { region: 'Sud',      baseComp: 1400, baseConso: 2100, tRef: 23.5, pluie:  90, hddRef:  90, cddRef: 780, trend: 0.034, warm:  0.020 }
];

const startYear = 2005, endYear = 2025;
const rows = [];
const header = [
  'annee', 'region', 'nbCompteurs', 'tempMoyenne', 'pluviometrie',
  'degresJoursChauffage', 'degresJoursClimatisation',
  'indiceActivite', 'consommationPrecedente', 'consommationTotale'
];

for (const r of regions) {
  let prevConso = null;
  let comp = r.baseComp;
  for (let y = startYear; y <= endYear; y++) {
    const k = y - startYear;
    // parc de compteurs en croissance
    comp = Math.round(comp * (1 + r.trend + (rnd() * 2 - 1) * 0.01)) + Math.round(r.baseComp * 0.02);
    // réchauffement climatique progressif
    const tMoy = +(r.tRef + r.warm * k + (rnd() * 2 - 1) * 0.8).toFixed(1);
    const pluie = Math.round(r.pluie * noise(0.18));
    // degrés-jours : décalés par rapport à seuils 18°C
    const hdd = Math.max(0, Math.round((r.hddRef - (tMoy - r.tRef)) * noise(0.15)));
    const cdd = Math.max(0, Math.round((r.cddRef + (tMoy - r.tRef) * 2.2) * noise(0.15)));
    const activite = +(1 + 0.015 * k + (rnd() * 2 - 1) * 0.02).toFixed(3);
    // modèle cible : dépend du parc, de l'activité, et du stress thermique
    const thermique = 1 + 0.0016 * (hdd - r.hddRef) + 0.0011 * (cdd - r.cddRef);
    const conso = Math.round(
      comp * r.baseConso * activite * thermique * noise(0.05) * (1 + r.trend * 0.4) ** k
    );
    rows.push([
      y, r.region, comp, tMoy, pluie, hdd, cdd, activite,
      prevConso === null ? '' : prevConso, conso
    ]);
    prevConso = conso;
  }
}

const csv = [header.join(',')].concat(rows.map(r => r.join(','))).join('\n');
const out = path.join(__dirname, 'consommation_dataset.csv');
fs.writeFileSync(out, csv, 'utf8');
console.log('Lignes générées :', rows.length, '->', out);

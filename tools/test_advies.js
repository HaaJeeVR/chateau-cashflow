// Controle adviesvragen: elke vraag heeft op zijn niveau minstens één goed antwoord (op stand 'normaal').
// Draaien: node tools/test_advies.js   (met --md schrijft hij 06_ADVIESVRAGEN.md voor review)
const path = require('path'), fs = require('fs');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('sim.js');
const S = CC.SIM; let fails = 0; const rows = [];
const eur = n => '€' + (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ','));
const wantTxt = w => Object.entries(w).map(([k, v]) => k === 'top' ? 'het beste' : `${k.replace('_', ' ')}: ${Array.isArray(v) ? v.join('/') : v}`).join(' · ');
for (const q of CC.TEXT.advice) {
  const wines = CC.WINES.filter(w => CC.roleById(w.role).unlock <= q.lvl);
  const good = [], traps = [];
  for (const w of wines) {
    const r = S.adviceCheck(q, w, CC.priceFor(w, 'normaal'), wines);
    if (r.ok) good.push(w.name);
    else if (q.val && r.miss.length === 1 && (r.miss[0] === 'niet_druif' || (r.miss[0] === 'soort' && q.want.regio))) traps.push(w.name);   // valt op één ding af: valkuil
  }
  // Klantentaal: geen wenswoord letterlijk in de vraag (besluit 49)
  const words = Object.entries(q.want).filter(([k]) => k !== 'top' && k !== 'bij')   // gerechten staan niet op het kaartje, die mogen wel.flatMap(([, v]) => [].concat(v)).map(v => String(v).toLowerCase());
  const literal = words.filter(wd => q.q.toLowerCase().includes(wd));
  if (literal.length) { fails++; console.log(`  FOUT  ${q.id}: wenswoord letterlijk in de vraag: ${literal.join(', ')}`); }
  const ok = good.length > 0;
  if (!ok) fails++;
  console.log((ok ? '  OK  ' : '  FOUT') + `  ${q.id} (niv ${q.lvl}) goed: ${good.join(', ') || '-'}${traps.length ? '  | valkuil: ' + traps.join(', ') : ''}`);
  rows.push({ q, good, traps });
}
console.log(fails ? `\n${fails} fout(en): zonder goed antwoord of met een letterlijk wenswoord.` : '\nAlle vragen oplosbaar.');
if (process.argv.includes('--md')) {
  // Commentaar na de controle van 2026-09-27; twijfelgevallen q05/q17 opgelost met HJ.
  const TWIJFEL = {
    q02: 'Claude: koude witte bij de barbecue telt nu ook goed (Sauvignon).',
    q05: 'Opgelost: onder €6 past alleen Merlot (Sauvignon en rosé €6,50, Rioja €8).',
    q06: 'Claude: herschreven ("koud uit de koelkast, geen prik") zodat een lichte rode of Crémant niet meer voor de hand ligt.',
    q07: 'Claude: Pinot Noir (Gevrey) is ook zacht, maar ver boven budget. Prima zo.',
    q12: 'Claude: Sauvignon bij oesters telt nu ook goed (denk aan Sancerre).',
    q14: 'Claude: Sauvignon bij kip met citroen telt nu ook goed.',
    q17: 'Opgelost: vraag scherper ("iets geurigs, een tikje zoet"), zodat Sauvignon of rosé niet meer voor de hand ligt.',
    q24: 'Claude: Port bij oude Gouda is een klassieker, maar de klant vraagt niets roods; wit blijft goed.',
    q26: 'Claude: Rioja en Barolo tellen nu ook goed bij côte de boeuf (was fout gerekend).',
    q31: 'Claude: herschreven ("de druif van de grote kastelen in de Médoc"); "beroemdste blauwe druif" was voor discussie vatbaar.',
    q32: 'Claude: Pinot Noir (Gevrey) bij truffel telt nu ook goed.',
  };
  let md = `# Château Cashflow — Adviesvragen (concept voor review)\n\n> Bron: \`src/texts.js\` → \`CC.TEXT.advice\`. Dit bestand is gegenereerd met \`node tools/test_advies.js --md\`; commentaar mag hier, wijzigingen verwerkt Claude in texts.js.\n> **Klantentaal:** het wenswoord staat nooit letterlijk in de vraag; gerechten staan niet op het kaartje (besluit 49).\n> **Goed antwoord** = voldoet aan alle wensen én schapprijs (stand Normaal) ≤ maximum. Gecontroleerd met de wijnen die op dat niveau vrijgespeeld zijn.\n> Na elk antwoord verschijnt het **weetje**; trapt iemand in een valkuil, dan eerst de **uitleg**.\n> **Elk verdedigbaar antwoord telt goed** (besluit 66). Nagelopen op 2026-09-27: zie de kolom commentaar.\n\n`;
  let lvl = 0;
  const sorted = rows.slice().sort((a, b) => a.q.lvl - b.q.lvl || a.q.id.localeCompare(b.q.id));   // per niveau, zoals je ze tegenkomt
  for (const { q, good, traps } of sorted) {
    if (q.lvl !== lvl) { lvl = q.lvl; md += `\n## Niveau ${lvl}\n\n| # | Vraag | Wens · max | Goed | Weetje | Jouw commentaar |\n|---|---|---|---|---|---|\n`; }
    const val = q.val ? `<br>**Valkuil${traps.length ? ' (' + traps.join(', ') + ')' : ''}:** ${q.val}` : '';
    md += `| ${q.id.slice(1)} | ${q.q} | ${wantTxt(q.want)} · max ${eur(q.max)} | ${good.join(', ')} | ${q.weetje}${val} | ${TWIJFEL[q.id] || ''} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, '..', '06_ADVIESVRAGEN.md'), md);
  console.log('06_ADVIESVRAGEN.md geschreven.');
}
process.exit(fails ? 1 : 0);

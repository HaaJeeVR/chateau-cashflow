// Acceptatietests M5 — personeel (03_BOUWPLAN §4). Draaien: node tools/test_m5.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK    ' : '  FOUT  ') + msg); if (!cond) fails++; };

function shop(seed, level, stockPer) {
  const s = CC.newState(seed); s.cash = 9000; s.level = level; s.rep = C.levelRep[level - 1]; s.day = 2;
  const ids = S.unlockedWines(s).map(w => w.id);
  S.activeVakIds(s).forEach((v, i) => { if (ids[i]) { S.buy(s, ids[i], stockPer || 12); S.assignVak(s, v, ids[i]); } });
  return s;
}
function playDay(s) { const d = DAY.start(s); DAY.finish(d, s); return { d, sum: S.endDay(s, d.log) }; }

console.log('M5-1: aannemen, maximum, vrijspelen');
{
  const s = shop(1, 1);
  ok(!S.hire(s, 'sem').ok, 'Sem nog niet op niveau 1');
  s.level = CC.STAFF.dubois.minLevel;
  ok(S.hire(s, 'sem').ok && S.hire(s, 'fatima').ok, 'Sem en Fatima aangenomen zodra ze vrij zijn');
  const r = S.hire(s, 'dubois');
  ok(!r.ok && r.reason === 'full', `derde medewerker geweigerd (max ${C.staffMax})`);
  ok(S.fire(s, 'sem') && S.hire(s, 'dubois').ok, 'na ontslag van Sem past Dubois wel');
}

const SIM_EMPTY = () => S.newDayLog();
console.log('M5-2: loon en XP');
{
  const s = shop(2, CC.STAFF.fatima.minLevel); S.hire(s, 'fatima');
  const cash0 = s.cash; const { sum } = playDay(s);
  ok(sum.wages === CC.STAFF.fatima.wage, `loon op de bon: ${CC.R.euro(sum.wages)}`);
  ok(Math.abs(s.cash - (cash0 + sum.revenue + sum.tips - sum.rent - sum.wages)) < 0.01, 'loon gaat van de kas af');
  // XP uit eigen werk (besluit 72): alleen wat Fatima echt terughaalt telt
  const ups = []; let earned = s.staff.fatima.xp, saved = 0;
  for (let i = 0; i < 20; i++) { S.refill(s); const r = playDay(s).sum; ups.push(...r.staffUp); earned += (r.work.fatima || {}).xp || 0; saved += (r.work.fatima || {}).saved || 0; }
  ok(Math.abs(s.staff.fatima.xp - earned) < 0.01 && Math.abs(earned - (sum.work.fatima.xp + saved * C.staffXpPer.fatimaSave)) < 0.01, `XP = teruggehaalde klanten × ${C.staffXpPer.fatimaSave} (${saved} in 20 dagen, XP ${s.staff.fatima.xp})`);
  ok(ups.every((u, i) => u.to === (i ? ups[i - 1].to + 1 : 2) || u.to > (i ? ups[i - 1].to : 1)), `level-ups op volgorde: ${ups.map(u => u.to).join(',') || 'geen'}`);
  const idle = CC.newState(3); idle.level = CC.STAFF.fatima.minLevel; S.hire(idle, 'fatima');
  ok(S.staffWork(idle, SIM_EMPTY()).fatima.xp === 0, 'geen werk = geen XP');
}

console.log('M5-3: Sem vult overdag bij');
{
  let withSem = 0, without = 0, refilled = 0;
  for (let seed = 1; seed <= 20; seed++) {
    for (const sem of [false, true]) {
      const s = shop(seed, 3, 24);          // 12 op het schap, 12 in het magazijn
      if (sem) S.hire(s, 'sem');
      const { d } = playDay(s);
      if (sem) { withSem += d.log.bottles; refilled += d.log.semRefill || 0; } else without += d.log.bottles;
    }
  }
  ok(refilled > 0, `Sem vulde ${refilled} flessen bij`);
  ok(withSem > without, `flessen verkocht: zonder ${without}, met Sem ${withSem}`);
}

console.log('M5-4: Fatima geeft een tweede kans');
{
  let w = 0, wo = 0, saves = 0;
  for (let seed = 1; seed <= 20; seed++) for (const fa of [false, true]) {
    const s = shop(seed, CC.STAFF.fatima.minLevel); if (fa) S.hire(s, 'fatima');
    const { d } = playDay(s);
    if (fa) { w += d.log.buyers; saves += d.log.fatima || 0; } else wo += d.log.buyers;
  }
  ok(saves > 0 && w > wo, `kopers: zonder ${wo}, met Fatima ${w} (${saves} tweede kansen)`);
}

console.log('M5-5: Dubois beantwoordt liggengebleven vragen');
{
  let asked = 0, dub = 0, good = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const s = shop(seed, CC.STAFF.dubois.minLevel); S.hire(s, 'dubois');
    const { d } = playDay(s);
    asked += d.log.advice.asked; dub += d.log.advice.dubois || 0; good += d.log.advice.good + d.log.advice.honest;
  }
  ok(dub / asked > 0.45 && dub / asked < 0.75, `${dub} van ${asked} vragen door Dubois beantwoord (level 1: ${C.duboisSkill[0] * 100}%)`);
  ok(good === dub, `Dubois geeft alleen goede antwoorden (${good}/${dub}); weet hij het niet, dan kiest de klant zelf`);
}

console.log(fails ? `\n${fails} test(s) fout.` : '\nAlles groen.');
process.exit(fails ? 1 : 0);

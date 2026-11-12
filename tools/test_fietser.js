// Tests fietser (besluit 98): af en toe, nooit op een stoep met voetgangers, puur beeld. Draaien: node tools/test_fietser.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js'); src('fx.js');
const FX = CC.FX;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }
const img = { complete: true, naturalWidth: 50, naturalHeight: 64 };
const IMAGES = Object.fromEntries(Object.keys(FX.BIKE_SRC).map(k => ['fiets_' + k, img]));
function reset() { FX.passers = []; FX.bike = null; FX.joke = null; FX.critter = null; FX.nextBike = 0; FX.nextPasser = 0; }

// Een lange middag op straat; per stap kijken wat er gebeurt.
function run(secs, phase, images, s) {
  reset();
  const dt = 1 / 30, rides = []; let cur = null, clash = 0, terrasL = 0, maxV = 0;
  for (let t = 0; t < secs; t += dt) {
    FX.street(dt, phase, images, s);
    const b = FX.bike;
    if (b && !cur) { cur = { lane: b.lane, start: t, bell: false }; rides.push(cur); }
    if (b) {
      if (FX.passers.some(p => p.lane === b.lane)) clash++;
      if (b.lane === 'R' && FX.joke) clash++;
      if (b.bubble) cur.bell = true;
    }
    if (!b && cur) { cur.end = t; cur = null; }
    if (b && b.lane === 'L' && s && CC.SIM.activeFurniture(s).some(f => f.id === 'decor_terras')) terrasL++;
  }
  return { rides, clash, terrasL };
}

console.log('FI-1: zonder beelden geen fietser');
{
  const r = run(600, 'sale', {}, CC.newState(1));
  check('600 s verkoop zonder fietserbeelden: niemand', r.rides.length === 0, r.rides.length);
}

console.log('FI-2: af en toe, tijdens voorbereiden en verkoop');
for (const phase of ['prep', 'sale']) {
  const s = CC.newState(1); s.level = 4;
  const r = run(1800, phase, IMAGES, s);
  const gaps = r.rides.slice(1).map((x, i) => x.start - r.rides[i].end);
  check(`${phase}: ze komt langs`, r.rides.length >= 20, r.rides.length + ' keer in 30 min');
  check(`${phase}: hooguit eens per 30–60 s`, gaps.every(g => g >= 30 - 1e-6), 'kortste pauze ' + Math.min(...gaps).toFixed(1) + ' s');
  check(`${phase}: beide stoepen`, r.rides.some(x => x.lane === 'R') && r.rides.some(x => x.lane === 'L'));
  check(`${phase}: nooit samen met voetgangers op één stoep`, r.clash === 0, r.clash + ' stappen');
  check(`${phase}: soms een belletje, niet altijd`, r.rides.some(x => x.bell) && r.rides.some(x => !x.bell));
}
{
  const r = run(600, 'result', IMAGES, CC.newState(1));
  check('buiten voorbereiden/verkoop: geen fietser', r.rides.length === 0);
}

console.log('FI-3: terras (niveau 6+) → alleen rechts');
{
  const s = CC.newState(1); s.level = 6;
  const r = run(1800, 'sale', IMAGES, s);
  check('nooit links als het terras er staat', r.terrasL === 0 && r.rides.every(x => x.lane === 'R'), r.rides.length + ' ritten');
}

console.log('FI-4: puur beeld');
{
  const s = CC.newState(1); s.level = 4; const before = JSON.stringify(s);
  run(300, 'sale', IMAGES, s);
  check('spelstand onveranderd', JSON.stringify(s) === before);
  check('tekst voor het belletje bestaat', CC.TEXT.street.bell === 'Tring!');
}

console.log(fails ? `\n${fails} fout(en).` : '\nAlles groen.');
process.exit(fails ? 1 : 0);

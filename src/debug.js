// Château Cashflow — debug.js  (F1)
(function (root) {
  const CC = root.CC = root.CC || {};
  const P = CC.PAL;
  const DBG = { on: false, log: false, fps: 0, _acc: 0, _n: 0 };

  DBG.tick = function (dt) {
    DBG._acc += dt; DBG._n++;
    if (DBG._acc >= 0.5) { DBG.fps = Math.round(DBG._n / DBG._acc); DBG._acc = 0; DBG._n = 0; }
  };

  DBG.draw = function (app, ctx) {
    const UI = CC.UI, R = CC.R, F = CC.FONT;
    if (DBG.log && app.phase === 'sale' && app.day) {
      const rows = app.day.decisions.slice(-7);
      const h = rows.length * 10 + 6;
      R.rect(ctx, 4, 330 - h, 420, h, 'rgba(31,10,14,0.85)');
      rows.forEach((r, i) => {
        const d = r.dec;
        const what = d.action === 'buy' ? `KOOPT ${d.qty}× ${CC.wineById(d.wineId).name}` : `weg: ${d.reason}`;
        F.draw(ctx, `#${r.id} ${r.type} €${r.budget} → ${what}`, 8, 330 - h + 3 + i * 10, d.action === 'buy' ? P.green4 : P.bord4);
      });
    }
    if (!DBG.on) return;
    const x = 4, y = 20, w = 160;
    const items = [
      ['+€500', () => { app.s.cash += 500; }],
      ['-€500', () => { app.s.cash -= 500; }],
      ['Einde dag', () => { if (app.phase === 'sale') app.skipDay(); else if (app.phase === 'prep') { app.openShop(); app.skipDay(); } }],
      ['Naar zondag', () => { app.s.day = CC.CONFIG.daysPerWeek - 1; if (app.phase === 'prep') { app.openShop(); app.skipDay(); } }],
      ['Klantlog ' + (DBG.log ? 'uit' : 'aan'), () => { DBG.log = !DBG.log; }],
      ['+50 reputatie', () => { app.s.rep += 50; }],
      ['Level +1 (test)', () => { app.s.level = Math.min(8, app.s.level + 1); app.rebuildRoom(); }],
      ['Naar week 8', () => { app.s.week = 8; }],
      ['Wis save + herstart', () => { CC.clearSave(); location.reload(); }],
    ];
    const h = 34 + items.length * 18;
    R.rect(ctx, x, y, w, h, P.ink);
    R.rect(ctx, x + 1, y + 1, w - 2, h - 2, '#101a16');
    F.draw(ctx, 'DEBUG', x + 6, y + 5, P.gold);
    F.draw(ctx, `${DBG.fps} fps · seed ${app.s ? app.s.seed : '-'}`, x + 6, y + 16, P.stone2);
    items.forEach(([label, fn], i) => UI.btn(app, ctx, 'dbg_' + i, x + 6, y + 30 + i * 18, w - 12, 16, label, fn, { tone: 'wood' }));
  };

  CC.DBG = DBG;
})(typeof window !== 'undefined' ? window : globalThis);

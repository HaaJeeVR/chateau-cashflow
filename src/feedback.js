// Château Cashflow — feedback.js
// Klein feedbackknopje net naast het spelscherm. Verstuurt via Web3Forms naar HJ's mail.
// Instellen: vraag gratis een access key aan op https://web3forms.com (je mailadres invullen,
// de key komt per mail) en zet hem hieronder. De key mag openbaar in de code staan.
(function () {
  const WEB3FORMS_KEY = '41161544-959e-4cde-ab95-b60ef2a79c52';   // <-- plak hier je Web3Forms access key

  const CC = window.CC || {};
  const canvas = document.getElementById('game');

  // ---------- Stijl ----------
  const css = `
  #fb-btn { position: fixed; z-index: 5; display: flex; align-items: center; gap: 7px;
    font: bold 13px Georgia, 'Times New Roman', serif; color: #fdf6e3; letter-spacing: .3px;
    padding: 6px 13px 6px 10px; background: #6e1a26; border: 2px solid #1f0a0e; border-radius: 8px;
    outline: 1px solid rgba(232,181,58,.55); outline-offset: -5px;
    box-shadow: 0 2px 0 #3e0f16; cursor: pointer; opacity: .88; transition: opacity .15s, transform .1s, filter .15s; }
  #fb-btn:hover { opacity: 1; filter: brightness(1.15); }
  #fb-btn:active { transform: translateY(2px); box-shadow: 0 0 0 #3e0f16; }
  #fb-btn svg { width: 14px; height: 14px; image-rendering: pixelated; flex: none; }
  #fb-btn.tight { padding: 5px 8px; opacity: .6; }
  #fb-btn.tight span { display: none; }
  #fb-btn.tight:hover { opacity: 1; }

  #fb-box { position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
    background: rgba(31,10,14,.7); z-index: 11; }
  #fb-box .card { width: min(440px, 92vw); box-sizing: border-box; background: #f3e6c8; border: 3px solid #5a3a22;
    outline: 2px solid #e8b53a; outline-offset: -7px; border-radius: 12px; padding: 18px 20px 16px;
    box-shadow: 0 6px 0 rgba(31,10,14,.45); font: 14px/1.4 Georgia, 'Times New Roman', serif; color: #1f0a0e; }
  #fb-box h2 { margin: 0 0 2px; font-size: 18px; color: #7a1f2b; }
  #fb-box .sub { margin: 0 0 12px; color: #5a4a3a; font-size: 13px; }
  #fb-box textarea { width: 100%; box-sizing: border-box; border: 2px solid #8a6a44; border-radius: 6px;
    background: #fdf6e3; padding: 8px; font: 14px/1.35 Georgia, serif; color: #1f0a0e; }
  #fb-box textarea { height: 120px; resize: none; }
  #fb-box textarea:focus { outline: none; border-color: #7a1f2b; }
  #fb-box ::placeholder { color: #a3927a; }
  #fb-box .hp { position: absolute; left: -9999px; }
  #fb-box .row { display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-top: 12px; }
  #fb-box .msg { flex: 1; font-size: 13px; color: #5a4a3a; }
  #fb-box .msg.err { color: #b3261e; }
  #fb-box button.act { font: bold 14px Georgia, serif; padding: 6px 16px; border-radius: 8px; border: 2px solid #1f0a0e;
    cursor: pointer; color: #fdf6e3; background: #7a1f2b; box-shadow: 0 2px 0 #3e0f16; }
  #fb-box button.act.close { background: #8a6a44; box-shadow: 0 2px 0 #4a3420; }
  #fb-box button.act:hover { filter: brightness(1.15); }
  #fb-box button.act:disabled { opacity: .45; cursor: default; filter: none; }
  #fb-box .thanks { text-align: center; padding: 18px 0 8px; }
  #fb-box .thanks b { display: block; font-size: 18px; color: #7a1f2b; margin-bottom: 4px; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // Pixel-tekstballonnetje (8×8 raster)
  const bubble = '<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path fill="#e8b53a" d="M1 1h6v1H1zM0 2h1v3H0zM7 2h1v3H7zM1 5h3v1H1zM5 5h2v1H5zM2 6h2v1H2z"/>' +
    '<path fill="#fdf6e3" d="M1 2h6v3H1zM4 5h1v1H4z"/></svg>';

  // ---------- DOM ----------
  const btn = document.createElement('button');
  btn.id = 'fb-btn'; btn.type = 'button'; btn.title = 'Geef feedback op het spel';
  btn.innerHTML = bubble + '<span>Feedback</span>';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'fb-box';
  box.innerHTML = `<div class="card" role="dialog" aria-label="Feedback">
    <div class="form">
      <h2>Feedback</h2>
      <p class="sub">Een bug, een idee, iets wat onduidelijk was: alles is welkom.</p>
      <textarea maxlength="3000" placeholder="Typ hier je opmerking…"></textarea>
      <input type="checkbox" class="hp" tabindex="-1" autocomplete="off">
      <div class="row"><span class="msg"></span>
        <button type="button" class="act close">Sluiten</button><button type="button" class="act send" disabled>Versturen</button></div>
    </div>
    <div class="thanks" style="display:none"><b>Dank je wel!</b>Je feedback is binnen.</div>
  </div>`;
  document.body.appendChild(box);

  const $ = s => box.querySelector(s);
  const form = $('.form'), thanks = $('.thanks'), ta = $('textarea'),
    hp = $('.hp'), msg = $('.msg'), send = $('.send');
  let busy = false, closeTimer = null;

  // Toetsen in het venster niet naar het spel laten lekken (spatie, cijfers, S, P, …)
  box.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
  });
  box.addEventListener('mousedown', e => { if (e.target === box) close(); });

  function refresh() { send.disabled = busy || !ta.value.trim(); }
  ta.addEventListener('input', refresh);

  function open() {
    clearTimeout(closeTimer);
    form.style.display = ''; thanks.style.display = 'none';
    msg.textContent = ''; msg.classList.remove('err');
    box.style.display = 'flex';
    if (window.app) window.app.feedbackOpen = true;
    refresh();
    setTimeout(() => ta.focus(), 0);
  }
  function close() {
    clearTimeout(closeTimer);
    box.style.display = 'none';
    if (window.app) window.app.feedbackOpen = false;
    if (document.activeElement) document.activeElement.blur();
  }
  btn.addEventListener('click', () => { btn.blur(); open(); });
  $('.close').onclick = close;
  send.onclick = submit;

  // Context bij de mail: waar in het spel zat de speler?
  function context() {
    const a = window.app || {}, s = a.s;
    const out = { Versie: CC.VERSION || '?', Fase: a.phase || '?' };
    if (s) {
      const dn = (CC.CONFIG && CC.CONFIG.dayNamesLong) || [];
      out.Voortgang = 'week ' + s.week + ', ' + (dn[s.day] || 'dag ' + s.day) + ', niveau ' + s.level;
      out.Kas = '€ ' + Math.round(s.cash);
      out.Status = s.status;
    }
    out.Scherm = window.innerWidth + '×' + window.innerHeight + ' (dpr ' + (window.devicePixelRatio || 1) + ')';
    out.Browser = navigator.userAgent;
    out.Pagina = location.href;
    return out;
  }

  async function submit() {
    if (busy || send.disabled) return;
    const text = ta.value.trim();
    if (!WEB3FORMS_KEY) {
      msg.textContent = 'Feedback staat nog niet aan (geen access key).'; msg.classList.add('err'); return;
    }
    busy = true; refresh(); msg.classList.remove('err'); msg.textContent = 'Versturen…';
    const payload = Object.assign({
      access_key: WEB3FORMS_KEY,
      subject: 'Château Cashflow feedback',
      from_name: 'Château Cashflow',
      botcheck: hp.checked,
      Bericht: text,
    }, context());
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.success === false) throw new Error(j.message || res.status);
      ta.value = '';
      form.style.display = 'none'; thanks.style.display = '';
      closeTimer = setTimeout(close, 1800);
    } catch (e) {
      msg.textContent = 'Versturen lukte niet. Probeer het zo nog eens.'; msg.classList.add('err');
    } finally { busy = false; refresh(); }
  }

  // ---------- Plaats: net buiten het spelscherm ----------
  // Onder het scherm als daar ruimte is, anders ernaast, anders klein in de hoek over het scherm heen.
  function place() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight, gap = 8;
    btn.classList.remove('tight');
    btn.style.left = btn.style.top = btn.style.right = btn.style.bottom = '';
    const bw = btn.offsetWidth, bh = btn.offsetHeight;
    if (vh - r.bottom >= bh + gap * 2) {             // onder, rechts uitgelijnd
      btn.style.left = Math.round(r.right - bw) + 'px';
      btn.style.top = Math.round(r.bottom + gap) + 'px';
    } else if (vw - r.right >= bw + gap * 2) {       // rechts, onderaan uitgelijnd
      btn.style.left = Math.round(r.right + gap) + 'px';
      btn.style.top = Math.round(r.bottom - bh) + 'px';
    } else {                                         // geen ruimte: compact in de hoek
      btn.classList.add('tight');
      btn.style.right = gap + 'px';
      btn.style.bottom = gap + 'px';
    }
  }
  window.addEventListener('resize', () => requestAnimationFrame(place));
  if (window.ResizeObserver && canvas) new ResizeObserver(() => place()).observe(canvas);
  place();
})();

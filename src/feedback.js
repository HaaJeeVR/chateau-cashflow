// Château Cashflow — feedback.js
// Feedback geven vanuit het spel. Verstuurt via Web3Forms naar HJ's mail.
// Instellen: vraag gratis een access key aan op https://web3forms.com (je mailadres invullen,
// de key komt per mail) en zet hem hieronder. De key mag openbaar in de code staan.
// Besluit 92: geen HTML meer in beeld. De knop staat in de canvas (titelscherm linksboven, HUD rechts, ui.js)
// en het venster is UI.textDialog; hier staan alleen het openen en het versturen.
(function () {
  const WEB3FORMS_KEY = '41161544-959e-4cde-ab95-b60ef2a79c52';   // <-- plak hier je Web3Forms access key
  const MAX = 3000;

  const CC = window.CC || (window.CC = {});
  CC.feedbackInCanvas = true;
  let draft = '';   // wat je typte blijft staan als je het venster sluit zonder te versturen

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

  async function submit(value) {
    const app = window.app, d = app && app.dialog; if (!d) return;
    const text = String(value || '').trim();
    if (!text) return;
    if (!WEB3FORMS_KEY) { d.msg = 'Feedback staat nog niet aan (geen access key).'; d.err = true; return; }
    d.busy = true; d.err = false; d.msg = 'Versturen...';
    const payload = Object.assign({
      access_key: WEB3FORMS_KEY,
      subject: 'Château Cashflow feedback',
      from_name: 'Château Cashflow',
      botcheck: false,
      Bericht: text,
    }, context());
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.success === false) throw new Error(j.message || res.status);
      draft = ''; app.textInput.value = '';
      d.busy = false; d.done = true; d.msg = '';
      setTimeout(() => { if (app.dialog === d) app.closeDialog(); }, 1800);
    } catch (e) {
      d.busy = false; d.msg = 'Versturen lukte niet. Probeer het zo nog eens.'; d.err = true;
    }
  }

  CC.openFeedback = function () {
    const app = window.app; if (!app || !app.openDialog) return;
    app.feedbackOpen = true;
    app.openDialog({
      kind: 'feedback', title: 'Feedback', info: 'Een bug, een idee, iets wat onduidelijk was: alles is welkom.',
      placeholder: 'Typ hier je opmerking...', value: draft, max: MAX, count: true,
      actionLabel: 'Versturen ▶', busyLabel: 'Versturen...', action: submit,
      doneTitle: 'Dank je wel!', doneText: 'Je feedback is binnen.',
      onClose: () => { if (app.textInput && !app.textInput.readOnly) draft = app.textInput.value; },
    });
  };
})();

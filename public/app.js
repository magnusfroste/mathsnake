/* Mathsnake – en orm, tre äpplen och en fråga.
   Symboler i stället för text: siffror, äpplen och en orm. */
(() => {
  'use strict';

  const DUK = document.getElementById('duk');
  const CTX = DUK.getContext('2d');
  const SCEN = document.getElementById('scen');
  const FRAGA_EL = document.querySelector('[data-fraga]');
  const MAT_EL = document.querySelector('[data-mat-tal]');
  const TID_EL = document.querySelector('[data-tid]');
  const TID_FYLL = document.querySelector('[data-tid-fyll]');
  const SLUT = document.querySelector('[data-slut]');
  const SLUT_TAL = document.querySelector('[data-slut-tal]');
  const IGEN = document.querySelector('[data-igen]');
  const LJUD_KNAPP = document.querySelector('[data-ljud]');

  const OMGANG_MS = 60000;

  // skolappar.org:s räknare (kotten.js i index.html) – bara anonyma antal, appen fungerar utan den
  const rapport = (namn, värde) => window.skolappar?.event(namn, värde);
  // svårighetssteget i nyFråga(): 1 (+ inom 10) … 4 (blandat, större)
  const nivå = (n) => (n < 3 ? 1 : n < 7 ? 2 : n < 12 ? 3 : 4);
  const START_LANGD = 4;

  const S = {
    orm: [], riktning: { x: 1, y: 0 }, kö: [],
    äpplen: [], fråga: null,
    uppätna: 0, tidKvar: OMGANG_MS,
    kör: false, slut: false,
    cell: 40, cols: 16, rows: 11, ox: 0, oy: 0,
    tickMs: 210, ack: 0, ljud: true, svansBort: 0, skak: 0,
    spak: null, hint: 0, mål: null, fel: 0,
  };

  /* ── plan ─────────────────────────────────────────────── */
  function mätPlan() {
    const w = SCEN.clientWidth, h = SCEN.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    DUK.width = Math.round(w * dpr);
    DUK.height = Math.round(h * dpr);
    DUK.style.width = w + 'px';
    DUK.style.height = h + 'px';
    CTX.setTransform(dpr, 0, 0, dpr, 0, 0);

    S.rows = 11;
    S.cols = Math.max(9, Math.min(19, Math.round(S.rows * (w / h))));
    S.cell = Math.min(w / S.cols, h / S.rows, 78);
    S.ox = (w - S.cell * S.cols) / 2;
    S.oy = (h - S.cell * S.rows) / 2;
  }

  const px = (c) => S.ox + c * S.cell;
  const py = (r) => S.oy + r * S.cell;

  /* ── frågor ───────────────────────────────────────────── */
  const tal = (n) => Math.floor(Math.random() * n);

  function nyFråga() {
    const n = S.uppätna;
    let a, b, op, svar;
    if (n < 3) {                       // + inom 10
      a = 1 + tal(6); b = 1 + tal(10 - a); op = '+'; svar = a + b;
    } else if (n < 7) {                // + inom 20
      a = 2 + tal(10); b = 1 + tal(20 - a); op = '+'; svar = a + b;
    } else if (n < 12) {               // blandat + och − inom 20
      if (Math.random() < 0.5) {
        a = 2 + tal(9); b = 1 + tal(a); op = '−'; svar = a - b;
      } else {
        a = 3 + tal(9); b = 1 + tal(20 - a); op = '+'; svar = a + b;
      }
    } else {                           // blandat, lite större
      const plus = Math.random() < 0.55;
      if (plus) { a = 4 + tal(14); b = 2 + tal(21 - a); svar = a + b; op = '+'; }
      else { a = 6 + tal(16); b = 2 + tal(a - 1); svar = a - b; op = '−'; }
    }
    S.fråga = { a, b, op, svar };
    FRAGA_EL.textContent = a + ' ' + op + ' ' + b;
    FRAGA_EL.setAttribute('aria-label', a + (op === '+' ? ' plus ' : ' minus ') + b);
  }

  function grannTal(svar) {
    const kandidater = [];
    for (let d = 1; d <= 6; d++) {
      for (const t of [svar - d, svar + d]) {
        if (t >= 0 && t <= 24 && !kandidater.includes(t)) kandidater.push(t);
      }
    }
    kandidater.sort(() => Math.random() - 0.5);
    return kandidater;
  }

  function upptagen(c, r) {
    if (S.orm.some((s) => s.x === c && s.y === r)) return true;
    if (S.äpplen.some((a) => a.x === c && a.y === r)) return true;
    return false;
  }

  function näraHuvud(c, r, avst = 3) {
    const h = S.orm[S.orm.length - 1];
    return Math.abs(h.x - c) + Math.abs(h.y - r) < avst;
  }

  function ledigRuta(avst = 3) {
    for (let försök = 0; försök < 400; försök++) {
      const c = 1 + tal(S.cols - 2), r = 1 + tal(S.rows - 2);
      if (!upptagen(c, r) && !näraHuvud(c, r, avst)) return { x: c, y: r };
    }
    for (let försök = 0; försök < 400; försök++) {
      const c = 1 + tal(S.cols - 2), r = 1 + tal(S.rows - 2);
      if (!upptagen(c, r)) return { x: c, y: r };
    }
    return { x: 1, y: 1 };
  }

  function nyÄpplen() {
    S.mål = null;
    const svar = S.fråga.svar;
    const fel = grannTal(svar).slice(0, 2);
    const talen = [svar, ...fel].sort(() => Math.random() - 0.5);
    S.äpplen = talen.map((t) => ({ ...ledigRuta(), tal: t, ny: true }));
  }

  /* ── spel ─────────────────────────────────────────────── */
  function starta() {
    mätPlan();
    S.orm = [];
    const startR = Math.floor(S.rows / 2);
    const startC = Math.max(START_LANGD, Math.floor(S.cols * 0.45));
    for (let i = START_LANGD - 1; i >= 0; i--) S.orm.push({ x: startC - i, y: startR });
    S.riktning = { x: 1, y: 0 }; S.kö = [];
    S.uppätna = 0; S.fel = 0; MAT_EL.textContent = '0';
    S.tidKvar = OMGANG_MS; S.kör = true; S.slut = false; S.ack = 0; S.tickMs = 210;
    S.spak = null; S.hint = performance.now() + 4200; S.mål = null;
    S.svansBort = 0; S.skak = 0;
    SLUT.hidden = true; SLUT.setAttribute('aria-hidden', 'true');
    nyFråga(); nyÄpplen();
    rapport('round_start'); rapport('level', 1);
    TID_EL.style.opacity = '1';
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {});
    rita();
  }

  function sväng(dx, dy) {
    if (!S.kör || S.slut) return;
    const riktning = S.kö.length ? S.kö[S.kö.length - 1] : S.riktning;
    if (riktning.x === -dx && riktning.y === -dy) return;
    if (riktning.x === dx && riktning.y === dy) return;
    if (S.kö.length < 2) S.kö.push({ x: dx, y: dy });
  }

  // närmaste vägen till en ruta – används när barnet pekar på ett äpple
  function nästaSteg(mål) {
    const nyckel = (x, y) => y * S.cols + x;
    const hinder = new Set(S.orm.slice(0, -1).map((s) => nyckel(s.x, s.y)));
    const h = S.orm[S.orm.length - 1];
    const kö = [[h.x, h.y, null]];
    const sedd = new Set([nyckel(h.x, h.y)]);
    const riktningar = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < kö.length; i++) {
      const [x, y, första] = kö[i];
      if (x === mål.x && y === mål.y) return första;
      for (const [dx, dy] of riktningar) {
        const nx = x + dx, ny = y + dy, k = nyckel(nx, ny);
        if (nx < 0 || ny < 0 || nx >= S.cols || ny >= S.rows) continue;
        if (sedd.has(k) || hinder.has(k)) continue;
        sedd.add(k);
        kö.push([nx, ny, första || [dx, dy]]);
      }
    }
    return null;
  }

  function tick() {
    if (!S.kör || S.slut) return;
    // pekat mål: styrsättet för den som hellre pekar än håller i en spak
    if (S.mål && !håller) {
      const d = nästaSteg(S.mål);
      const r = S.kö.length ? S.kö[S.kö.length - 1] : S.riktning;
      if (!d) S.mål = null;
      else if (!(r.x === -d[0] && r.y === -d[1]) && !(r.x === d[0] && r.y === d[1])) {
        if (S.kö.length < 2) S.kö.push({ x: d[0], y: d[1] });
      }
    }
    if (S.kö.length) S.riktning = S.kö.shift();
    const h = S.orm[S.orm.length - 1];
    const n = { x: h.x + S.riktning.x, y: h.y + S.riktning.y };

    // vägg: ormen stannar, inget straff förutom tiden
    if (n.x < 0 || n.y < 0 || n.x >= S.cols || n.y >= S.rows) { S.skak = 1; return; }
    // sig själv: stanna
    if (S.orm.some((s, i) => i < S.orm.length - 1 && s.x === n.x && s.y === n.y)) { S.skak = 1; return; }

    S.orm.push(n);
    const äpple = S.äpplen.find((a) => a.x === n.x && a.y === n.y);
    let växte = false;
    if (äpple && äpple.tal === S.fråga.svar) {
      växte = true;
      S.uppätna++;
      MAT_EL.textContent = S.uppätna;
      S.tickMs = Math.max(135, 210 - S.uppätna * 4);
      if (nivå(S.uppätna) !== nivå(S.uppätna - 1)) rapport('level', nivå(S.uppätna));
      nyFråga(); nyÄpplen();
      ton('rätt');
    } else if (äpple) {
      // fel svar: äpplet byts mot ett annat fel svar, ormen krymper två led
      S.äpplen = S.äpplen.filter((a) => a !== äpple);
      const använda = S.äpplen.map((a) => a.tal);
      const nytt = grannTal(S.fråga.svar).find((t) => !använda.includes(t));
      if (nytt !== undefined) S.äpplen.push({ ...ledigRuta(), tal: nytt, ny: true });
      S.skak = 1;
      S.fel++; rapport('hint');
      ton('fel');
    }
    if (!växte) {
      S.orm.shift();
      if (äpple && äpple.tal !== S.fråga.svar) {
        for (let i = 0; i < 2 && S.orm.length > 3; i++) S.orm.shift();
      }
    }
  }

  function avsluta() {
    S.kör = false; S.slut = true; S.spak = null;
    SLUT_TAL.textContent = S.uppätna;
    SLUT.hidden = false; SLUT.setAttribute('aria-hidden', 'false');
    TID_EL.style.opacity = '0';
    const försök = S.uppätna + S.fel;
    rapport('round_done', försök ? Math.round((S.uppätna / försök) * 100) : 0);
    ton('slut');
  }

  /* ── ljud ─────────────────────────────────────────────── */
  let AC = null;
  function ton(sort) {
    if (!S.ljud) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const nu = AC.currentTime;
      const spel = (frekvens, start, längd, typ, styrka) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = typ; o.frequency.setValueAtTime(frekvens, nu + start);
        g.gain.setValueAtTime(0, nu + start);
        g.gain.linearRampToValueAtTime(styrka, nu + start + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, nu + start + längd);
        o.connect(g).connect(AC.destination);
        o.start(nu + start); o.stop(nu + start + längd + 0.02);
      };
      if (sort === 'rätt') { spel(660, 0, 0.1, 'sine', 0.09); spel(990, 0.07, 0.12, 'sine', 0.07); }
      if (sort === 'fel') { spel(180, 0, 0.16, 'triangle', 0.08); }
      if (sort === 'slut') { spel(523, 0, 0.14, 'sine', 0.08); spel(392, 0.13, 0.2, 'sine', 0.07); }
    } catch (e) { /* ljud är trevligt, inte nödvändigt */ }
  }

  /* ── rita ─────────────────────────────────────────────── */
  function rita() {
    const w = SCEN.clientWidth, h = SCEN.clientHeight, s = S.cell;
    CTX.clearRect(0, 0, w, h);

    // mycket diskreta punkter så barnet ser rutnätet
    CTX.fillStyle = 'rgba(20,24,31,.055)';
    const prick = Math.max(1, s * 0.042);
    for (let c = 0; c < S.cols; c++) {
      for (let r = 0; r < S.rows; r++) {
        CTX.beginPath();
        CTX.arc(px(c) + s / 2, py(r) + s / 2, prick, 0, Math.PI * 2);
        CTX.fill();
      }
    }

    // första sekunderna: visa var tummen kan sättas, utan ord
    if (S.hint && performance.now() < S.hint) {
      const andas = 0.5 + 0.5 * Math.sin(performance.now() / 320);
      const x = S.ox + s * S.cols / 2;
      const y = S.oy + s * (S.rows - 1.6);
      const R = Math.max(34, Math.min(s * 0.95, 58));
      CTX.save();
      CTX.globalAlpha = 0.20 + 0.28 * andas;
      CTX.beginPath(); CTX.arc(x, y, R, 0, Math.PI * 2);
      CTX.lineWidth = Math.max(2, R * 0.07);
      CTX.strokeStyle = '#2f7d4f';
      CTX.stroke();
      CTX.beginPath(); CTX.arc(x, y, R * 0.44, 0, Math.PI * 2);
      CTX.fillStyle = '#2f7d4f';
      CTX.fill();
      CTX.restore();
    }

    // äpplen
    for (const a of S.äpplen) {
      const x = px(a.x) + s / 2, y = py(a.y) + s / 2, r = s * 0.40;
      CTX.save();
      CTX.translate(x, y);
      if (a.ny) { CTX.scale(1, 1); }
      CTX.fillStyle = '#d4453f';
      CTX.beginPath();
      CTX.arc(-r * 0.18, 0, r * 0.92, 0, Math.PI * 2);
      CTX.arc(r * 0.18, 0, r * 0.92, 0, Math.PI * 2);
      CTX.fill();
      CTX.strokeStyle = '#7d3b2a';
      CTX.lineWidth = Math.max(1.6, s * 0.045);
      CTX.lineCap = 'round';
      CTX.beginPath();
      CTX.moveTo(0, -r * 0.72);
      CTX.quadraticCurveTo(r * 0.14, -r * 1.06, r * 0.30, -r * 1.14);
      CTX.stroke();
      CTX.fillStyle = '#fff';
      const stl = Math.round(s * 0.42);
      CTX.font = '600 ' + stl + 'px Fredoka, Nunito, system-ui, sans-serif';
      CTX.textAlign = 'center'; CTX.textBaseline = 'middle';
      CTX.fillText(String(a.tal), 0, s * 0.012);
      CTX.restore();
    }

    // målet barnet pekat på: en tunn ring runt rutan
    if (S.mål) {
      CTX.save();
      CTX.strokeStyle = 'rgba(47,125,79,.45)';
      CTX.lineWidth = Math.max(1.5, s * 0.045);
      CTX.setLineDash([s * 0.16, s * 0.14]);
      CTX.beginPath();
      CTX.arc(px(S.mål.x) + s / 2, py(S.mål.y) + s / 2, s * 0.46, 0, Math.PI * 2);
      CTX.stroke();
      CTX.restore();
    }

    // orm
    const skak = S.skak ? (Math.random() - 0.5) * s * 0.10 : 0;
    S.orm.forEach((seg, i) => {
      const huvud = i === S.orm.length - 1;
      const x = px(seg.x) + s / 2 + (huvud ? skak : 0), y = py(seg.y) + s / 2;
      const radie = huvud ? s * 0.47 : s * 0.43;
      CTX.fillStyle = huvud ? '#1f5a38' : '#2f7d4f';
      CTX.beginPath();
      CTX.arc(x, y, radie, 0, Math.PI * 2);
      CTX.fill();
      if (huvud) {
        const öga = Math.max(2.2, s * 0.085), avst = s * 0.17;
        const dx = S.riktning.x * avst, dy = S.riktning.y * avst;
        const sido = { x: -S.riktning.y * avst * 0.85, y: S.riktning.x * avst * 0.85 };
        for (const tecken of [-1, 1]) {
          const ex = x + dx + sido.x * tecken, ey = y + dy + sido.y * tecken;
          CTX.fillStyle = '#faf7f2';
          CTX.beginPath(); CTX.arc(ex, ey, öga, 0, Math.PI * 2); CTX.fill();
          CTX.fillStyle = '#14181f';
          CTX.beginPath();
          CTX.arc(ex + S.riktning.x * öga * 0.35, ey + S.riktning.y * öga * 0.35, öga * 0.5, 0, Math.PI * 2);
          CTX.fill();
        }
      }
    });
if (S.skak > 0) S.skak = 0;

    // spaken: ring där tummen sattes, kula som följer tummen
    if (S.spak) {
      const R = Math.max(34, Math.min(s * 0.95, 58));
      const { x, y } = S.spak;
      CTX.save();
      CTX.beginPath();
      CTX.arc(x, y, R, 0, Math.PI * 2);
      CTX.fillStyle = 'rgba(20,24,31,.07)';
      CTX.fill();
      CTX.lineWidth = Math.max(1.5, R * 0.05);
      CTX.strokeStyle = 'rgba(20,24,31,.16)';
      CTX.stroke();
      CTX.beginPath();
      CTX.arc(x + S.spak.kx, y + S.spak.ky, R * 0.44, 0, Math.PI * 2);
      CTX.fillStyle = 'rgba(47,125,79,.85)';
      CTX.fill();
      CTX.restore();
    }
  }

  /* ── tid ──────────────────────────────────────────────── */
  let sista = 0, sistaRita = 0;
  function steg(t) {
    if (!sista) sista = t;
    const dt = Math.min(t - sista, 120);
    sista = t;
    if (S.kör && !S.slut) {
      S.tidKvar -= dt;
      S.ack += dt;
      while (S.ack >= S.tickMs) { S.ack -= S.tickMs; tick(); }
      const förhållande = Math.max(0, S.tidKvar / OMGANG_MS);
      TID_FYLL.style.transform = 'scaleX(' + förhållande + ')';
      TID_FYLL.style.background = förhållande < 0.16 ? '#d4453f' : 'var(--gron)';
      if (S.tidKvar <= 0) avsluta();
    }
    rita();
  }
  function loop(t) {
    sistaRita = performance.now();
    steg(t);
    requestAnimationFrame(loop);
  }
  // vakthund: om fliken inte får animationsrutor (inbäddad vy, strömsparläge)
  // ska spelet ändå gå framåt i lagom takt
  setInterval(() => {
    if (document.hidden) return;
    if (performance.now() - sistaRita > 320) steg(performance.now());
  }, 100);

  /* ── inmatning: tumstyrning (Roblox-principen) ────────── */
  // Tummen sätts var som helst på planen. Spaken dyker upp under tummen och
  // ormen går åt det håll tummen pekar. Släpper man fortsätter ormen åt samma
  // håll – en orm stannar inte. Ett svep fungerar likadant: spaken är svepet.
  const DÖDZON = 14;
  let håller = null;    // { id, x0, y0 }
  let spakAxel = null;  // 'x' eller 'y' – hålls kvar tills den andra vinner klart

  function spakRiktning(dx, dy) {
    const avst = Math.hypot(dx, dy);
    if (avst < DÖDZON) return null;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    // hysteres: byt bara axel när den andra är tydligt större, annars fladdrar
    // riktningen när tummen går diagonalt
    if (spakAxel === 'x' && ay > ax * 1.25) spakAxel = 'y';
    else if (spakAxel === 'y' && ax > ay * 1.25) spakAxel = 'x';
    else if (!spakAxel) spakAxel = ax > ay ? 'x' : 'y';
    return spakAxel === 'x' ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
  }

  DUK.addEventListener('pointerdown', (e) => {
    if (!S.kör || S.slut) return;
    e.preventDefault();
    håller = { id: e.pointerId, x0: e.clientX, y0: e.clientY, tid: performance.now(), rört: false };
    spakAxel = null;
    S.mål = null;
    if (DUK.setPointerCapture) { try { DUK.setPointerCapture(e.pointerId); } catch (err) {} }
    const r = DUK.getBoundingClientRect();
    S.spak = { x: e.clientX - r.left, y: e.clientY - r.top, kx: 0, ky: 0 };
    S.hint = 0;
  });

  DUK.addEventListener('pointermove', (e) => {
    if (!håller || e.pointerId !== håller.id) return;
    e.preventDefault();
    const dx = e.clientX - håller.x0, dy = e.clientY - håller.y0;
    const avst = Math.hypot(dx, dy);
    if (avst > DÖDZON * 1.6) håller.rört = true;
    if (S.spak) {
      const m = Math.min(avst, 44);
      S.spak.kx = avst ? (dx / avst) * m : 0;
      S.spak.ky = avst ? (dy / avst) * m : 0;
    }
    const d = spakRiktning(dx, dy);
    if (d) sväng(d[0], d[1]);
  });

  function släppSpak(e) {
    if (!håller || (e && e.pointerId !== undefined && e.pointerId !== håller.id)) return;
    const kortTryck = !håller.rört && performance.now() - håller.tid < 280;
    håller = null;
    spakAxel = null;
    S.spak = null;
    // kort tryck = peka på en ruta, ormen hittar vägen själv
    if (kortTryck && e && S.kör && !S.slut) {
      const r = DUK.getBoundingClientRect();
      const i = e.clientX - r.left, j = e.clientY - r.top;
      const c = Math.floor((i - S.ox) / S.cell), rad = Math.floor((j - S.oy) / S.cell);
      if (c >= 0 && rad >= 0 && c < S.cols && rad < S.rows) {
        const äpple = S.äpplen.find((a) => a.x === c && a.y === rad);
        if (äpple) S.mål = { x: äpple.x, y: äpple.y };
      }
    }
  }
  DUK.addEventListener('pointerup', släppSpak);
  DUK.addEventListener('pointercancel', släppSpak);
  DUK.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    const karta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const riktning = karta[e.key];
    if (riktning) { e.preventDefault(); sväng(riktning[0], riktning[1]); }
    if (e.key === ' ' || e.key === 'Enter') { if (S.slut) starta(); }
  });

  LJUD_KNAPP.addEventListener('click', () => {
    S.ljud = !S.ljud;
    LJUD_KNAPP.setAttribute('aria-pressed', String(S.ljud));
    if (!S.ljud) rapport('sound_off');
  });

  IGEN.addEventListener('click', starta);

  window.addEventListener('resize', () => { mätPlan(); });
  document.addEventListener('visibilitychange', () => { sista = 0; });

  /* ── start ────────────────────────────────────────────── */
  document.addEventListener('startskarm:spela', () => { if (!S.kör) starta(); });
  if (!document.getElementById('startskarm')) setTimeout(() => { if (!S.kör) starta(); }, 60);

  // testkrok: gör mekaniken mätbar utan att spela
  window.__snake = {
    S, tick, sväng, starta, avsluta,
    nyFråga, nyÄpplen,
    fråga: () => ({ ...S.fråga }),
    sättFråga: (a, b, op) => { S.fråga = { a, b, op, svar: op === '+' ? a + b : a - b }; FRAGA_EL.textContent = a + ' ' + op + ' ' + b; },
    äpplen: () => S.äpplen.map((a) => ({ ...a })),
    sättÄpplen: (lista) => { S.äpplen = lista.map((a) => ({ ...a })); },
    placeraOrm: (lista, riktning) => { S.orm = lista.map((s) => ({ ...s })); if (riktning) S.riktning = riktning; },
    längd: () => S.orm.length,
  };
})();
/* Pier Counsel — homepage only: point-cloud bridge, rotating word,
   scroll-lit statement, pinned practice cards, "What makes us different" scenes. */
(() => {
  'use strict';
  const { $, $$, clamp, ease, reduce, DPR, inView } = window.PC;

  /* ---------- Rotating word ---------- */
  const rotor = $('#rotor');
  const words = ['founders', 'investors', 'funds', 'corporates', 'businesses'];
  let wi = words.length - 1;
  if (rotor && !reduce && rotor.animate) {
    setTimeout(() => setInterval(() => {
      if (document.hidden) return;
      wi = (wi + 1) % words.length;
      const out = rotor.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-70%)', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      out.onfinish = () => {
        rotor.textContent = words[wi];
        rotor.animate([{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'forwards' });
      };
    }, 2600), 1800);
  }

  /* ---------- Hero: point-cloud suspension bridge ---------- */
  const hero = $('.hero');
  const cv = $('#scene'), g = cv.getContext('2d');
  let W = 0, H = 0, ox = 0, oy = 0, F = 0, heroOn = false, t0 = null;
  let mx = 0, my = 0, smx = 0, smy = 0;
  const TW = 0.82, SP = 1.8, TOP = 0.95, SAG = 0.07, ZW = 0.14, BASE = -0.36;
  const aMain = (TOP - SAG) / (TW * TW);
  const cableY = x => {
    const ax = Math.abs(x);
    if (ax <= TW) return SAG + aMain * x * x;
    const v = clamp((SP - ax) / (SP - TW));
    return 0.03 + (TOP - 0.03) * v * v;
  };
  const small = matchMedia('(max-width: 700px)').matches;
  const k = small ? 1.6 : 1; // sparser cloud on phones
  const pts = [];
  const add = (x, y, z, kind) => {
    const r = 2.4 + Math.random() * 3, th = Math.random() * Math.PI * 2, ph = (Math.random() - 0.5) * Math.PI;
    pts.push(x, y, z, Math.cos(th) * Math.cos(ph) * r, Math.sin(ph) * r * 0.7, Math.sin(th) * Math.cos(ph) * r, Math.random(), kind);
  };
  for (let x = -SP; x <= SP; x += 0.007 * k) for (const z of [-ZW, ZW]) add(x, cableY(x), z, 0);
  for (let x = -SP + 0.03; x < SP; x += 0.05 * k) {
    if (Math.abs(Math.abs(x) - TW) < 0.03) continue;
    const top = cableY(x);
    for (let y = 0.03; y < top; y += 0.028 * k) for (const z of [-ZW, ZW]) add(x, y, z, 1);
  }
  for (let x = -2.3; x <= 2.3; x += 0.014 * k) for (const [y, z] of [[0, -ZW], [0, ZW], [-0.035, -ZW], [-0.035, ZW]]) add(x, y, z, 1);
  for (let x = -2.3; x <= 2.3; x += 0.1 * k) for (let z = -ZW; z <= ZW + 0.001; z += 0.028) add(x, -0.035, z, 1);
  for (const tx of [-TW, TW]) {
    for (const z of [-ZW, ZW]) for (const dx of [-0.018, 0.018]) for (let y = BASE; y <= TOP + 0.05; y += 0.013 * k) add(tx + dx, y, z, 0);
    for (const by of [TOP + 0.04, 0.62, 0.3, -0.07]) for (let z = -ZW; z <= ZW + 0.001; z += 0.012 * k) { add(tx - 0.018, by, z, 0); add(tx + 0.018, by, z, 0); }
  }
  const water = [];
  for (let x = -2.6; x <= 2.6; x += 0.09 * k) for (let z = -1.6; z <= 1.6; z += 0.09 * k) water.push(x, z);

  const BK = 7;
  const COL = [[232, 241, 251], [166, 204, 240]];
  function sizeScene() {
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const wide = W >= 900;
    ox = wide ? W * 0.66 : W * 0.5;
    oy = wide ? H * 0.42 : H * 0.3;
    F = wide ? Math.min(W * 0.5, H * 1.0) : W * 0.78;
  }
  function render(t) {
    const intro = reduce ? 9 : t;
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    const sp = clamp(scrollY / (hero.offsetHeight || 1));
    const yaw = -0.6 + Math.sin(t * 0.09) * 0.1 + smx * 0.22;
    const pitch = 0.2 + smy * 0.07 + sp * 0.35;
    const D = 3.2 - sp * 0.7;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), spn = Math.sin(pitch);
    g.clearRect(0, 0, W, H);

    const wa = clamp((intro - 0.3) / 1.5);
    if (wa > 0) {
      const wp = Array.from({ length: BK }, () => new Path2D());
      for (let i = 0; i < water.length; i += 2) {
        const x = water[i], z = water[i + 1];
        const y = BASE - 0.015 + Math.sin(x * 2.6 + t * 0.7) * Math.cos(z * 2.2 - t * 0.5) * 0.022;
        const X = x * cyw - z * syw, Z1 = x * syw + z * cyw;
        const Y = y * cp - Z1 * spn, Zc = y * spn + Z1 * cp;
        const d = Zc + D; if (d < 0.4) continue;
        const s = F / d, px = ox + X * s, py = oy - Y * s;
        if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
        const a = clamp(0.2 + (4.6 - d) / 3);
        wp[Math.min(BK - 1, (a * BK) | 0)].rect(px - 0.7, py - 0.7, 1.4, 1.4);
      }
      for (let b = 0; b < BK; b++) { g.fillStyle = `rgba(150,184,218,${((b + 1) / BK) * 0.4 * wa})`; g.fill(wp[b]); }
    }

    const paths = Array.from({ length: BK * 2 }, () => new Path2D());
    const animating = intro < 3.2;
    for (let i = 0; i < pts.length; i += 8) {
      let x = pts[i], y = pts[i + 1], z = pts[i + 2], kk = 1;
      if (animating) {
        kk = ease(clamp((intro - pts[i + 6] * 1.2) / 1.6));
        x = pts[i + 3] + (x - pts[i + 3]) * kk;
        y = pts[i + 4] + (y - pts[i + 4]) * kk;
        z = pts[i + 5] + (z - pts[i + 5]) * kk;
      }
      const X = x * cyw - z * syw, Z1 = x * syw + z * cyw;
      const Y = y * cp - Z1 * spn, Zc = y * spn + Z1 * cp;
      const d = Zc + D; if (d < 0.35) continue;
      const s = F / d, px = ox + X * s, py = oy - Y * s;
      if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
      const a = clamp(0.25 + (4.4 - d) / 2.6) * (0.3 + 0.7 * kk);
      const sz = Math.max(0.8, (small ? 2.9 : 2.4) / d);
      paths[pts[i + 7] * BK + Math.min(BK - 1, (a * BK) | 0)].rect(px - sz / 2, py - sz / 2, sz, sz);
    }
    for (let kind = 0; kind < 2; kind++) {
      const c = COL[kind];
      for (let b = 0; b < BK; b++) {
        g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${((b + 1) / BK) * (kind ? 0.8 : 0.95)})`;
        g.fill(paths[kind * BK + b]);
      }
    }
  }
  function loop(now) {
    if (!inView(hero)) { heroOn = false; return; }
    if (t0 === null) t0 = now;
    render((now - t0) / 1000);
    requestAnimationFrame(loop);
  }
  function startHero() {
    if (reduce || heroOn || !inView(hero)) return;
    heroOn = true;
    requestAnimationFrame(loop);
  }
  addEventListener('pointermove', e => {
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- Scroll-lit statement ---------- */
  const scrubSec = $('.statement'), scrubEl = $('#scrub');
  function splitWords(node) {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1) splitWords(ch);
    });
  }
  let scrubWords = [];
  if (!reduce) {
    splitWords(scrubEl);
    scrubWords = $$('.w', scrubEl);
    scrubSec.classList.add('is-scrub');
  }
  function scrub() {
    if (!scrubWords.length) return;
    const r = scrubSec.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp((-r.top + innerHeight * 0.15) / (total * 0.75));
    const n = Math.round(p * scrubWords.length);
    scrubWords.forEach((w, i) => w.classList.toggle('on', i < n));
  }

  /* ---------- Practices: pinned horizontal scroll ---------- */
  const prac = $('.practices'), track = $('#track'), pbar = $('#pbar');
  const mqPin = matchMedia('(min-width: 900px) and (min-height: 620px)');
  let pinOn = false, pinDist = 0;
  function layoutPin() {
    pinOn = mqPin.matches && !reduce;
    prac.classList.toggle('is-pinned', pinOn);
    if (!pinOn) { prac.style.height = ''; track.style.transform = ''; return; }
    pinDist = Math.max(1, track.offsetWidth - innerWidth);
    prac.style.height = (pinDist + innerHeight) + 'px';
  }
  function pin() {
    if (!pinOn) return;
    const p = clamp(-prac.getBoundingClientRect().top / pinDist);
    track.style.transform = `translate3d(${(-p * pinDist).toFixed(1)}px,0,0)`;
    pbar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  /* ---------- What makes us different ---------- */
  const dc = $('#dcanvas'), dx = dc.getContext('2d');
  const diffSec = $('.diff'), rows = $$('.drow'), dcap = $('#dcap'), dtag = $('#dtag');
  const CAPS = [
    ['Business-first', 'Legal strategy that works in step with your commercial goals.'],
    ['Cross-border', 'Indian regulatory frameworks, global compliance expectations.'],
    ['Clear & structured', 'A clear scope, open communication, and responsible execution.'],
    ['Clarity over jargon', 'Clear, practical guidance that is understandable and actionable.']
  ];
  let dW = 0, dH = 0, dActive = 0, dPrev = 0, dSwitch = -10, dOn = false, baseA = 1, hoverLock = false;
  const ga = a => { dx.globalAlpha = baseA * a; };
  const mono = px => { dx.font = `500 ${px}px "Geist Mono", ui-monospace, monospace`; };
  const serif = px => { dx.font = `italic 300 ${px}px Newsreader, Georgia, serif`; };
  const seg = (x1, y1, x2, y2) => { dx.beginPath(); dx.moveTo(x1, y1); dx.lineTo(x2, y2); dx.stroke(); };
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const RND = Array.from({ length: 16 }, () => [rnd(), rnd(), rnd()]);
  const PAIRS = [['notwithstanding the foregoing', 'Clear.'], ['inter alia, mutatis mutandis', 'Practical.'], ['save as otherwise provided herein', 'Understandable.'], ['hereinafter referred to as', 'Actionable.']];
  const GL = 'abcdefghijklmnopqrstuvwxyz§¶';
  const FLOWS = ['Foreign investment routes', 'International transactions', 'Overseas investment', 'Cross-jurisdictional compliance'];
  const scenes = [
    t => { // legal strategy in step with commercial goals
      const p = dW * 0.1, w = dW - p * 2, cy = dH * 0.46, amp = dH * 0.13;
      dx.lineWidth = 1; dx.strokeStyle = '#E6ECF3';
      for (let i = 0; i <= 8; i++) { ga(0.08); const x = p + w * i / 8; seg(x, dH * 0.2, x, dH * 0.72); }
      const gap = Math.max(0, Math.cos(t * 0.55)) * 1.2;
      const wave = (ph, col, lw) => {
        ga(1); dx.strokeStyle = col; dx.lineWidth = lw; dx.beginPath();
        for (let s = 0; s <= 160; s++) {
          const u = s / 160, x = p + u * w;
          const y = cy + Math.sin(u * Math.PI * 3.2 - t * 1.1 + ph) * amp * (0.55 + 0.45 * Math.sin(u * Math.PI));
          s ? dx.lineTo(x, y) : dx.moveTo(x, y);
        }
        dx.stroke();
      };
      wave(gap, 'rgba(230,236,243,0.85)', 1.25);
      wave(0, '#86B4DF', 2.2);
      mono(12);
      ga(1); dx.fillStyle = '#86B4DF'; dx.fillText('— LEGAL STRATEGY', p, dH * 0.84);
      dx.fillStyle = 'rgba(230,236,243,0.85)'; dx.fillText('— COMMERCIAL GOALS', p, dH * 0.84 + 20);
      const inStep = gap < 0.06;
      ga(inStep ? 1 : 0.45); dx.fillStyle = '#C5DCF1'; dx.textAlign = 'right';
      dx.fillText(inStep ? 'IN STEP' : 'ALIGNING', p + w, dH * 0.84); dx.textAlign = 'left';
    },
    t => { // cross-border flows
      const L = dW * 0.2, R = dW * 0.8, deck = dH * 0.64, top = dH * 0.26, sag = dH * 0.5, end = deck - 6;
      const cy = x => {
        if (x <= L) { const u = x / L; return top + (end - top) * (1 - u * u); }
        if (x >= R) { const u = (dW - x) / (dW - R); return top + (end - top) * (1 - u * u); }
        const u = (x - L) / (R - L); return top + (sag - top) * 4 * u * (1 - u);
      };
      dx.strokeStyle = '#E6ECF3'; dx.lineWidth = 1;
      for (let r = 0; r < 5; r++) {
        ga(0.1); dx.setLineDash([14 + r * 6, 18 + r * 9]); dx.lineDashOffset = -t * (10 + r * 4);
        seg(0, deck + 20 + r * 12, dW, deck + 20 + r * 12);
      }
      dx.setLineDash([]);
      ga(0.6); seg(0, deck, dW, deck);
      dx.strokeStyle = '#86B4DF'; ga(0.25);
      for (let x = 10; x < dW; x += 12) { const y = cy(x); if (deck - y > 6) seg(x, y, x, deck); }
      dx.strokeStyle = '#E6ECF3'; ga(0.8);
      for (const x of [L, R]) {
        seg(x - 4, top - 10, x - 4, dH * 0.86); seg(x + 4, top - 10, x + 4, dH * 0.86);
        seg(x - 4, top - 10, x + 4, top - 10); seg(x - 4, top + (deck - top) * 0.45, x + 4, top + (deck - top) * 0.45);
      }
      ga(1); dx.strokeStyle = '#86B4DF'; dx.lineWidth = 1.6; dx.beginPath();
      for (let x = 0; x <= dW; x += 4) { const y = cy(x); x ? dx.lineTo(x, y) : dx.moveTo(x, y); }
      dx.stroke();
      for (let n = 0; n < 7; n++) {
        const u = (t * 0.09 + n / 7) % 1, x = L + u * (R - L);
        ga(Math.sin(u * Math.PI)); dx.fillStyle = '#C5DCF1'; dx.beginPath(); dx.arc(x, cy(x), 3.2, 0, 7); dx.fill();
        const v = (t * 0.07 + n / 7 + 0.05) % 1, x2 = R - v * (R - L);
        ga(Math.sin(v * Math.PI) * 0.9); dx.fillStyle = '#E6ECF3'; dx.fillRect(x2 - 3, deck - 7, 6, 3);
      }
      mono(12); dx.textAlign = 'center';
      ga(0.9); dx.fillStyle = '#E6ECF3'; dx.fillText('INDIA', L, dH * 0.93); dx.fillText('GLOBAL', R, dH * 0.93);
      const idx = Math.floor(t / 2.6) % FLOWS.length, ph = (t / 2.6) % 1;
      ga(Math.min(1, ph * 5, (1 - ph) * 5)); serif(Math.min(26, dW * 0.05)); dx.fillStyle = '#C5DCF1';
      dx.fillText(FLOWS[idx], dW / 2, dH * 0.14); dx.textAlign = 'left';
    },
    t => { // scattered pieces settle into structure
      const s = Math.min(dW, dH) * 0.1, gp = s * 0.32, gw = 4 * s + 3 * gp, ox3 = (dW - gw) / 2, oy3 = dH * 0.18;
      const c = (t % 7) / 7;
      const kk = c < 0.3 ? ease(c / 0.3) : c < 0.78 ? 1 : 1 - ease((c - 0.78) / 0.22);
      for (let i = 0; i < 16; i++) {
        const r = RND[i];
        const tx = ox3 + (i % 4) * (s + gp), ty = oy3 + Math.floor(i / 4) * (s + gp);
        const sx = dW * (0.06 + r[0] * 0.8), sy = dH * (0.06 + r[1] * 0.74);
        const x = sx + (tx - sx) * kk, y = sy + (ty - sy) * kk, rot = (r[2] - 0.5) * 1.8 * (1 - kk);
        dx.save(); dx.translate(x + s / 2, y + s / 2); dx.rotate(rot);
        ga(0.85); dx.strokeStyle = '#E6ECF3'; dx.lineWidth = 1; dx.strokeRect(-s / 2, -s / 2, s, s);
        if (i % 5 === 0) { ga(0.25 + 0.7 * kk); dx.fillStyle = '#86B4DF'; dx.fillRect(-s / 2 + 4, -s / 2 + 4, s - 8, s - 8); }
        dx.restore();
      }
      ga(clamp((kk - 0.8) / 0.2)); mono(12); dx.fillStyle = '#C5DCF1'; dx.textAlign = 'center';
      dx.fillText('SCOPE   ·   COMMUNICATION   ·   EXECUTION', dW / 2, oy3 + gw + s * 1.1); dx.textAlign = 'left';
    },
    t => { // jargon resolves into plain words
      const c = (t % 8) / 8, x = dW * 0.1;
      const fade = c > 0.9 ? 1 - (c - 0.9) / 0.1 : 1;
      PAIRS.forEach(([j, pl], i) => {
        const y = dH * (0.28 + i * 0.16), st = 0.1 + i * 0.09, en = st + 0.18;
        if (c < st) { ga(0.6); mono(14); dx.fillStyle = '#9DAEC0'; dx.fillText(j, x, y); }
        else if (c < en) {
          const q = (c - st) / (en - st);
          const len = Math.round(j.length - (j.length - pl.length) * q), shown = Math.floor(q * pl.length);
          let s = '';
          for (let n = 0; n < len; n++) s += n < shown ? pl[n] : GL[(Math.random() * GL.length) | 0];
          ga(0.95); mono(16); dx.fillStyle = '#C5DCF1'; dx.fillText(s, x, y);
        } else {
          ga(fade); serif(Math.min(46, dW * 0.08)); dx.fillStyle = i % 2 ? '#EEF2F6' : '#86B4DF'; dx.fillText(pl, x, y);
          if (fade < 1) { ga((1 - fade) * 0.6); mono(14); dx.fillStyle = '#9DAEC0'; dx.fillText(j, x, y); }
        }
      });
      ga(0.5); mono(12); dx.fillStyle = '#9DAEC0'; dx.fillText('JARGON  →  GUIDANCE', x, dH * 0.9);
    }
  ];
  function sizeDiff() {
    const r = dc.getBoundingClientRect();
    dW = r.width; dH = r.height;
    dc.width = Math.round(dW * DPR); dc.height = Math.round(dH * DPR);
    dx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function drawDiff(t) {
    dx.clearRect(0, 0, dW, dH);
    const kk = clamp((t - dSwitch) / 0.6);
    if (kk < 1) { baseA = 1 - kk; scenes[dPrev](t); }
    baseA = kk; scenes[dActive](t);
    baseA = 1; dx.globalAlpha = 1;
  }
  function diffLoop(now) {
    if (!inView(dc)) { dOn = false; return; }
    drawDiff(now / 1000);
    requestAnimationFrame(diffLoop);
  }
  function startDiff() {
    if (reduce || dOn || !inView(dc)) return;
    dOn = true;
    requestAnimationFrame(diffLoop);
  }
  function setDiff(i) {
    if (i === dActive) return;
    dPrev = dActive; dActive = i; dSwitch = performance.now() / 1000;
    rows.forEach((r, j) => r.classList.toggle('on', j === i));
    dtag.textContent = CAPS[i][0];
    dcap.textContent = CAPS[i][1];
    if (reduce) { dSwitch = -10; drawDiff(4); }
    startDiff();
  }
  rows.forEach((r, i) => {
    r.addEventListener('mouseenter', () => { hoverLock = true; setDiff(i); });
    r.addEventListener('focus', () => setDiff(i));
    r.addEventListener('click', () => setDiff(i));
  });
  $('#dlist').addEventListener('mouseleave', () => { hoverLock = false; });
  function diffScroll() {
    if (hoverLock || innerWidth < 900) return;
    const r = diffSec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const mid = innerHeight * 0.5;
    let best = dActive, bd = Infinity;
    rows.forEach((row, i) => {
      const rr = row.getBoundingClientRect();
      const d = Math.abs(rr.top + rr.height / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    setDiff(best);
  }

  window.PC.onScroll.push(scrub, pin, diffScroll, startHero, startDiff);
  window.PC.onLayout.push(() => {
    sizeScene(); if (reduce) render(0);
    layoutPin();
    sizeDiff(); drawDiff(reduce ? 4 : performance.now() / 1000);
  });
})();

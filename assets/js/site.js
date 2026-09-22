/* Pier Counsel — shared behaviour for every page.
   Page-specific scripts (home.js) register extra work through window.PC. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  const PC = window.PC = { $, $$, clamp, ease, reduce, DPR, inView, onScroll: [], onLayout: [], menuOpen: false };

  /* ---------- Year & clocks ---------- */
  $$('[data-year]').forEach(n => { n.textContent = new Date().getFullYear(); });
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
  const tick = () => $$('[data-clock]').forEach(n => { n.textContent = fmt.format(new Date()); });
  tick(); setInterval(tick, 15000);

  const thanks = $('#thanks-text');
  if (thanks && new URLSearchParams(location.search).get('form') === 'careers') thanks.textContent = thanks.dataset.careers;

  /* ---------- Menu ---------- */
  const hdr = $('#hdr'), menu = $('#menu'), openBtn = $('#menuOpen'), closeBtn = $('#menuClose');
  function setMenu(open) {
    PC.menuOpen = open;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    [$('#main'), $('#ftr'), hdr].forEach(n => { if (n) n.inert = open; });
    if (open) setTimeout(() => closeBtn.focus({ preventScroll: true }), 60);
    else openBtn.focus({ preventScroll: true });
  }
  if (menu) {
    openBtn.addEventListener('click', () => setMenu(true));
    closeBtn.addEventListener('click', () => setMenu(false));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && PC.menuOpen) setMenu(false); });
  }

  /* ---------- Bar Council of India disclaimer ---------- */
  const bci = $('#bci');
  const BCI_KEY = 'pc-disclaimer-accepted-v1';
  if (bci && !document.body.hasAttribute('data-no-bci') && store.get(BCI_KEY) !== 'yes' && bci.showModal) {
    bci.showModal();
    bci.addEventListener('cancel', e => e.preventDefault());
    $('#bciAgree').addEventListener('click', () => { store.set(BCI_KEY, 'yes'); bci.close(); });
    $('#bciLeave').addEventListener('click', e => {
      e.preventDefault();
      if (document.referrer && !document.referrer.startsWith(location.origin)) history.back();
      else location.href = 'about:blank';
    });
  }

  /* ---------- Practice glyphs ---------- */
  $$('.glyph .draw').forEach(el => el.setAttribute('pathLength', '1'));
  $$('.glyph[data-dots]').forEach(g => { // dot matrix behind the lock
    const NS = 'http://www.w3.org/2000/svg';
    const frag = document.createDocumentFragment();
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const x = 12 + c * 16, y = 12 + r * 16;
      if (x > 30 && x < 90 && y > 22 && y < 100) continue;
      const d = document.createElementNS(NS, 'circle');
      d.setAttribute('cx', x); d.setAttribute('cy', y); d.setAttribute('r', (r + c) % 3 ? 1.2 : 2.2);
      d.setAttribute('class', 'solid');
      frag.appendChild(d);
    }
    g.insertBefore(frag, g.firstChild);
  });

  /* ---------- Cable ornament (inner page heroes) ---------- */
  const cables = $$('canvas.ph-cable').map(cv => ({ cv, ctx: cv.getContext('2d'), w: 0, h: 0, on: false, t0: performance.now() }));
  function sizeCable(c) {
    const r = c.cv.getBoundingClientRect();
    c.w = r.width; c.h = r.height;
    c.cv.width = Math.round(c.w * DPR); c.cv.height = Math.round(c.h * DPR);
    c.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.color = getComputedStyle(c.cv).color;
    const fr = (c.cv.dataset.towers || '0.18,0.5,0.82').split(',').map(Number);
    c.xs = fr.map(f => f * c.w);
  }
  function drawCable(c, t) {
    const { ctx, w, h, xs } = c;
    const top = h * 0.1, deck = h * 0.7, sag = h * 0.52, end = deck - 4;
    const cy = x => {
      if (x <= xs[0]) { const u = x / xs[0]; return top + (end - top) * (1 - u * u); }
      const last = xs[xs.length - 1];
      if (x >= last) { const u = (w - x) / (w - last); return top + (end - top) * (1 - u * u); }
      for (let i = 0; i < xs.length - 1; i++) if (x <= xs[i + 1]) { const u = (x - xs[i]) / (xs[i + 1] - xs[i]); return top + (sag - top) * 4 * u * (1 - u); }
      return top;
    };
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = c.color; ctx.fillStyle = c.color; ctx.lineWidth = 1;
    const seg = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    for (let r = 0; r < 3; r++) {
      ctx.globalAlpha = 0.12; ctx.setLineDash([14 + r * 8, 22 + r * 10]); ctx.lineDashOffset = -t * (8 + r * 4);
      seg(0, deck + 12 + r * 9, w, deck + 12 + r * 9);
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.5; seg(0, deck, w, deck);
    ctx.globalAlpha = 0.18;
    for (let x = 8; x < w; x += 12) { const y = cy(x); if (deck - y > 5) seg(x, y + 1, x, deck); }
    ctx.globalAlpha = 0.7;
    xs.forEach(x => { seg(x - 3, top - 8, x - 3, h); seg(x + 3, top - 8, x + 3, h); seg(x - 3, top - 8, x + 3, top - 8); });
    ctx.globalAlpha = 1; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let x = 0; x <= w; x += 4) { const y = cy(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    if (reduce) return;
    const span = xs[xs.length - 1] - xs[0];
    for (let k = 0; k < 10; k++) {
      const u = (t * 0.035 + k / 10) % 1, x = xs[0] + u * span;
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, cy(x), 2.4, 0, 7); ctx.fill();
    }
  }
  function cableLoop(now) {
    let any = false;
    cables.forEach(c => { if (inView(c.cv)) { any = true; drawCable(c, (now - c.t0) / 1000); } });
    if (any) requestAnimationFrame(cableLoop); else cableRunning = false;
  }
  let cableRunning = false;
  function startCables() {
    if (!cables.length || cableRunning || reduce) return;
    if (!cables.some(c => inView(c.cv))) return;
    cableRunning = true; requestAnimationFrame(cableLoop);
  }

  /* ---------- Count-up ---------- */
  let counts = reduce ? [] : $$('[data-count]');
  function countCheck() {
    if (!counts.length) return;
    counts = counts.filter(el => {
      if (el.getBoundingClientRect().top > innerHeight * 0.85) return true;
      const to = +el.dataset.count, start = performance.now();
      const step = now => {
        const k = ease(clamp((now - start) / 1400));
        el.textContent = Math.round(to * k);
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
      return false;
    });
  }

  /* ---------- Reveal ---------- */
  let pending = [];
  if (!reduce) {
    pending = $$('[data-reveal]').filter(el => el.getBoundingClientRect().top > innerHeight);
    pending.forEach(el => el.classList.add('pre'));
  }
  function revealCheck() {
    if (!pending.length) return;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top > innerHeight * 0.92) return true;
      el.classList.remove('pre');
      return false;
    });
  }

  /* ---------- Lifecycle ---------- */
  const rig = $('#rig');
  let lifeLayout = () => {}, lifeCheck = () => {};
  if (rig) {
    const cable = $('#cable'), lifeSec = rig.closest('.life');
    const tabs = $$('.tab', rig), panels = $$('.panel', lifeSec);
    const NS = 'http://www.w3.org/2000/svg';
    let idx = 0, towerLens = [], lit = null, total = 0, towers = [];
    lifeLayout = () => {
      const w = rig.clientWidth, h = 150, deck = 128, top = 26, sag = 96, end = deck - 8;
      const xs = tabs.map(t => parseFloat(t.style.left) / 100 * w);
      const cy = x => {
        if (x <= xs[0]) { const u = x / xs[0]; return top + (end - top) * (1 - u * u); }
        const last = xs[xs.length - 1];
        if (x >= last) { const u = (w - x) / (w - last); return top + (end - top) * (1 - u * u); }
        for (let i = 0; i < xs.length - 1; i++) if (x <= xs[i + 1]) { const u = (x - xs[i]) / (xs[i + 1] - xs[i]); return top + (sag - top) * 4 * u * (1 - u); }
        return top;
      };
      const samples = [];
      for (let x = 0; x < w; x += 4) samples.push(x);
      samples.push(...xs, w);
      samples.sort((a, b) => a - b);
      let d = '', len = 0, px = 0, py = 0;
      const lens = new Map();
      samples.forEach((x, i) => {
        const y = cy(x);
        if (i) len += Math.hypot(x - px, y - py);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        lens.set(x, len); px = x; py = y;
      });
      total = len;
      towerLens = xs.map(x => lens.get(x));
      let s = '';
      for (let x = 8; x < w; x += 14) { const y = cy(x); if (deck - y > 8) s += `<line class="hang" x1="${x}" y1="${(y + 2).toFixed(1)}" x2="${x}" y2="${deck}"/>`; }
      s += `<line class="deck" x1="0" y1="${deck}" x2="${w}" y2="${deck}"/><line class="deck" x1="0" y1="${deck + 5}" x2="${w}" y2="${deck + 5}"/>`;
      xs.forEach(x => {
        s += `<g class="tower"><line x1="${x - 4}" y1="${top - 8}" x2="${x - 4}" y2="${h}"/><line x1="${x + 4}" y1="${top - 8}" x2="${x + 4}" y2="${h}"/><line x1="${x - 4}" y1="${top - 8}" x2="${x + 4}" y2="${top - 8}"/><line x1="${x - 4}" y1="${top + 40}" x2="${x + 4}" y2="${top + 40}"/></g>`;
      });
      s += `<path class="c-base" d="${d}"/><path class="c-lit" d="${d}" style="stroke-dasharray:${total.toFixed(1)};stroke-dashoffset:${total.toFixed(1)}"/>`;
      cable.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cable.innerHTML = s;
      lit = $('.c-lit', cable);
      towers = $$('.tower', cable);
      paint(true);
    };
    function paint(instant) {
      if (!lit) return;
      if (instant) lit.style.transition = 'none';
      lit.style.strokeDashoffset = (total - towerLens[idx]).toFixed(1);
      if (instant) { lit.getBoundingClientRect(); lit.style.transition = ''; }
      towers.forEach((t, i) => t.classList.toggle('on', i <= idx));
    }
    function setStage(i, focus) {
      idx = (i + tabs.length) % tabs.length;
      tabs.forEach((t, j) => { const on = j === idx; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panels.forEach((p, j) => {
        const on = j === idx;
        p.hidden = !on;
        p.classList.remove('enter');
        if (on) { void p.offsetWidth; p.classList.add('enter'); }
      });
      if (focus) tabs[idx].focus();
      paint(false);
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { rig.classList.add('manual'); setStage(i); });
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault(); rig.classList.add('manual');
        setStage(idx + (e.key === 'ArrowRight' ? 1 : -1), true);
      });
      $('.bar i', t).addEventListener('animationend', () => { if (!rig.classList.contains('manual')) setStage(i + 1); });
    });
    if (reduce) rig.classList.add('manual');
    lifeCheck = () => {
      const r = rig.getBoundingClientRect();
      lifeSec.classList.toggle('live', r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.1);
    };
    PC.onLayout.push(() => setStage(idx));
  }

  /* ---------- People: bio drawer ---------- */
  const drawer = $('#drawer');
  if (drawer) {
    document.addEventListener('click', e => {
      const card = e.target.closest('button.tcard');
      if (!card) return;
      const img = $('img', card);
      $('#dImg').src = img.currentSrc || img.src;
      $('#dImg').alt = img.alt;
      $('#dRole').textContent = $('.trole', card).textContent;
      $('#dName').textContent = $('.tname', card).textContent;
      $('#dBio').textContent = $('.bio-src', card).textContent;
      drawer.showModal();
    });
    $('#drawerClose').addEventListener('click', () => drawer.close());
    drawer.addEventListener('click', e => { if (e.target === drawer) drawer.close(); });
  }

  /* ---------- Book tilt ---------- */
  const book = $('#book');
  if (book && !reduce) {
    const stage = book.parentElement;
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      book.style.transform = `rotateY(${(-20 + x * 30).toFixed(1)}deg) rotateX(${(6 - y * 18).toFixed(1)}deg)`;
    });
    stage.addEventListener('pointerleave', () => { book.style.transform = ''; });
  }

  /* ---------- Magnetic button ---------- */
  $$('.magnet-zone').forEach(zone => {
    const m = $('.magnet', zone);
    if (reduce || !m) return;
    zone.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      m.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`;
    });
    zone.addEventListener('pointerleave', () => { m.style.transform = ''; });
  });

  /* ---------- Fit giant type to its container ---------- */
  function fitAll() {
    $$('[data-fit]').forEach(el => {
      const parent = el.parentElement, cs = getComputedStyle(parent);
      const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.fontSize = '100px';
      const w = el.getBoundingClientRect().width;
      el.style.fontSize = Math.min(+el.dataset.max || 320, 100 * avail / w * (+el.dataset.fit || 0.99)).toFixed(2) + 'px';
    });
  }

  /* ---------- Blog filter ---------- */
  const filter = $('.filter');
  if (filter) {
    const cards = $$('.bcard, .feature'), empty = $('.empty-note');
    filter.addEventListener('click', e => {
      const b = e.target.closest('button.chip');
      if (!b) return;
      $$('button.chip', filter).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      let shown = 0;
      cards.forEach(c => { const on = b.dataset.tag === 'all' || c.dataset.tag === b.dataset.tag; c.hidden = !on; if (on) shown++; });
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* ---------- Article: table of contents & copy link ---------- */
  const toc = $('.toc ol');
  let tocCheck = () => {};
  if (toc) {
    const heads = $$('.prose h2');
    const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const used = new Set();
    heads.forEach(h => {
      let id = slug(h.textContent) || 'section';
      while (used.has(id)) id += '-2';
      used.add(id); h.id = id;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + id; a.textContent = h.textContent;
      li.appendChild(a); toc.appendChild(li);
    });
    if (!heads.length) toc.closest('.toc').hidden = true;
    const links = $$('a', toc);
    tocCheck = () => {
      let cur = -1;
      heads.forEach((h, i) => { if (h.getBoundingClientRect().top < innerHeight * 0.3) cur = i; });
      links.forEach((a, i) => a.classList.toggle('on', i === cur));
    };
  }
  const copyBtn = $('[data-copy-link]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const label = copyBtn.textContent;
      try { await navigator.clipboard.writeText(location.href); copyBtn.textContent = 'Link copied'; }
      catch (e) { copyBtn.textContent = 'Copy failed'; }
      setTimeout(() => { copyBtn.textContent = label; }, 2200);
    });
  }

  /* ---------- Forms ---------- */
  $$('form.form').forEach(form => {
    $$('.file input', form).forEach(inp => {
      const box = inp.closest('.file'), fn = $('.fn', box), def = fn.textContent;
      inp.addEventListener('change', () => {
        const f = inp.files[0];
        const tooBig = f && f.size > 8 * 1024 * 1024;
        box.classList.toggle('has', !!f && !tooBig);
        fn.textContent = !f ? def : tooBig ? 'That file is over 8 MB. Choose a smaller file.' : `${f.name} · ${(f.size / 1024 / 1024).toFixed(1)} MB`;
        inp.setCustomValidity(tooBig ? 'File is larger than 8 MB' : '');
      });
    });
    const validate = el => {
      const wrap = el.closest('.field, .check');
      if (!wrap) return true;
      const ok = el.checkValidity();
      wrap.classList.toggle('invalid', !ok);
      return ok;
    };
    $$('input, select, textarea', form).forEach(el => {
      el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') validate(el); });
      el.addEventListener('input', () => { if (el.closest('.invalid')) validate(el); });
      el.addEventListener('change', () => { if (el.closest('.invalid') || el.type === 'checkbox') validate(el); });
    });
    form.addEventListener('submit', e => {
      const bad = $$('input, select, textarea', form).filter(el => !el.closest('.hp') && !validate(el));
      if (bad.length) { e.preventDefault(); bad[0].focus(); return; }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      if (document.body.hasAttribute('data-preview')) {
        e.preventDefault();
        $('.label', btn).textContent = 'Preview only: nothing was sent';
        setTimeout(() => { location.href = form.getAttribute('action'); }, 1400);
        return;
      }
      $('.label', btn).textContent = 'Sending…';
    });
  });

  /* ---------- Scroll orchestration ---------- */
  const modeSecs = $$('[data-mode]', $('#main') || document);
  const prog = $('#progress');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (hdr) {
      hdr.classList.toggle('scrolled', y > 30);
      if (!PC.menuOpen) hdr.classList.toggle('hide', y > lastY + 2 && y > vh * 0.6);
      if (y < lastY - 2) hdr.classList.remove('hide');
    }
    lastY = y;
    if (prog) prog.style.setProperty('--p', clamp(y / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4));
    const probe = vh * 0.55;
    let mode = modeSecs.length ? modeSecs[0].dataset.mode : 'dark';
    for (const s of modeSecs) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { mode = s.dataset.mode; break; }
      if (r.top > probe) break;
      mode = s.dataset.mode;
    }
    if (document.body.dataset.mode !== mode) document.body.dataset.mode = mode;
    lifeCheck(); countCheck(); revealCheck(); startCables(); tocCheck();
    PC.onScroll.forEach(fn => fn());
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  function layout() {
    cables.forEach(c => { sizeCable(c); drawCable(c, (performance.now() - c.t0) / 1000); });
    lifeLayout();
    fitAll();
    PC.onLayout.forEach(fn => fn());
    onScroll();
  }
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  document.addEventListener('DOMContentLoaded', () => {
    layout();
    if (document.fonts) document.fonts.ready.then(layout);
  });
})();

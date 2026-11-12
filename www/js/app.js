/* CodeTrail app shell: routing, progress, views, exercises. Plain JS, no build step. */
(function () {
  'use strict';

  const MD = window.MD, Interp = window.CppInterp;
  const esc = MD.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const view = $('#view'), topbar = $('#topbar'), drawer = $('#drawer'), scrim = $('#scrim');
  const modalEl = $('#modal'), toastEl = $('#toast');

  /* ------------------------------------------------------------------ icons */
  const I = (p, cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
  const ICON = {
    menu: I('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    back: I('<path d="M15 5l-7 7 7 7"/>'),
    flame: I('<path d="M12 3c.6 3.2 4 4.6 4 9a4 4 0 0 1-8 0c0-1.8.8-3 1.8-4 .2 1.4.8 2 1.6 2.2C11 8.4 10.8 5.6 12 3z"/>'),
    bolt: I('<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    lock: I('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    play: I('<path d="M7 5v14l12-7z"/>', 'fill'),
    bulb: I('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>'),
    reset: I('<path d="M4 4v6h6M4.5 14a8 8 0 1 0 1.6-8.4L4 10"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    sliders: I('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    loop: I('<path d="M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4"/>'),
    book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM6 19h13"/>'),
    home: I('<path d="M4 11l8-7 8 7M6 10v10h12V10"/>')
  };

  /* ------------------------------------------------------------ persistence */
  const KEY = 'codetrail.v1';
  const defaults = () => ({ v: 1, course: 'cpp', theme: 'system', fontSize: 15, xp: 0, streak: 0, lastDay: null, progress: {} });
  let S = defaults();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S = Object.assign(defaults(), JSON.parse(raw));
    } catch (e) { S = defaults(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }

  const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function touchDay() {
    const now = new Date(), today = dayKey(now);
    if (S.lastDay === today) return;
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    S.streak = S.lastDay === dayKey(y) ? S.streak + 1 : 1;
    S.lastDay = today;
  }
  // Streak shown in the bar is only "live" if the last active day was today or yesterday.
  function liveStreak() {
    if (!S.lastDay) return 0;
    const now = new Date();
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return S.lastDay === dayKey(now) || S.lastDay === dayKey(y) ? S.streak : 0;
  }

  /* progress accessors: r* = read-only, w* = create on demand */
  const rl = (cid, lid) => ((S.progress[cid] || {}).lessons || {})[lid] || null;
  const re = (cid, lid, i) => { const l = rl(cid, lid); return (l && l.ex && l.ex[i]) || null; };
  function wl(cid, lid) {
    const p = S.progress[cid] || (S.progress[cid] = { lessons: {} });
    return p.lessons[lid] || (p.lessons[lid] = { done: false, seen: false, ex: {} });
  }
  function we(cid, lid, i) {
    const l = wl(cid, lid);
    return l.ex[i] || (l.ex[i] = { done: false, tries: 0, wrong: 0, last: 0 });
  }

  /* ----------------------------------------------------------------- courses */
  const REG = window.COURSE_REGISTRY || [];
  const COURSE = (id) => (window.COURSES || {})[id];
  const regOf = (id) => REG.find((r) => r.id === id) || { id, name: id, mark: '?', color: '#666' };
  const flat = (c) => c.chapters.reduce((a, ch) => a.concat(ch.lessons), []);
  const findLesson = (c, id) => flat(c).find((l) => l.id === id);
  const nextLesson = (c, id) => { const f = flat(c); const i = f.findIndex((l) => l.id === id); return f[i + 1] || null; };
  const exDone = (cid, lid, i) => !!(re(cid, lid, i) || {}).done;
  const doneCount = (cid, l) => l.exercises.filter((_, i) => exDone(cid, l.id, i)).length;
  function lessonStatus(cid, l) {
    if ((rl(cid, l.id) || {}).done) return 'done';
    return doneCount(cid, l) > 0 || (rl(cid, l.id) || {}).seen ? 'part' : 'todo';
  }
  function courseProgress(c) {
    const f = flat(c);
    return { done: f.filter((l) => (rl(c.id, l.id) || {}).done).length, total: f.length };
  }
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const currentCourse = () => COURSE(S.course) || COURSE('cpp');

  /* ------------------------------------------------------------- UI helpers */
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function modal(o) {
    return new Promise((res) => {
      modalEl.hidden = false;
      modalEl.innerHTML = '<div class="dialog" role="dialog" aria-modal="true"><h3>' + esc(o.title) + '</h3><p>' + esc(o.text) + '</p><div class="row">' +
        (o.cancel === null ? '' : '<button class="btn" data-m="0">' + esc(o.cancel || 'Cancel') + '</button>') +
        '<button class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-m="1">' + esc(o.ok || 'OK') + '</button></div></div>';
      modalEl.onclick = (e) => {
        const b = e.target.closest('[data-m]');
        if (b || e.target === modalEl) { modalEl.hidden = true; modalEl.innerHTML = ''; res(!!b && b.dataset.m === '1'); }
      };
    });
  }
  function applyTheme() {
    const t = S.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : S.theme;
    document.documentElement.dataset.theme = t;
    const m = $('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#171b25' : '#ffffff';
    document.documentElement.style.setProperty('--editor-size', S.fontSize + 'px');
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.theme === 'system') applyTheme(); });

  function statsHtml() {
    return '<span class="chip flame" title="Day streak">' + ICON.flame + '<b>' + liveStreak() + '</b></span>' +
      '<span class="chip bolt" title="Experience points">' + ICON.bolt + '<b>' + S.xp + '</b></span>';
  }
  function updateChips() { const s = $('.tb-stats', topbar); if (s) s.innerHTML = statsHtml(); }
  function renderTop(o) {
    const back = o.mode === 'back';
    topbar.innerHTML = '<button class="icon-btn" data-act="' + (back ? 'back' : 'menu') + '" aria-label="' + (back ? 'Back' : 'Open menu') + '">' + (back ? ICON.back : ICON.menu) + '</button>' +
      '<div class="tb-title"><div class="t1">' + esc(o.title) + '</div>' + (o.sub ? '<div class="t2">' + esc(o.sub) + '</div>' : '') + '</div>' +
      '<div class="tb-stats">' + statsHtml() + '</div>';
  }

  /* ----------------------------------------------------------------- router */
  function go(hash, replace) {
    const cur = location.hash || '#/';
    if (cur === hash) { route(); return; }
    if (replace) { history.replaceState(null, '', hash); route(); } else location.hash = hash;
  }
  function route() {
    const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    try {
      switch (parts[0]) {
        case 'lesson': renderLesson(parts[1], parts[2], parts[3]); break;
        case 'revise': renderRevise(); break;
        case 'review': renderReview(parts[1]); break;
        case 'settings': renderSettings(); break;
        default: renderHome();
      }
    } catch (e) {
      console.error(e);
      view.innerHTML = '<div class="page"><div class="fb bad">' + ICON.x + '<div><p><b>Something went wrong.</b></p><p>' + esc(e.message) + '</p></div></div><button class="btn block" data-act="go" data-to="#/">Back to course</button></div>';
    }
    view.scrollTop = 0;
  }

  /* ----------------------------------------------------------------- drawer */
  let drawerOpen = false, afterClose = null;
  function renderDrawer() {
    let html = '<div class="dr-head"><div class="logo">&lt;/&gt;</div><b>CodeTrail</b></div><div class="dr-label">Courses</div>';
    let group = null;
    for (const r of REG) {
      if (r.group !== group) { group = r.group; if (group) html += '<div class="dr-label">' + esc(group) + '</div>'; }
      const c = COURSE(r.id);
      const cur = r.available && c && r.id === S.course;
      let sub, pill = '';
      if (r.available && c) {
        const p = courseProgress(c);
        sub = p.done + ' of ' + p.total + ' lessons';
        pill = p.done === p.total ? '<span class="pill ok">Done</span>' : '';
      } else { sub = 'Coming in phase ' + r.phase; pill = '<span class="pill">Soon</span>'; }
      html += '<button class="dr-item ' + (cur ? 'current' : '') + (r.available ? '' : ' soon') + '" data-act="' + (r.available ? 'pick-course' : 'soon') + '" data-id="' + esc(r.id) + '">' +
        '<span class="tile" style="background:' + r.color + '">' + esc(r.mark) + '</span><span class="meta"><b>' + esc(r.name) + '</b><small>' + esc(sub) + '</small></span>' + pill + '</button>';
    }
    html += '<div class="dr-sep"></div>' +
      '<button class="dr-item" data-act="drawer-go" data-to="#/revise"><span class="tile" style="background:#7a4fd1">' + ICON.loop + '</span><span class="meta"><b>Revise</b><small>Review finished lessons</small></span></button>' +
      '<button class="dr-item" data-act="drawer-go" data-to="#/settings"><span class="tile" style="background:#5b6784">' + ICON.sliders + '</span><span class="meta"><b>Settings</b><small>Theme, editor, progress</small></span></button>' +
      '<div style="height:24px"></div>';
    drawer.innerHTML = html;
  }
  function openDrawer() {
    if (drawerOpen) return;
    renderDrawer();
    drawerOpen = true;
    history.pushState({ drawer: 1 }, '');
    scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('show'));
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  }
  function hideDrawer() {
    drawerOpen = false;
    scrim.classList.remove('show'); setTimeout(() => { if (!drawerOpen) scrim.hidden = true; }, 200);
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    const cb = afterClose; afterClose = null;
    if (cb) cb();
  }
  function closeDrawer(cb) {
    if (!drawerOpen) { if (cb) cb(); return; }
    afterClose = cb || null;
    history.back();
  }
  window.addEventListener('popstate', () => { if (drawerOpen) hideDrawer(); });
  scrim.addEventListener('click', () => closeDrawer());

  /* ---------------------------------------------------------------- actions */
  const ACT = {
    menu: () => openDrawer(),
    back: () => { if (history.length > 1) history.back(); else go('#/', true); },
    go: (el) => go(el.dataset.to),
    'drawer-go': (el) => closeDrawer(() => go(el.dataset.to)),
    soon: (el) => { const r = regOf(el.dataset.id); toast(r.name + ' arrives in phase ' + r.phase); },
    'pick-course': (el) => closeDrawer(() => { S.course = el.dataset.id; save(); go('#/', true); }),
    'open-lesson': (el) => openLesson(el.dataset.id),
    'goto-step': (el) => go('#/lesson/' + el.dataset.cid + '/' + el.dataset.lid + '/' + el.dataset.step, true),
    'start-exercises': (el) => { wl(el.dataset.cid, el.dataset.lid).seen = true; save(); go('#/lesson/' + el.dataset.cid + '/' + el.dataset.lid + '/1', true); },
    'review-lesson': (el) => startReview(el.dataset.id),
    'review-quick': () => startReview(null),
    'review-again': () => startReview(REVIEW ? REVIEW.only : null),
    'set': (el) => {
      const k = el.parentElement.dataset.set, v = el.dataset.v;
      S[k] = k === 'fontSize' ? parseInt(v, 10) : v; save(); applyTheme(); renderSettings();
    },
    'reset-course': () => modal({ title: 'Reset ' + currentCourse().title + ' progress?', text: 'All finished lessons and exercises in this course will be cleared. XP and streak stay.', ok: 'Reset', danger: true })
      .then((ok) => { if (ok) { delete S.progress[S.course]; save(); toast('Course progress reset'); renderSettings(); } }),
    'reset-all': () => modal({ title: 'Reset everything?', text: 'This clears all progress, XP and your streak on this device.', ok: 'Erase all', danger: true })
      .then((ok) => { if (ok) { const t = S.theme, f = S.fontSize; S = defaults(); S.theme = t; S.fontSize = f; save(); toast('Everything was reset'); go('#/', true); } })
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el, e);
  });

  /* ------------------------------------------------------------ course home */
  function openLesson(lid) {
    const c = currentCourse(), l = findLesson(c, lid);
    if (!l) return;
    let step = 0;
    const st = rl(c.id, lid);
    if (st && !st.done && (st.seen || doneCount(c.id, l))) {
      const first = l.exercises.findIndex((_, i) => !exDone(c.id, lid, i));
      step = first < 0 ? 0 : first + 1;
    }
    go('#/lesson/' + c.id + '/' + lid + '/' + step);
  }

  function renderHome() {
    const c = currentCourse(), r = regOf(c.id);
    const p = courseProgress(c), pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    const lessons = flat(c);
    const next = lessons.find((l) => !(rl(c.id, l.id) || {}).done);
    const started = lessons.some((l) => rl(c.id, l.id));
    renderTop({ mode: 'menu', title: c.title, sub: p.done + ' of ' + p.total + ' lessons done' });
    let html = '<div class="page"><section class="card hero"><div class="hero-top"><div class="tile lg" style="background:' + r.color + '">' + esc(r.mark) + '</div>' +
      '<div><h1>' + esc(c.title) + '</h1><p>' + esc(c.tagline) + '</p></div></div>' +
      '<div><div class="bar ' + (pct === 100 ? 'ok' : '') + '"><i style="width:' + pct + '%"></i></div><div class="hero-meta"><span>' + p.done + ' of ' + p.total + ' lessons</span><span>' + pct + '%</span></div></div>' +
      (next
        ? '<button class="btn primary block" data-act="open-lesson" data-id="' + esc(next.id) + '">' + ICON.play + '<span class="ell">' + (started ? 'Continue' : 'Start') + ' · ' + esc(next.id) + ' ' + esc(next.title) + '</span></button>'
        : '<button class="btn ok block" data-act="go" data-to="#/revise">Course complete. Revise lessons</button>') +
      '</section>';
    for (const ch of c.chapters) {
      const cd = ch.lessons.filter((l) => (rl(c.id, l.id) || {}).done).length;
      html += '<h2 class="sec"><span>Chapter ' + esc(ch.id) + ' · ' + esc(ch.title) + '</span><small>' + cd + '/' + ch.lessons.length + '</small></h2><section class="card lessons">';
      for (const l of ch.lessons) {
        const st = lessonStatus(c.id, l), n = l.exercises.length;
        html += '<button class="lrow ' + st + '" data-act="open-lesson" data-id="' + esc(l.id) + '"><span class="lnum">' + (st === 'done' ? ICON.check : esc(l.id)) + '</span>' +
          '<span class="meta"><b>' + esc(l.title) + '</b><small>Theory · ' + plural(n, 'exercise') + '</small></span>' +
          (st === 'done' ? '<span class="pill ok">Done</span>' : st === 'part' ? '<span class="pill">' + doneCount(c.id, l) + '/' + n + '</span>' : '') + '</button>';
      }
      html += '</section>';
    }
    if (c.upcoming && c.upcoming.length) {
      html += '<h2 class="sec"><span>Coming in the next updates</span></h2><section class="card upcoming">More lessons are on the way for this course:<ul>' +
        c.upcoming.map((t) => '<li>' + ICON.lock.replace('class="ico ', 'class="ico sm ') + '<span>' + esc(t) + '</span></li>').join('') + '</ul></section>';
    }
    html += '<p class="src">' + esc(c.source || '') + '</p></div>';
    view.innerHTML = html;
  }

  /* ----------------------------------------------------------------- lesson */
  function stepBar(cid, l, step) {
    const seen = (rl(cid, l.id) || {}).seen || (rl(cid, l.id) || {}).done || step > 0;
    let h = '<div class="stepbar" role="tablist">';
    h += '<button class="seg theory ' + (step === 0 ? 'cur' : seen ? 'done' : '') + '" data-act="goto-step" data-cid="' + cid + '" data-lid="' + l.id + '" data-step="0" aria-label="Theory"><i></i></button>';
    l.exercises.forEach((_, i) => {
      h += '<button class="seg ' + (step === i + 1 ? 'cur' : exDone(cid, l.id, i) ? 'done' : '') + '" data-act="goto-step" data-cid="' + cid + '" data-lid="' + l.id + '" data-step="' + (i + 1) + '" aria-label="Exercise ' + (i + 1) + '"><i></i></button>';
    });
    return h + '</div>';
  }

  function renderLesson(cid, lid, stepParam) {
    const c = COURSE(cid), l = c && findLesson(c, lid);
    if (!l) { go('#/', true); return; }
    if (stepParam === 'done') { renderDone(c, l); return; }
    const n = l.exercises.length;
    let step = parseInt(stepParam, 10);
    if (!(step >= 0 && step <= n)) step = 0;
    renderTop({ mode: 'back', title: l.id + ' ' + l.title, sub: step === 0 ? 'Theory' : 'Exercise ' + step + ' of ' + n });
    if (step === 0) {
      const done = (rl(cid, lid) || {}).done;
      view.innerHTML = stepBar(cid, l, 0) + '<div class="page"><article class="theory"><div class="lesson-kicker">Lesson ' + esc(l.id) + '</div><h1 class="lesson-title">' + esc(l.title) + '</h1>' +
        MD.render(l.theory) +
        (l.recap.length ? '<section class="recap"><h3>Recap</h3><ul>' + l.recap.map((t) => '<li>' + MD.inline(t) + '</li>').join('') + '</ul></section>' : '') +
        '</article></div><div class="cta"><button class="btn primary" data-act="start-exercises" data-cid="' + cid + '" data-lid="' + lid + '">' + (done ? 'Practice again' : 'Start exercises') + '</button></div>';
      return;
    }
    wl(cid, lid).seen = true; save();
    view.innerHTML = stepBar(cid, l, step) + '<div class="page"><div id="exbody"></div></div><div class="cta" id="exfoot"></div>';
    const idx = step - 1;
    mountExercise({
      body: $('#exbody'), footer: $('#exfoot'), ex: l.exercises[idx], st: we(cid, lid, idx),
      label: idx + 1 < n ? 'Next' : 'Finish',
      onAttempt: () => save(),
      onSolved: (firstTry) => solveExercise(cid, lid, idx, firstTry, 'lesson'),
      onContinue: () => {
        if (idx + 1 < n) { go('#/lesson/' + cid + '/' + lid + '/' + (idx + 2), true); return; }
        const open = l.exercises.findIndex((_, i) => !exDone(cid, lid, i));
        if (open >= 0) { toast('Exercise ' + (open + 1) + ' is still open'); go('#/lesson/' + cid + '/' + lid + '/' + (open + 1), true); } else go('#/lesson/' + cid + '/' + lid + '/done', true);
      }
    });
  }

  let AWARD = null;
  /* Records a solved exercise; returns { xp, completed } for the feedback message. */
  function solveExercise(cid, lid, idx, firstTry, mode) {
    const e = we(cid, lid, idx), first = !e.done;
    e.done = true; e.last = Date.now();
    let xp = 0;
    if (mode === 'lesson') { if (first) xp += 10; } else { e.reviews = (e.reviews || 0) + 1; if (firstTry) xp += 3; }
    touchDay();
    const l = wl(cid, lid), lesson = findLesson(COURSE(cid), lid);
    let completed = false;
    if (!l.done && lesson.exercises.every((_, i) => exDone(cid, lid, i))) { l.done = true; l.doneAt = Date.now(); xp += 20; completed = true; AWARD = { lid, xp }; }
    S.xp += xp;
    save(); updateChips();
    return { xp, completed };
  }

  function renderDone(c, l) {
    if (!(rl(c.id, l.id) || {}).done) { go('#/lesson/' + c.id + '/' + l.id + '/0', true); return; }
    renderTop({ mode: 'back', title: l.title, sub: 'Lesson complete' });
    const next = nextLesson(c, l.id), award = AWARD && AWARD.lid === l.id ? AWARD.xp : 0;
    view.innerHTML = '<div class="page"><div class="done-screen"><div class="trophy">' + ICON.check + '</div><h1>Lesson complete!</h1><p>' + esc(l.id) + ' ' + esc(l.title) + '</p>' +
      (award ? '<div class="xp-gain">' + ICON.bolt + ' +' + award + ' XP</div>' : '') +
      '<div class="stack">' +
      (next ? '<button class="btn primary block" data-act="open-lesson" data-id="' + esc(next.id) + '"><span class="ell">Next lesson · ' + esc(next.id) + ' ' + esc(next.title) + '</span></button>'
        : '<div class="fb ok">' + ICON.check + '<div><p><b>You reached the end of the available lessons.</b></p><p>More chapters arrive in the next updates.</p></div></div>') +
      '<button class="btn block" data-act="go" data-to="#/">Back to course</button>' +
      '<button class="btn ghost block" data-act="go" data-to="#/revise">Revise lessons</button></div></div></div>';
  }

  /* ------------------------------------------------------------ exercises */
  function setFooter(host, buttons, handlers) {
    host.innerHTML = buttons.map((b) => '<button class="btn ' + (b.cls || '') + '" data-fx="' + b.id + '"' + (b.disabled ? ' disabled' : '') + '>' + (b.icon || '') + '<span class="ell">' + b.label + '</span></button>').join('');
    host.onclick = (e) => { const b = e.target.closest('[data-fx]'); if (b && !b.disabled && handlers[b.dataset.fx]) handlers[b.dataset.fx](); };
  }
  const fb = (kind, inner) => '<div class="fb ' + kind + '">' + (kind === 'ok' ? ICON.check : kind === 'warn' ? ICON.info : ICON.x) + '<div>' + inner + '</div></div>';
  const TYPE_LABEL = { choice: 'Single choice', multi: 'Multiple choice', text: 'Type answer', code: 'Code' };
  function exHead(o, title) {
    const done = o.st.done;
    return '<div class="ex-head"><h2>' + esc(title) + '</h2><span class="badge ' + (done ? 'done' : '') + '">' + (done ? 'Done' : TYPE_LABEL[o.ex.type]) + '</span></div>';
  }
  const xpNote = (r) => (r && r.xp ? ' <small>+' + r.xp + ' XP</small>' : '');

  function mountExercise(o) {
    const k = o.ex.type;
    if (k === 'choice' || k === 'multi') mountChoice(o);
    else if (k === 'text') mountText(o);
    else if (k === 'code') mountCode(o);
    else o.body.innerHTML = '<p>Unknown exercise type.</p>';
  }

  function mountChoice(o) {
    const ex = o.ex, st = o.st, multi = ex.type === 'multi';
    const answers = multi ? ex.answers.slice().sort() : [ex.answer];
    let sel = new Set(), solved = !!st.done, attempts = 0, dead = new Set(), showHint = false;
    const keys = 'ABCDEFGH';
    const title = multi ? 'Select all that apply' : 'Quick check';
    function draw(msg) {
      o.body.innerHTML = exHead(o, title) + '<div class="prompt">' + MD.render(ex.prompt) + '</div>' + (ex.code ? MD.codeBlock(ex.code, 'cpp') : '') +
        '<div class="options">' + ex.options.map((t, i) => {
          let cls = '';
          if (solved) cls = answers.indexOf(i) >= 0 ? 'good' : '';
          else if (dead.has(i)) cls = 'bad'; else if (sel.has(i)) cls = 'sel';
          return '<button class="opt ' + (multi ? 'multi ' : '') + cls + '" data-i="' + i + '"' + (solved || dead.has(i) ? ' disabled' : '') + '><span class="key">' + (cls === 'good' ? ICON.check.replace('class="ico ', 'class="ico sm ') : cls === 'bad' ? ICON.x.replace('class="ico ', 'class="ico sm ') : keys[i]) + '</span><span class="txt">' + MD.inline(t) + '</span></button>';
        }).join('') + '</div>' + (showHint && ex.hint ? '<div class="callout tip"><b>Hint</b><span>' + MD.inline(ex.hint) + '</span></div>' : '') + '<div id="fb">' + (msg || (solved && ex.explain ? fb('ok', '<p>' + MD.inline(ex.explain) + '</p>') : '')) + '</div>';
      foot();
    }
    function foot() {
      if (solved) {
        setFooter(o.footer, [{ id: 'retry', label: 'Retry', cls: 'ghost', icon: ICON.reset }, { id: 'next', label: o.label, cls: 'primary' }],
          { retry: () => { solved = false; sel = new Set(); dead = new Set(); attempts = 0; draw(); }, next: () => o.onContinue() });
      } else {
        const b = [];
        if (ex.hint) b.push({ id: 'hint', label: 'Hint', cls: 'ghost', icon: ICON.bulb });
        b.push({ id: 'check', label: 'Check', cls: 'primary', disabled: sel.size === 0 });
        setFooter(o.footer, b, { hint: () => { showHint = !showHint; draw(); }, check });
      }
    }
    function check() {
      attempts++; st.tries++;
      const picked = Array.from(sel).sort();
      const ok = picked.length === answers.length && picked.every((v, i) => v === answers[i]);
      if (ok) {
        const r = o.onSolved(attempts === 1);
        solved = true;
        draw(fb('ok', '<p><b>Correct!</b>' + xpNote(r) + '</p>' + (ex.explain ? '<p>' + MD.inline(ex.explain) + '</p>' : '')));
      } else {
        st.wrong++; o.onAttempt(false);
        if (!multi) { picked.forEach((i) => dead.add(i)); sel = new Set(); }
        draw(fb('bad', '<p><b>Not quite.</b> ' + (multi ? (attempts >= 2 ? 'Exactly ' + answers.length + ' of the options are correct.' : 'Check each option again.') : 'Try another option.') + '</p>'));
      }
    }
    o.body.onclick = (e) => {
      const b = e.target.closest('.opt'); if (!b || solved) return;
      const i = parseInt(b.dataset.i, 10);
      if (multi) { if (sel.has(i)) sel.delete(i); else sel.add(i); } else sel = new Set([i]);
      draw(); // quick redraw; options are tiny
    };
    draw();
  }

  function mountText(o) {
    const ex = o.ex, st = o.st;
    let solved = !!st.done, attempts = 0, showHint = false;
    const norm = (s) => String(s).trim().replace(/\s+/g, ' ');
    function draw(msg, keep) {
      const val = keep !== undefined ? keep : solved ? ex.accept[0] : '';
      o.body.innerHTML = exHead(o, 'Type the answer') + '<div class="prompt">' + MD.render(ex.prompt) + '</div>' + (ex.code ? MD.codeBlock(ex.code, 'cpp') : '') +
        '<input class="text-in" id="ans" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Your answer" value="' + esc(val) + '"' + (solved ? ' disabled' : '') + '>' +
        (showHint && ex.hint ? '<div class="callout tip"><b>Hint</b><span>' + MD.inline(ex.hint) + '</span></div>' : '') +
        '<div id="fb">' + (msg || (solved && ex.explain ? fb('ok', '<p>' + MD.inline(ex.explain) + '</p>') : '')) + '</div>';
      const inp = $('#ans', o.body);
      inp.addEventListener('input', foot);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!solved && inp.value.trim()) check(); } });
      foot();
    }
    function foot() {
      const inp = $('#ans', o.body);
      if (solved) {
        setFooter(o.footer, [{ id: 'retry', label: 'Retry', cls: 'ghost', icon: ICON.reset }, { id: 'next', label: o.label, cls: 'primary' }],
          { retry: () => { solved = false; attempts = 0; draw('', ''); }, next: () => o.onContinue() });
      } else {
        const b = [];
        if (ex.hint) b.push({ id: 'hint', label: 'Hint', cls: 'ghost', icon: ICON.bulb });
        b.push({ id: 'check', label: 'Check', cls: 'primary', disabled: !inp || !inp.value.trim() });
        setFooter(o.footer, b, { hint: () => { showHint = !showHint; draw(undefined, inp.value); }, check });
      }
    }
    function check() {
      const inp = $('#ans', o.body), v = norm(inp.value);
      attempts++; st.tries++;
      if (ex.accept.some((a) => norm(a) === v)) {
        const r = o.onSolved(attempts === 1);
        solved = true; draw(fb('ok', '<p><b>Correct!</b>' + xpNote(r) + '</p>' + (ex.explain ? '<p>' + MD.inline(ex.explain) + '</p>' : '')), inp.value);
      } else {
        st.wrong++; o.onAttempt(false);
        draw(fb('bad', '<p><b>Not quite.</b> Check your answer and try again.</p>'), inp.value);
        const again = $('#ans', o.body); if (again) again.focus();
      }
    }
    draw();
  }

  const SYMS = ['⇥', '{', '}', '(', ')', '[', ']', ';', '<', '>', '"', "'", '=', '+', '-', '*', '/', '%', '&', '|', '!', '#', ':', ',', '.', '\\'];
  function consoleHtml(r, label) {
    const lines = [];
    if (r.stdout) lines.push(esc(r.stdout.replace(/\n$/, '')));
    if (!r.ok) lines.push('<span class="c-err">' + (r.kind === 'compile' ? 'compile error' : 'runtime error') + (r.line ? ' (line ' + r.line + ')' : '') + ': ' + esc(r.message) + '</span>');
    else lines.push('<span class="c-dim">exited with code ' + r.exitCode + '</span>');
    return '<div class="console"><div class="c-head"><span>' + (label || 'Output') + '</span><span>' + (r.ok ? 'OK' : r.kind === 'compile' ? 'compile error' : 'runtime error') + '</span></div><pre>' + lines.join('\n') + '</pre></div>';
  }

  function mountCode(o) {
    const ex = o.ex, st = o.st;
    let solved = !!st.done, attempts = 0, errLine = 0, showHint = false;
    const startCode = st.code != null ? st.code : ex.starter;
    const firstInput = (ex.tests[0] && ex.tests[0].input) || '';
    const needsInput = /\bcin\b/.test(ex.starter);
    o.body.innerHTML = exHead(o, ex.title || 'Write the code') + '<div class="prompt">' + MD.render(ex.prompt) + '</div><div id="hintbox"></div>' +
      '<div class="editor-wrap"><div class="editor-bar"><span>main.cpp</span><button class="btn ghost sm" data-ed="reset">' + ICON.reset.replace('class="ico ', 'class="ico sm ') + 'Reset</button></div>' +
      '<div class="editor"><div class="gutter" aria-hidden="true"></div><textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="C++ code editor"></textarea></div>' +
      '<div class="symbar">' + SYMS.map((s) => '<button type="button" data-sym="' + esc(s) + '" aria-label="Insert ' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></div>' +
      '<details class="stdin"' + (needsInput ? ' open' : '') + '><summary>Program input (what std::cin reads)</summary><textarea id="stdin" rows="3" spellcheck="false" placeholder="Type input here, e.g. 3 4"></textarea></details>' +
      '<div id="out"></div><div id="res"></div>';
    const ta = $('#code', o.body), gut = $('.gutter', o.body), inTa = $('#stdin', o.body), out = $('#out', o.body), res = $('#res', o.body), hintbox = $('#hintbox', o.body);
    ta.value = startCode; inTa.value = firstInput;
    if (needsInput) $('.stdin', o.body).open = true;

    function paintGutter() {
      const n = ta.value.split('\n').length; let h = '';
      for (let i = 1; i <= n; i++) h += '<i' + (i === errLine ? ' class="err"' : '') + '>' + i + '</i>';
      gut.innerHTML = h;
    }
    function autosize() { ta.style.height = 'auto'; ta.style.height = Math.max(200, ta.scrollHeight) + 'px'; paintGutter(); }
    let saveT = 0;
    function changed() { autosize(); clearTimeout(saveT); saveT = setTimeout(() => { st.code = ta.value; save(); }, 400); }
    function insert(text, caret) {
      const s = ta.selectionStart, e = ta.selectionEnd;
      ta.setRangeText(text, s, e, 'end');
      if (caret !== undefined) ta.selectionStart = ta.selectionEnd = s + caret;
      changed();
    }
    ta.addEventListener('input', changed);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); insert('    '); } });
    ta.addEventListener('beforeinput', (e) => {
      if (e.inputType !== 'insertLineBreak' && e.inputType !== 'insertParagraph') return;
      e.preventDefault();
      const s = ta.selectionStart, before = ta.value.slice(0, s), after = ta.value.slice(ta.selectionEnd);
      const line = before.slice(before.lastIndexOf('\n') + 1);
      let indent = /^[ \t]*/.exec(line)[0];
      if (/\{\s*$/.test(line)) {
        if (/^\s*\}/.test(after)) { insert('\n' + indent + '    \n' + indent, 1 + indent.length + 4); return; }
        indent += '    ';
      }
      insert('\n' + indent);
    });
    const sb = $('.symbar', o.body);
    sb.addEventListener('mousedown', (e) => e.preventDefault()); // keep the keyboard open
    sb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sym]'); if (!b) return;
      ta.focus(); insert(b.dataset.sym === '⇥' ? '    ' : b.dataset.sym);
    });
    $('[data-ed=reset]', o.body).addEventListener('click', () => {
      modal({ title: 'Reset your code?', text: 'The editor goes back to the starting code. Your current code will be lost.', ok: 'Reset', danger: true }).then((ok) => {
        if (ok) { ta.value = ex.starter; errLine = 0; changed(); res.innerHTML = ''; out.innerHTML = ''; }
      });
    });

    function run() {
      errLine = 0; paintGutter();
      out.innerHTML = '<div class="console"><div class="c-head"><span>Output</span><span>running...</span></div><pre><span class="c-dim">Running...</span></pre></div>';
      setTimeout(() => {
        const r = Interp.run(ta.value, inTa.value);
        out.innerHTML = consoleHtml(r);
        if (!r.ok && r.line) { errLine = r.line; paintGutter(); }
        out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 30);
    }
    function check() {
      attempts++; st.tries++; st.code = ta.value; errLine = 0;
      const g = Interp.grade(ex, ta.value);
      let h = '';
      if (g.pass) {
        const r = o.onSolved(attempts === 1);
        solved = true;
        h = '<div class="tests-list">' + g.results.map((t, i) => '<div class="trow ok">' + ICON.check + '<span>Test ' + (i + 1) + ' passed</span></div>').join('') + '</div>' +
          fb('ok', '<p><b>All tests passed!</b>' + xpNote(r) + '</p>');
      } else {
        st.wrong++; o.onAttempt(false);
        if (g.kind === 'require') h = fb('warn', '<p><b>Almost there.</b> ' + esc(g.message) + '</p>');
        else if (g.kind === 'compile' || g.kind === 'runtime') {
          errLine = g.line || 0;
          h = fb('bad', '<p><b>' + (g.kind === 'compile' ? 'Your code does not compile' : 'Your program crashed') + (g.line ? ' (line ' + g.line + ')' : '') + '</b></p><p>' + esc(g.message) + '</p>');
        } else {
          const t = g.results[g.results.length - 1], total = ex.tests.length;
          h = '<div class="tests-list">' + g.results.map((x, i) => '<div class="trow ' + (x.ok ? 'ok' : 'bad') + '">' + (x.ok ? ICON.check : ICON.x) + '<span>Test ' + (i + 1) + (x.ok ? ' passed' : ' failed') + '</span></div>').join('') + '</div>' +
            fb('bad', '<p><b>Wrong output on test ' + g.results.length + ' of ' + total + '.</b></p>') +
            '<div class="diff">' + (t.input ? '<div><small>Input</small><pre>' + esc(t.input) + '</pre></div>' : '') +
            '<div class="want"><small>Expected</small><pre>' + esc(t.expected) + '</pre></div><div class="got"><small>Your output</small><pre>' + (esc(t.got) || '(nothing)') + '</pre></div></div>';
        }
      }
      res.innerHTML = h; paintGutter(); foot();
      res.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      save();
    }
    function foot() {
      const b = [{ id: 'run', label: 'Run', cls: 'ghost', icon: ICON.play.replace('class="ico ', 'class="ico sm ') }];
      if (ex.hint) b.push({ id: 'hint', label: 'Hint', cls: 'ghost', icon: ICON.bulb.replace('class="ico ', 'class="ico sm ') });
      if (!solved && (st.wrong >= 3 || attempts >= 3) && ex.solution) b.push({ id: 'solution', label: 'Solution', cls: 'ghost' });
      b.push(solved ? { id: 'next', label: o.label, cls: 'primary' } : { id: 'check', label: 'Check', cls: 'primary' });
      if (solved) b.splice(b.length - 1, 0, { id: 'check', label: 'Check', cls: 'ghost' });
      setFooter(o.footer, b, {
        run, check,
        hint: () => {
          showHint = !showHint;
          hintbox.innerHTML = showHint ? '<div class="callout tip"><b>Hint</b><span>' + MD.inline(ex.hint) + '</span></div>' : '';
        },
        solution: () => modal({ title: 'Show the solution?', text: 'Your code will be replaced by the reference solution. Study it, then try to write it yourself next time.', ok: 'Show solution' }).then((ok) => {
          if (ok) { st.myCode = ta.value; ta.value = ex.solution; changed(); toast('Solution loaded. Press Check to finish.'); }
        }),
        next: () => o.onContinue()
      });
    }
    autosize(); foot();
  }

  /* ------------------------------------------------------------------ revise */
  function finishedLessons(c) { return flat(c).filter((l) => (rl(c.id, l.id) || {}).done); }
  function renderRevise() {
    const c = currentCourse(), done = finishedLessons(c), all = flat(c);
    renderTop({ mode: 'menu', title: 'Revise', sub: c.title });
    let exTotal = 0, mastered = 0, weak = 0;
    for (const l of done) l.exercises.forEach((_, i) => { exTotal++; const e = re(c.id, l.id, i) || {}; if (e.done && !e.wrong) mastered++; if (e.wrong > 0) weak++; });
    let html = '<div class="page">';
    if (!done.length) {
      html += '<section class="card empty"><h3 style="margin:0 0 6px;color:var(--text)">Nothing to revise yet</h3><p style="margin:0 0 14px">Finish a lesson and its exercises, and it will show up here for quick reviews.</p><button class="btn primary" data-act="go" data-to="#/">Go to ' + esc(c.title) + '</button></section></div>';
      view.innerHTML = html; return;
    }
    html += '<div class="stats3"><div class="card stat"><b>' + done.length + '/' + all.length + '</b><small>Lessons done</small></div><div class="card stat"><b>' + mastered + '/' + exTotal + '</b><small>Right first time</small></div><div class="card stat"><b>' + weak + '</b><small>Need practice</small></div></div>' +
      '<h2 class="sec"><span>Practice</span></h2><section class="card quick"><h3>Quick review</h3><p>A mixed round of up to 5 exercises from your finished lessons. Ones you got wrong or have not seen for a while come up more often.</p><button class="btn primary" data-act="review-quick">' + ICON.play + 'Start quick review</button></section>' +
      '<h2 class="sec"><span>Finished lessons</span><small>tap to open</small></h2><section class="card lessons">';
    for (const l of done) {
      const wrongs = l.exercises.reduce((a, _, i) => a + ((re(c.id, l.id, i) || {}).wrong || 0), 0);
      html += '<details class="rev"><summary><span class="lnum" style="background:var(--ok);border-color:var(--ok);color:#fff">' + ICON.check + '</span><span class="meta"><b>' + esc(l.id) + ' ' + esc(l.title) + '</b><small>' + plural(l.exercises.length, 'exercise') + (wrongs ? ' · ' + plural(wrongs, 'miss') + ' so far' : '') + '</small></span></summary>' +
        '<div class="rev-body"><ul>' + l.recap.map((t) => '<li>' + MD.inline(t) + '</li>').join('') + '</ul>' +
        '<div class="rev-actions"><button class="btn sm" data-act="goto-step" data-cid="' + c.id + '" data-lid="' + esc(l.id) + '" data-step="0">' + ICON.book.replace('class="ico ', 'class="ico sm ') + 'Re-read theory</button>' +
        '<button class="btn sm primary" data-act="review-lesson" data-id="' + esc(l.id) + '">Practice exercises</button></div></div></details>';
    }
    view.innerHTML = html + '</section></div>';
  }

  let REVIEW = null;
  function buildQueue(c, only) {
    const items = [];
    for (const l of flat(c)) {
      if (only ? l.id !== only : !(rl(c.id, l.id) || {}).done) continue;
      l.exercises.forEach((_, i) => {
        const e = re(c.id, l.id, i) || {};
        const days = e.last ? (Date.now() - e.last) / 864e5 : 7;
        items.push({ lid: l.id, idx: i, w: 1 + (e.wrong || 0) * 2 + Math.min(days, 14) * 0.3 + (e.reviews ? 0 : 1) });
      });
    }
    if (only) return items;
    const picked = [];
    while (picked.length < 5 && items.length) {
      const total = items.reduce((a, x) => a + x.w, 0);
      let r = Math.random() * total, j = 0;
      for (; j < items.length - 1; j++) { r -= items[j].w; if (r <= 0) break; }
      picked.push(items.splice(j, 1)[0]);
    }
    return picked;
  }
  function startReview(only) {
    const c = currentCourse(), items = buildQueue(c, only);
    if (!items.length) { toast('Finish a lesson first'); return; }
    REVIEW = { cid: c.id, items, pos: 0, first: 0, xp: 0, only: only || null };
    go('#/review' + (only ? '/' + encodeURIComponent(only) : ''));
  }
  function renderReview(only) {
    if (!REVIEW || (only && REVIEW.only !== only)) {
      const c = currentCourse(), items = buildQueue(c, only || null);
      if (!items.length) { go('#/revise', true); return; }
      REVIEW = { cid: c.id, items, pos: 0, first: 0, xp: 0, only: only || null };
    }
    const R = REVIEW, c = COURSE(R.cid), total = R.items.length;
    renderTop({ mode: 'back', title: R.only ? 'Practice ' + R.only : 'Quick review', sub: R.pos < total ? 'Question ' + (R.pos + 1) + ' of ' + total : 'Finished' });
    if (R.pos >= total) {
      view.innerHTML = '<div class="page"><div class="done-screen"><div class="trophy">' + ICON.check + '</div><h1>Review complete</h1><p>' + R.first + ' of ' + total + ' right on the first try.</p>' +
        (R.xp ? '<div class="xp-gain">' + ICON.bolt + ' +' + R.xp + ' XP</div>' : '') +
        '<div class="stack"><button class="btn primary block" data-act="review-again">Another round</button><button class="btn block" data-act="go" data-to="#/revise">Back to Revise</button></div></div></div>';
      return;
    }
    const it = R.items[R.pos], l = findLesson(c, it.lid), ex = l.exercises[it.idx], st = we(c.id, it.lid, it.idx);
    const wasDone = st.done;
    st.done = false; // present it fresh; it is restored to done once solved (or left) below
    view.innerHTML = '<div class="review-bar"><div class="bar"><i style="width:' + Math.round((R.pos / total) * 100) + '%"></i></div></div><div class="page"><p class="src" style="padding:0 2px 8px">' + esc(it.lid + ' ' + l.title) + '</p><div id="exbody"></div></div><div class="cta" id="exfoot"></div>';
    let wrongHere = false;
    mountExercise({
      body: $('#exbody'), footer: $('#exfoot'), ex, st, label: R.pos + 1 < total ? 'Next' : 'Finish',
      onAttempt: () => { wrongHere = true; save(); },
      onSolved: (firstTry) => { const r = solveExercise(c.id, it.lid, it.idx, firstTry && !wrongHere, 'review'); if (firstTry && !wrongHere) R.first++; R.xp += r.xp; return r; },
      onContinue: () => { R.pos++; renderReview(R.only || undefined); view.scrollTop = 0; }
    });
    if (wasDone) { st.done = true; } // keep the stored status; solveExercise sets it again anyway
  }

  /* ---------------------------------------------------------------- settings */
  function renderSettings() {
    const c = currentCourse();
    renderTop({ mode: 'menu', title: 'Settings' });
    const seg = (key, opts, cur) => '<div class="seg-ctl" data-set="' + key + '">' + opts.map((o) => '<button data-act="set" data-v="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>';
    view.innerHTML = '<div class="page"><section class="card"><div class="setting"><b>Theme</b>' + seg('theme', [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], S.theme) + '</div>' +
      '<div class="setting"><b>Code editor text size</b>' + seg('fontSize', [[13, 'Small'], [15, 'Medium'], [17, 'Large']], S.fontSize) + '</div></section>' +
      '<h2 class="sec"><span>Progress</span></h2><section class="card"><div class="setting"><b>Reset ' + esc(c.title) + ' progress</b><small>Clears finished lessons and exercises for this course.</small><button class="btn block danger" data-act="reset-course">Reset course</button></div>' +
      '<div class="setting"><b>Reset everything</b><small>Clears all courses, XP and streak on this device.</small><button class="btn block danger" data-act="reset-all">Erase all progress</button></div></section>' +
      '<h2 class="sec"><span>About</span></h2><section class="card setting"><b>CodeTrail 0.1 (phase 1: C++)</b><small>Everything runs offline on your device. Code exercises are checked by a built-in mini C++ interpreter that supports the beginner subset taught so far; it grows with each phase.</small><small>Lesson topics follow learncpp.com; the text is written independently.</small></section></div>';
  }

  /* -------------------------------------------------------------------- init */
  load(); applyTheme();
  window.addEventListener('hashchange', route);
  window.__codetrail = { state: () => S, go, route };
  if (!location.hash) history.replaceState(null, '', '#/');
  route();
})();

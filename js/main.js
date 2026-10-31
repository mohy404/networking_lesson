/* main.js — app bootstrap: theme, nav, lessons, URL tools, HTTPS demo, journey, progress UI */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.toast = function (msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  /* ----- Theme ----- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $('#themeIcon').textContent = t === 'dark' ? '☾' : '☀';
  }
  let theme = 'dark';
  try { theme = localStorage.getItem('netcourse:theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); } catch (e) { /* ignore */ }
  applyTheme(theme);
  $('#themeToggle').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('netcourse:theme', theme); } catch (e) { /* ignore */ }
  });

  /* ----- Mobile nav ----- */
  const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '✕' : '☰';
  });
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = '☰';
  }));

  /* ----- Reveal on scroll + counters + scroll spy ----- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    reveals.forEach(r => io.observe(r));
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'lessons', 'practice', 'quiz', 'tasks'].forEach(id => { const s = document.getElementById(id); if (s) spy.observe(s); });
  } else reveals.forEach(r => r.classList.add('in'));

  function countUp() {
    $$('[data-count]').forEach(b => {
      const end = +b.dataset.count; let n = 0;
      const step = () => { n++; b.textContent = n; if (n < end) setTimeout(step, 70); };
      b.textContent = '0'; if (end > 0) step();
    });
  }
  countUp();

  /* ----- Progress UI ----- */
  function updateProgressUI() {
    const p = Progress.percent();
    $('#navProgressFill').style.width = p + '%';
    $('#navProgressText').textContent = p + '%';
    $('#ringFg').style.strokeDashoffset = String(327 * (1 - p / 100));
    $('#ringText').textContent = p + '%';
    $('#stLessons').textContent = Progress.doneCount();
    const q = Progress.quiz;
    $('#stQuiz').textContent = q ? (q.passed ? 'نجح ' : 'رسب ') + q.pct + '%' : 'لم يبدأ';
    $('#stHw').textContent = { none: 'لم يبدأ', partial: 'جاري', done: 'مكتمل' }[Progress.hw] || 'لم يبدأ';
    const c = Progress.doneCount();
    $('#resumeText').textContent = c === 0 ? 'ابدأ من الدرس الأول وكمّل خطوة بخطوة.'
      : c >= Progress.TOTAL ? 'خلّصت كل الدروس! روح للاختبار والتاسك.'
      : 'خلّصت ' + c + ' من ' + Progress.TOTAL + ' درس. الدرس اللي وقفت عنده: ' + (LESSONS[Progress.last - 1] || LESSONS[0]).title;
    renderList();
  }
  document.addEventListener('progress:change', updateProgressUI);

  /* ----- Lessons ----- */
  let current = Math.min(Math.max(Progress.last || 1, 1), LESSONS.length);

  function renderList() {
    const list = $('#lessonList');
    list.innerHTML = '';
    LESSONS.forEach(l => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lesson-item' + (l.id === current ? ' active' : '') + (Progress.isDone(l.id) ? ' done' : '');
      b.setAttribute('aria-current', l.id === current ? 'true' : 'false');
      b.innerHTML = '<span class="num">' + String(l.id).padStart(2, '0') + '</span><span></span>';
      b.lastChild.textContent = l.title;
      b.addEventListener('click', () => showLesson(l.id, true));
      list.appendChild(b);
    });
  }

  function showLesson(id, scroll) {
    const l = LESSONS.find(x => x.id === id) || LESSONS[0];
    current = l.id;
    Progress.setLast(l.id);
    const view = $('#lessonView');
    const done = Progress.isDone(l.id);
    view.innerHTML = `<article class="lesson" aria-labelledby="lt">
      <span class="lesson-tag">LESSON ${String(l.id).padStart(2, '0')} — ${esc(l.en)}</span>
      <h2 id="lt">${l.title}</h2>
      <p class="intro">${l.intro}</p>
      ${l.body}
      <div class="analogy">${l.analogy}</div>
      <h3>مثال عملي</h3><p>${l.ex}</p>
      ${(l.notes || []).map(n => `<div class="note ${n.t}">${n.h}</div>`).join('')}
      <div class="takeaways"><h4>الخلاصة (Key Takeaways)</h4><ul>${l.takeaways.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <div class="lesson-nav">
        <button class="btn btn-ghost" id="prevL" type="button" ${l.id === 1 ? 'disabled' : ''}>← الدرس السابق</button>
        <button class="btn ${done ? 'btn-ghost' : 'btn-success'}" id="doneL" type="button">${done ? '✔ مكتمل (دوس للتراجع)' : 'تم إنهاء الدرس ✔'}</button>
        <button class="btn btn-primary" id="nextL" type="button" ${l.id === LESSONS.length ? 'disabled' : ''}>الدرس التالي →</button>
      </div></article>`;
    $$('[data-widget]', view).forEach(h => {
      const fn = Widgets[h.dataset.widget];
      try { if (fn) fn(h); else h.innerHTML = '<div class="note warn">المكوّن غير متاح.</div>'; }
      catch (err) { h.innerHTML = '<div class="note warn">تعذّر تحميل هذا العنصر التفاعلي.</div>'; console.error(err); }
    });
    $$('pre.code', view).forEach(pre => {
      if (pre.querySelector('.hl')) return;
      const text = pre.textContent;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'copy-btn'; btn.textContent = 'نسخ';
      btn.addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { btn.textContent = 'تم ✓'; setTimeout(() => btn.textContent = 'نسخ', 1500); }).catch(() => window.toast('النسخ غير متاح'));
      });
      pre.appendChild(btn);
    });
    $('#prevL', view).addEventListener('click', () => showLesson(l.id - 1, true));
    $('#nextL', view).addEventListener('click', () => showLesson(l.id + 1, true));
    $('#doneL', view).addEventListener('click', () => {
      const was = Progress.isDone(l.id);
      Progress.completeLesson(l.id, !was);
      if (!was) { window.toast('أحسنت! الدرس ' + l.id + ' اتسجل كمكتمل'); if (l.id < LESSONS.length) showLesson(l.id + 1, true); else showLesson(l.id, false); }
      else showLesson(l.id, false);
    });
    renderList();
    if (scroll) view.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ----- URL anatomy ----- */
  function urlDemo(boxId, infoId, parts) {
    const box = $('#' + boxId), info = $('#' + infoId);
    box.innerHTML = '';
    parts.forEach((p, i) => {
      if (!p.info) { const s = document.createElement('span'); s.className = 'muted'; s.textContent = p.t; box.appendChild(s); return; }
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'url-part u' + p.c; b.textContent = p.t;
      const show = () => { $$('.url-part', box).forEach(x => x.classList.remove('active')); b.classList.add('active'); info.innerHTML = p.info; };
      b.addEventListener('click', show); b.addEventListener('mouseenter', show); b.addEventListener('focus', show);
      box.appendChild(b);
    });
  }
  urlDemo('urlDemo1', 'urlDemoInfo1', [
    { t: 'https', c: 0, info: '<b>Protocol / Scheme:</b> <code>https</code> — البروتوكول المستخدم (HTTP فوق TLS).' }, { t: '://' },
    { t: 'www', c: 1, info: '<b>Subdomain:</b> <code>www</code> — جزء فرعي من الدومين.' }, { t: '.' },
    { t: 'youtube', c: 2, info: '<b>Domain name:</b> <code>youtube</code> — اسم الموقع.' },
    { t: '.com', c: 3, info: '<b>TLD (Top-Level Domain):</b> <code>.com</code> — امتداد الدومين.' },
    { t: '/', c: 4, info: '<b>Path:</b> <code>/</code> — الصفحة الرئيسية للموقع.' }
  ]);
  urlDemo('urlDemo2', 'urlDemoInfo2', [
    { t: 'https', c: 0, info: '<b>Scheme:</b> <code>https</code>.' }, { t: '://' },
    { t: 'example', c: 2, info: '<b>Domain name:</b> <code>example</code>.' }, { t: '.com', c: 3, info: '<b>TLD:</b> <code>.com</code>.' },
    { t: '/products/phones', c: 4, info: '<b>Path:</b> مسار المورد على السيرفر (هنا قسم الموبايلات).' },
    { t: '?id=10', c: 5, info: '<b>Query Parameters:</b> بتبدأ بعلامة <code>?</code> وبتتكون من <code>key=value</code>. لو كذا باراميتر بيتفصلوا بـ <code>&amp;</code>.' },
    { t: '#details', c: 6, info: '<b>Fragment:</b> بعد علامة <code>#</code>، بيشاور على جزء داخل الصفحة (بيتعالج في المتصفح ومابيتبعتش للسيرفر).' }
  ]);

  $('#urlForm').addEventListener('submit', e => {
    e.preventDefault();
    const out = $('#urlResult'), raw = $('#urlInput').value.trim();
    out.innerHTML = '';
    let u;
    try { u = new URL(raw); } catch (err) {
      out.innerHTML = '<div class="note warn">الرابط غير صالح. لازم يبدأ بـ <code>https://</code> أو <code>http://</code> مثل <code>https://example.com/page</code></div>'; return;
    }
    const labels = u.hostname.split('.');
    const isIp = /^\d+(\.\d+){3}$/.test(u.hostname);
    let sub = '—', dom = u.hostname, tld = '—';
    if (!isIp && labels.length >= 2) { tld = '.' + labels[labels.length - 1]; dom = labels[labels.length - 2]; sub = labels.length > 2 ? labels.slice(0, -2).join('.') : '—'; }
    const port = u.port || ({ 'https:': '443', 'http:': '80' }[u.protocol] || '—') + (u.port ? '' : ' (افتراضي)');
    const params = Array.from(u.searchParams.entries());
    const rows = [
      ['Protocol (Scheme)', u.protocol.replace(':', '')], ['Hostname', u.hostname], ['Subdomain', sub], ['Domain name', dom], ['TLD', tld],
      ['Port', port], ['Path', u.pathname], ['Query', u.search || '—'],
      ['Parameters', params.length ? params.map(p => p[0] + ' = ' + p[1]).join(' ، ') : '—'], ['Fragment', u.hash || '—']
    ];
    const tbl = document.createElement('table');
    tbl.innerHTML = '<thead><tr><th>الجزء</th><th class="ltr">القيمة</th></tr></thead>';
    const tb = document.createElement('tbody');
    rows.forEach(r => { const tr = document.createElement('tr'); tr.innerHTML = '<td></td><td class="ltr"></td>'; tr.children[0].textContent = r[0]; tr.children[1].textContent = r[1]; tb.appendChild(tr); });
    tbl.appendChild(tb); out.appendChild(tbl);
    const n = document.createElement('p'); n.className = 'muted'; n.style.padding = '.5rem 1rem';
    n.textContent = 'ملاحظة: تقسيم Subdomain/Domain/TLD هنا مبسّط، ومش بيغطي امتدادات مركبة زي .co.uk.';
    out.appendChild(n);
  });
  $('#urlForm').dispatchEvent(new Event('submit', { cancelable: true }));

  /* ----- HTTP vs HTTPS animation ----- */
  $('#httpsAnimBtn').addEventListener('click', () => {
    const pipes = $$('#httpsSection .pipe');
    pipes.forEach(p => p.classList.add('run'));
    $$('#httpsSection .lock').forEach(l => { l.classList.remove('shake'); void l.offsetWidth; l.classList.add('shake'); });
    setTimeout(() => pipes.forEach(p => p.classList.remove('run')), 4500);
  });

  /* ----- Journey ----- */
  $('#journeyForm').addEventListener('submit', e => {
    e.preventDefault();
    const box = $('#journeyBox');
    let u;
    try { u = new URL($('#journeyUrl').value.trim()); if (!/^https?:$/.test(u.protocol)) throw new Error('scheme'); }
    catch (err) { box.hidden = false; box.innerHTML = '<div class="note warn">اكتب رابط صحيح يبدأ بـ https:// مثل https://www.google.com</div>'; return; }
    box.hidden = false;
    mountStepper(box, journeySteps(u.hostname));
  });

  /* ----- Mount quiz & tasks ----- */
  Quiz.mount($('#quizBox'));
  Tasks.mount($('#tasksBox'));

  /* ----- Init ----- */
  $('#resumeBtn').addEventListener('click', e => { e.preventDefault(); showLesson(Progress.last || 1, false); $('#lessons').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
  $('#startBtn').addEventListener('click', () => showLesson(1, false));
  showLesson(current, false);
  updateProgressUI();
})();

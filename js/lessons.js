/* lessons.js — lesson content (Arabic) + SVG diagrams + interactive widgets */
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- SVG helpers ---------- */
const T = (x, y, t, c = 'svg-t', a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${t}</text>`;
const hs = (k, label, inner) => k ? `<g class="hotspot" data-k="${k}" tabindex="0" role="button" aria-label="${label}">${inner}</g>` : inner;
const line = (x1, y1, x2, y2, c = 'svg-line') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`;
const packet = (path, dur = 2.5, begin = 0) => `<circle r="5" class="packet"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;
const pc = (x, y, label, sub, k) => hs(k, label, `<g transform="translate(${x} ${y})"><rect width="70" height="46" rx="6" class="svg-box"/><rect x="6" y="6" width="58" height="30" rx="3" fill="#0b1220"/><rect x="26" y="46" width="18" height="8" fill="#64748b"/><rect x="14" y="54" width="42" height="4" rx="2" fill="#64748b"/>${T(35, 76, label)}${sub ? T(35, 93, sub, 'svg-m') : ''}</g>`);
const phone = (x, y, label, sub, k) => hs(k, label, `<g transform="translate(${x} ${y})"><rect width="36" height="60" rx="8" class="svg-box"/><rect x="4" y="8" width="28" height="40" rx="3" fill="#0b1220"/><circle cx="18" cy="54" r="2.5" fill="#64748b"/>${T(18, 80, label)}${sub ? T(18, 97, sub, 'svg-m') : ''}</g>`);
const router = (x, y, label, sub, k) => hs(k, label, `<g transform="translate(${x} ${y})"><line x1="14" y1="0" x2="8" y2="-26" stroke="#94A3B8" stroke-width="3"/><line x1="76" y1="0" x2="82" y2="-26" stroke="#94A3B8" stroke-width="3"/><rect width="90" height="30" rx="8" class="svg-box" style="stroke:#22D3EE"/><circle cx="20" cy="15" r="3.5" fill="#22C55E"/><circle cx="34" cy="15" r="3.5" fill="#F59E0B"/><circle cx="48" cy="15" r="3.5" fill="#22D3EE"/>${T(45, 52, label)}${sub ? T(45, 69, sub, 'svg-m') : ''}</g>`);
const server = (x, y, label, sub, k) => hs(k, label, `<g transform="translate(${x} ${y})"><rect width="64" height="76" rx="8" class="svg-box"/><rect x="8" y="10" width="48" height="16" rx="3" fill="#0b1220"/><rect x="8" y="32" width="48" height="16" rx="3" fill="#0b1220"/><circle cx="16" cy="18" r="3" fill="#22C55E"/><circle cx="16" cy="40" r="3" fill="#22C55E"/><rect x="8" y="54" width="48" height="12" rx="3" fill="#0b1220"/>${T(32, 98, label)}${sub ? T(32, 115, sub, 'svg-m') : ''}</g>`);
const cloud = (x, y, label, sub, k) => hs(k, label, `<g transform="translate(${x} ${y})"><path d="M30 56 a22 22 0 0 1 8-40 a30 30 0 0 1 56 8 a20 20 0 0 1 4 32 z" class="svg-box" style="stroke:#22D3EE"/>${T(64, 42, label)}${sub ? T(64, 78, sub, 'svg-m') : ''}</g>`);
const printerSvg = (x, y, label, k) => hs(k, label, `<g transform="translate(${x} ${y})"><rect y="14" width="70" height="34" rx="6" class="svg-box"/><rect x="14" width="42" height="16" rx="2" fill="#0b1220" stroke="#64748b"/><rect x="14" y="38" width="42" height="18" rx="2" fill="#fff" opacity=".85"/>${T(35, 76, label)}</g>`);
const fig = (svg, cap) => `<figure class="figure">${svg}<figcaption>${cap}</figcaption></figure>`;
const svgWrap = (vb, inner, label) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${inner}</svg>`;

function mountHotspots(host, svg, info, def) {
  host.innerHTML = `<div class="diagram">${svg}</div><div class="info-box" aria-live="polite">${def}</div>`;
  const box = host.querySelector('.info-box');
  host.querySelectorAll('.hotspot').forEach(g => {
    const show = () => { box.innerHTML = info[g.dataset.k] || def; };
    g.addEventListener('click', show);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  });
}
function moveDot(dot, x1, x2, ms) {
  return new Promise(res => {
    if (reduceMotion) { dot.setAttribute('cx', x2); return res(); }
    const t0 = performance.now();
    (function f(t) {
      const p = Math.min(1, (t - t0) / ms);
      dot.setAttribute('cx', x1 + (x2 - x1) * p);
      p < 1 ? requestAnimationFrame(f) : res();
    })(t0);
  });
}
const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

/* ---------- Journey / stepper (shared by lesson 8 and the journey section) ---------- */
const JOURNEY_NODES = [
  { k: 'browser', t: 'المتصفح', e: 'Browser', ic: '🖥️' },
  { k: 'dns', t: 'DNS', e: 'Resolver', ic: '📖' },
  { k: 'router', t: 'الراوتر', e: 'Router', ic: '📡' },
  { k: 'isp', t: 'مزوّد الخدمة', e: 'ISP', ic: '🏢' },
  { k: 'net', t: 'الإنترنت', e: 'Internet', ic: '☁️' },
  { k: 'server', t: 'السيرفر', e: 'Server', ic: '🗄️' }
];

function mountStepper(host, steps, cfg = {}) {
  const n = JOURNEY_NODES.length, W = 760, x0 = 60, gap = (W - 2 * x0) / (n - 1);
  const xs = JOURNEY_NODES.map((_, i) => x0 + i * gap);
  let svg = '';
  for (let i = 0; i < n - 1; i++) svg += `<line x1="${xs[i]}" y1="70" x2="${xs[i + 1]}" y2="70" class="svg-line flow-line"/>`;
  JOURNEY_NODES.forEach((nd, i) => {
    svg += `<g class="jnode" data-i="${i}" opacity=".45"><rect x="${xs[i] - 40}" y="38" width="80" height="64" rx="12" class="svg-box"/><text x="${xs[i]}" y="66" text-anchor="middle" font-size="22">${nd.ic}</text>${T(xs[i], 88, nd.t, 'svg-t')}${T(xs[i], 128, nd.e, 'svg-m')}</g>`;
  });
  svg += `<circle id="jdot" cx="${xs[0]}" cy="70" r="7" fill="#22D3EE" style="filter:drop-shadow(0 0 6px #22D3EE)"/>`;
  host.innerHTML = `<svg viewBox="0 0 ${W} 140" class="journey-svg" role="img" aria-label="مخطط رحلة البيانات">${svg}</svg>
    <div class="progress-line"><span class="jfill"></span></div>
    <div class="journey-info" aria-live="polite"><div><b class="jstage"></b> <span class="muted jpct"></span></div><h4 class="jtitle"></h4><p class="jdesc"></p></div>
    <div class="controls"><button class="btn btn-ghost jprev" type="button">السابق</button><button class="btn btn-primary jnext" type="button">التالي</button><button class="btn btn-ghost jrestart" type="button">إعادة</button></div>`;
  const q = s => host.querySelector(s);
  const dot = q('#jdot');
  let i = 0, curX = xs[0];
  async function go(newI, animate = true) {
    i = Math.max(0, Math.min(steps.length - 1, newI));
    const s = steps[i], tx = xs[s.node];
    host.querySelectorAll('.jnode').forEach(g => {
      const idx = +g.dataset.i;
      const visited = steps.slice(0, i + 1).some(st => st.node === idx);
      g.setAttribute('opacity', visited ? '1' : '.45');
      g.classList.toggle('stage-active', idx === s.node);
    });
    const pct = Math.round(((i + 1) / steps.length) * 100);
    q('.jstage').textContent = 'المرحلة ' + (i + 1) + ' / ' + steps.length;
    q('.jpct').textContent = pct + '%';
    q('.jfill').style.width = pct + '%';
    q('.jtitle').textContent = s.title;
    q('.jdesc').innerHTML = s.desc;
    q('.jprev').disabled = i === 0;
    q('.jnext').disabled = i === steps.length - 1;
    if (animate) await moveDot(dot, curX, tx, 600); else dot.setAttribute('cx', tx);
    curX = tx;
  }
  q('.jnext').addEventListener('click', () => go(i + 1));
  q('.jprev').addEventListener('click', () => go(i - 1));
  q('.jrestart').addEventListener('click', () => go(0));
  go(0, false);
  return { go };
}

const LESSON8_STEPS = [
  { node: 0, title: '1) المستخدم يكتب الرابط', desc: 'كتبت <code>https://www.youtube.com/</code> في شريط العنوان وداست Enter.' },
  { node: 0, title: '2) المتصفح يحلل الـ URL', desc: 'المتصفح بيفصل الرابط: البروتوكول <code>https</code>، الدومين <code>www.youtube.com</code>، والمسار <code>/</code>.' },
  { node: 1, title: '3) DNS Resolution', desc: 'المتصفح (أو النظام) بيسأل الـ DNS Resolver: «إيه الـ IP بتاع www.youtube.com؟». لو الإجابة متخزنة (Cache) بيرد فورًا، وإلا بيسأل سيرفرات DNS تانية.' },
  { node: 0, title: '4) تأسيس الاتصال', desc: 'بعد ما عرف الـ IP، جهازك بيفتح اتصال بالسيرفر: <b>TCP</b> + <b>TLS</b> (للـ HTTP/1.1 و HTTP/2)، أو <b>QUIC</b> (للـ HTTP/3) اللي بيشتغل فوق UDP ومعاه التشفير جوّاه.' },
  { node: 2, title: '5) الراوتر يوجّه الترافيك', desc: 'الراوتر بيستقبل الـ Packets من جهازك، بيعمل NAT، ويبعتها لبوابة الـ ISP.' },
  { node: 3, title: '6) الـ ISP ينقل الترافيك', desc: 'مزوّد الخدمة (WE / Vodafone / Orange / e&) بيمرر الـ Packets عبر شبكته وشبكات تانية في اتجاه السيرفر.' },
  { node: 4, title: '7) المتصفح يبعت HTTP Request', desc: 'فوق الاتصال الآمن، المتصفح بيبعت طلب HTTP، مثلًا <code>GET /</code> مع الـ Headers.' },
  { node: 5, title: '8) السيرفر يعالج الطلب', desc: 'السيرفر (غالبًا بيكون ورا Load Balancer / CDN) بيجهز الصفحة أو البيانات المطلوبة.' },
  { node: 5, title: '9) السيرفر يرجّع HTTP Response', desc: 'بيرد بـ Status Code زي <code>200 OK</code> + Headers + Body (HTML/JSON/صور...).' },
  { node: 0, title: '10) المتصفح يعرض الصفحة', desc: 'المتصفح بيقرا الـ HTML، يطلب الملفات التانية (CSS/JS/صور)، ويرسم الصفحة قدامك.' }
];
function journeySteps(host) {
  return [
    { node: 0, title: 'المتصفح يستقبل الرابط', desc: 'المتصفح استلم <code>' + host + '</code> وبدأ يحلله.' },
    { node: 1, title: 'الـ DNS يحل الدومين', desc: 'بيتسأل الـ DNS: «إيه عنوان <code>' + host + '</code>؟» (أو بيرد من الـ Cache).' },
    { node: 0, title: 'الـ Client بيحصل على الـ IP', desc: 'وصل للمتصفح عنوان IP للسيرفر (العنوان ممكن يختلف حسب الـ DNS والـ CDN وموقعك).' },
    { node: 2, title: 'الاتصال عبر الراوتر', desc: 'جهازك بيبعت الـ Packets للراوتر (الـ Default Gateway) اللي بيعمل NAT ويوجهها للخارج.' },
    { node: 3, title: 'الـ ISP يمرر الترافيك', desc: 'مزوّد الخدمة بيوصّل الـ Packets عبر الإنترنت في اتجاه السيرفر.' },
    { node: 5, title: 'السيرفر يستقبل الطلب', desc: 'وصل الطلب (HTTP Request) للسيرفر أو للـ CDN القريب منك.' },
    { node: 5, title: 'السيرفر يعالج الطلب', desc: 'بيجهز الرد: ممكن يقرا من قاعدة بيانات أو يرجّع ملف جاهز.' },
    { node: 5, title: 'السيرفر يبعت الرد', desc: 'بيرجع HTTP Response فيه Status Code وبيانات الصفحة.' },
    { node: 0, title: 'المتصفح يعرض النتيجة', desc: 'المتصفح بيعرض الصفحة. رحلة كاملة في أجزاء من الثانية!' }
  ];
}

/* ---------- Illustration builders ---------- */
const routerImg = () => svgWrap('0 0 520 260', `
  <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a55"/><stop offset="1" stop-color="#121b2c"/></linearGradient></defs>
  <g stroke="#475569" stroke-width="10" stroke-linecap="round"><line x1="110" y1="140" x2="80" y2="30"/><line x1="200" y1="140" x2="185" y2="20"/><line x1="320" y1="140" x2="335" y2="20"/><line x1="410" y1="140" x2="440" y2="30"/></g>
  <rect x="50" y="140" width="420" height="88" rx="18" fill="url(#rg)" stroke="#22D3EE" stroke-width="2"/>
  <rect x="62" y="150" width="396" height="10" rx="5" fill="#ffffff" opacity=".06"/>
  <g>${[0, 1, 2, 3].map(i => `<rect x="${90 + i * 46}" y="180" width="34" height="28" rx="4" fill="#0b1220" stroke="#F59E0B" stroke-width="2"/>`).join('')}<rect x="290" y="180" width="34" height="28" rx="4" fill="#0b1220" stroke="#22D3EE" stroke-width="2"/></g>
  ${T(107, 222, 'LAN', 'svg-m')}${T(153, 222, 'LAN', 'svg-m')}${T(199, 222, 'LAN', 'svg-m')}${T(245, 222, 'LAN', 'svg-m')}${T(307, 222, 'WAN', 'svg-m')}
  <circle cx="370" cy="194" r="5" fill="#22C55E"><animate attributeName="opacity" values="1;.3;1" dur="1.4s" repeatCount="indefinite"/></circle>
  <circle cx="392" cy="194" r="5" fill="#22D3EE"><animate attributeName="opacity" values="1;.3;1" dur="1s" repeatCount="indefinite"/></circle>
  <circle cx="414" cy="194" r="5" fill="#F59E0B"/>
  <path d="M250 112 q20 -22 40 0 M238 100 q32 -36 64 0" stroke="#22D3EE" fill="none" stroke-width="3" opacity=".7"/>`, 'صورة توضيحية لراوتر Wi-Fi بأربع هوائيات ومنافذ LAN و WAN');

const cmdImg = () => svgWrap('0 0 560 260', `
  <rect x="20" y="16" width="520" height="228" rx="10" fill="#0c0c0c" stroke="#475569"/>
  <rect x="20" y="16" width="520" height="30" rx="10" fill="#1f2937"/><rect x="20" y="30" width="520" height="16" fill="#1f2937"/>
  <text x="36" y="37" fill="#e5e7eb" font-size="13" font-family="Fira Code">C:\\Windows\\System32\\cmd.exe</text>
  <text x="500" y="37" fill="#e5e7eb" font-size="14">— ☐ ✕</text>
  <g font-family="Fira Code" font-size="13" fill="#d1d5db">
  <text x="36" y="76">Microsoft Windows [Version 10.0.xxxxx]</text>
  <text x="36" y="96">(c) Microsoft Corporation. All rights reserved.</text>
  <text x="36" y="134">C:\\Users\\Student&gt;ipconfig</text>
  <text x="36" y="154" fill="#22D3EE">Windows IP Configuration</text>
  <text x="36" y="194">C:\\Users\\Student&gt;<tspan fill="#22D3EE">_</tspan><animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite"/></text>
  </g>`, 'رسم توضيحي لنافذة Command Prompt في ويندوز');

const dnsImg = () => svgWrap('0 0 700 230', `
  ${pc(20, 70, 'المتصفح', 'Client')}
  ${server(250, 62, 'DNS Resolver', '8.8.8.8')}
  ${cloud(480, 10, 'Root / TLD', '')}
  ${server(560, 120, 'Authoritative', 'ns.google.com')}
  ${line(90, 92, 250, 92, 'svg-line flow-line')}${line(314, 92, 500, 60, 'svg-line flow-line')}${line(314, 100, 570, 140, 'svg-line flow-line')}
  ${T(170, 82, '1) google.com؟', 'svg-m')}${T(420, 70, '2) فين؟', 'svg-m')}${T(460, 148, '3) الـ IP', 'svg-m')}
  ${T(350, 215, '4) الـ Resolver يرجّع الإجابة للمتصفح ويخزنها في Cache', 'svg-t')}`, 'مخطط يوضح خطوات حل اسم الدومين إلى IP');

const httpImg = () => svgWrap('0 0 700 200', `
  ${pc(30, 40, 'Client', 'Browser')}${server(590, 30, 'Server', 'Web')}
  <rect x="190" y="30" width="320" height="50" rx="10" class="svg-box"/>${T(350, 52, 'GET / HTTP/1.1', 'svg-m')}${T(350, 70, 'Host: www.example.com', 'svg-m')}
  <rect x="190" y="110" width="320" height="50" rx="10" class="svg-box" style="stroke:#22C55E"/>${T(350, 132, 'HTTP/1.1 200 OK', 'svg-m')}${T(350, 150, 'Content-Type: text/html', 'svg-m')}
  <path d="M110 60 H590" class="svg-line flow-line"/><path d="M590 130 H110" class="svg-line flow-line" style="stroke:#22C55E"/>
  ${packet('M110 60 H590', 3)}${packet('M590 130 H110', 3, 1.5)}
  ${T(350, 20, 'Request', 'svg-t')}${T(350, 185, 'Response', 'svg-t')}`, 'رسم يوضح طلب HTTP وردّه بين المتصفح والسيرفر');

/* ---------- Widgets ---------- */
const Widgets = {
  'net-two'(h) {
    h.innerHTML = fig(svgWrap('0 0 600 150', `${pc(70, 30, 'جهاز 1', '')}${pc(460, 30, 'جهاز 2', '')}${line(140, 53, 460, 53)}${packet('M140 53 H460', 2.4)}${packet('M460 60 H140', 2.4, 1.2)}${T(300, 44, 'كابل Ethernet', 'svg-m')}`, 'جهازان متصلان ببعض مباشرة'), 'شبكة أساسية: جهازين متوصلين وبيتبادلوا بيانات (Packets).');
  },
  'net-wired-wireless'(h) {
    const wired = `${pc(10, 40, 'PC', '')}${router(190, 52, 'Router', '')}${line(80, 63, 190, 67)}${packet('M80 63 L190 67', 2)}${T(110, 24, 'سلكي — Wired', 'svg-t')}`;
    const wl = `<g transform="translate(360 0)">${phone(10, 30, 'Mobile', '')}${router(180, 52, 'Router', '')}
      <path d="M62 48 q18 -16 36 0 M56 38 q24 -26 48 0" stroke="#22D3EE" fill="none" stroke-width="3" opacity=".8"><animate attributeName="opacity" values=".2;1;.2" dur="1.6s" repeatCount="indefinite"/></path>
      <path d="M100 65 H180" stroke="#22D3EE" stroke-dasharray="4 6" fill="none" class="flow-line"/>${T(100, 24, 'لاسلكي — Wireless', 'svg-t')}</g>`;
    h.innerHTML = fig(svgWrap('0 0 720 170', wired + wl, 'مقارنة بين شبكة سلكية ولاسلكية'), 'يمين: Wi-Fi بموجات راديو. شمال: كابل Ethernet.');
  },
  'net-interactive'(h) {
    const svg = svgWrap('0 0 700 280', `
      ${line(110, 60, 320, 125)}${line(110, 200, 320, 140)}${line(580, 60, 380, 125)}${line(580, 200, 380, 140)}
      ${router(305, 125, 'Router', '', 'router')}
      ${pc(60, 20, 'PC', '', 'pc')}${pc(60, 160, 'Laptop', '', 'laptop')}${phone(560, 20, 'Mobile', '', 'phone')}${printerSvg(550, 160, 'Printer', 'printer')}`, 'شبكة تفاعلية: دوس على أي جهاز');
    mountHotspots(h, svg, {
      router: '<b>الراوتر (Router):</b> نقطة التوصيل المركزية. بيوصّل أجهزة البيت ببعض وبالإنترنت.',
      pc: '<b>الكمبيوتر (PC):</b> غالبًا متوصل بكابل Ethernet فيكون اتصاله ثابت وسريع.',
      laptop: '<b>اللابتوب:</b> بيقدر يتصل سلكي أو Wi-Fi حسب الظروف.',
      phone: '<b>الموبايل:</b> بيتصل لاسلكيًا بـ Wi-Fi أو بشبكة المحمول (4G/5G).',
      printer: '<b>الطابعة:</b> لما تتوصل بالشبكة كل الأجهزة تقدر تطبع عليها (Shared Printer).'
    }, 'دوس على أي جهاز في الرسم تشوف شرحه.');
  },
  'uses-cards'(h) {
    const items = [
      ['📁', 'مشاركة الملفات', 'File Sharing', 'ابعت ملفات أو صور لجهاز تاني من غير فلاشة.'],
      ['🌍', 'الوصول للإنترنت', 'Internet Access', 'كل الأجهزة تقدر تتصفح عن طريق اتصال واحد.'],
      ['💬', 'التواصل', 'Communication', 'رسايل، مكالمات فيديو، إيميل.'],
      ['🖨️', 'الطابعات المشتركة', 'Shared Printers', 'طابعة واحدة لمعمل كامل.'],
      ['🎮', 'الألعاب الأونلاين', 'Online Gaming', 'لاعبين من أماكن مختلفة في نفس الماتش.'],
      ['☁️', 'الخدمات السحابية', 'Cloud Services', 'Google Drive و iCloud: ملفاتك على سيرفرات.'],
      ['🏢', 'تطبيقات الشركات', 'Business Apps', 'أنظمة الحسابات والمخازن والفروع.']
    ];
    h.innerHTML = '<div class="grid-cards">' + items.map(i => `<div class="mini-card"><span class="ico" aria-hidden="true">${i[0]}</span><h4>${i[1]} <span class="muted mono" style="font-size:.75rem">${i[2]}</span></h4><p>${i[3]}</p></div>`).join('') + '</div>';
  },
  'client-server'(h) {
    h.innerHTML = `<div class="diagram"><svg viewBox="0 0 700 200" role="img" aria-label="رسم يوضح إرسال Request من Client لـ Server ورجوع Response">
      ${pc(40, 50, 'Client', 'Browser')}${server(590, 40, 'Server', 'Web Server')}
      ${line(120, 72, 580, 72)}<circle id="csDot" cx="120" cy="72" r="8" fill="#22D3EE" opacity="0"/>
      ${T(350, 56, 'الشبكة', 'svg-m')}</svg></div>
      <div class="controls"><button class="btn btn-primary" id="csSend" type="button">Send Request</button></div>
      <div class="info-box" id="csLog" aria-live="polite">دوس <b>Send Request</b> وشوف الطلب وهو رايح للسيرفر والرد وهو راجع.</div>`;
    const btn = h.querySelector('#csSend'), dot = h.querySelector('#csDot'), log = h.querySelector('#csLog');
    btn.addEventListener('click', async () => {
      btn.disabled = true; dot.setAttribute('opacity', '1');
      dot.setAttribute('fill', '#22D3EE'); log.innerHTML = '📤 <b>Request:</b> المتصفح بيبعت <code>GET /index.html</code> للسيرفر…';
      await moveDot(dot, 120, 580, 1400);
      log.innerHTML = '⚙️ <b>السيرفر بيعالج الطلب</b> ويجهز الصفحة… <span class="loader"></span>';
      await wait(900);
      dot.setAttribute('fill', '#22C55E'); log.innerHTML = '📥 <b>Response:</b> السيرفر بيرجع <code>200 OK</code> ومعاه كود الصفحة (HTML)…';
      await moveDot(dot, 580, 120, 1400);
      dot.setAttribute('opacity', '0');
      log.innerHTML = '✅ المتصفح استلم الرد وعرض الصفحة. زي بالظبط: الزبون طلب → المطبخ جهّز → الأكل وصل.';
      btn.disabled = false;
    });
  },
  'ip-lan'(h) {
    const svg = svgWrap('0 0 700 290', `
      ${line(110, 70, 310, 140)}${line(350, 160, 350, 215)}${line(590, 70, 400, 140)}
      ${router(305, 125, 'Router', '192.168.1.1', 'router')}
      ${pc(50, 20, 'PC 1', '192.168.1.10', 'pc1')}${pc(560, 20, 'PC 2', '192.168.1.11', 'pc2')}${phone(330, 195, 'Mobile', '192.168.1.12', 'mob')}`, 'شبكة محلية بعناوين IP توضيحية');
    mountHotspots(h, svg, {
      router: '<b>Router — 192.168.1.1</b><br>ده الـ Default Gateway: بوابة الأجهزة للخروج برّه الشبكة. (عنوان توضيحي)',
      pc1: '<b>PC 1 — 192.168.1.10</b><br>جهاز له عنوان مميز في الشبكة المحلية. (عنوان توضيحي)',
      pc2: '<b>PC 2 — 192.168.1.11</b><br>نفس الشبكة لكن عنوان مختلف، عشان الراوتر يعرف يوصّل لمين. (عنوان توضيحي)',
      mob: '<b>Mobile — 192.168.1.12</b><br>الموبايل المتصل بالـ Wi-Fi بياخد عنوان من الراوتر غالبًا عن طريق DHCP. (عنوان توضيحي)'
    }, 'دوس على أي جهاز. <b>العناوين دي أمثلة توضيحية فقط</b> ومش عناوين شبكتك الحقيقية.');
  },
  'ipv4-parts'(h) {
    const parts = [['192', 'الـ Octet الأول (8 bit): 0–255'], ['168', 'الـ Octet التاني'], ['1', 'الـ Octet التالت: غالبًا بيحدد الشبكة الفرعية'], ['10', 'الـ Octet الرابع: غالبًا بيميّز الجهاز']];
    h.innerHTML = `<div class="url-demo" dir="ltr">${parts.map((p, i) => `<button class="url-part u${i}" data-i="${i}" type="button">${p[0]}</button>${i < 3 ? '<span class="muted">.</span>' : ''}`).join('')}</div><div class="info-box">IPv4 = 4 أرقام (32 bit) مفصولين بنقط، كل رقم من 0 لـ 255. دوس على رقم.</div>`;
    h.querySelectorAll('.url-part').forEach(b => b.addEventListener('click', () => { h.querySelector('.info-box').textContent = parts[b.dataset.i][1]; }));
  },
  'pubpriv'(h) {
    h.innerHTML = fig(svgWrap('0 0 700 230', `
      <rect x="10" y="20" width="300" height="190" rx="16" fill="none" stroke="#6366F1" stroke-dasharray="6 6"/>${T(160, 44, 'الشبكة الخاصة — Private', 'svg-t')}
      ${pc(30, 70, 'PC', '192.168.1.10')}${phone(130, 66, 'Mobile', '192.168.1.12')}${router(215, 90, 'Router', '', '')}
      ${line(100, 93, 215, 105)}${line(166, 96, 215, 105)}${line(305, 105, 430, 105, 'svg-line flow-line')}
      ${cloud(430, 50, 'الإنترنت', 'Public IP مثال: 203.0.113.25')}${server(590, 70, 'Server', '')}${line(520, 105, 590, 105, 'svg-line flow-line')}`, 'مخطط العناوين الخاصة والعامة'), 'جوه البيت: عناوين Private. برّه: الراوتر بيظهر بـ Public IP (مثال توضيحي).');
  },
  'nat'(h) {
    h.innerHTML = `<div class="diagram"><svg viewBox="0 0 700 250" role="img" aria-label="رسم NAT: عدة أجهزة تشارك عنوان عام واحد">
      ${pc(30, 20, 'PC 1', '192.168.1.10')}${pc(30, 150, 'PC 2', '192.168.1.11')}${phone(250, 85, 'Mobile', '192.168.1.12')}
      ${router(330, 125, 'Router + NAT', '203.0.113.25')}
      ${line(100, 43, 330, 130)}${line(100, 173, 330, 150)}${line(286, 115, 340, 135)}
      ${line(420, 140, 520, 140, 'svg-line flow-line')}${cloud(520, 90, 'Internet', '')}</svg></div>
      <p>اختار جهاز يبعت طلب وشوف الراوتر بيعمل إيه:</p>
      <div class="chips" id="natBtns"><button class="chip" data-d="0" type="button">PC 1 يبعت</button><button class="chip" data-d="1" type="button">PC 2 يبعت</button><button class="chip" data-d="2" type="button">Mobile يبعت</button></div>
      <div class="table-wrap"><table><thead><tr><th class="ltr">Private (داخلي)</th><th class="ltr">Public (خارجي)</th></tr></thead><tbody id="natBody"><tr><td colspan="2" class="muted">الجدول فاضي لسه.</td></tr></tbody></table></div>
      <div class="info-box" id="natMsg">عنوان الـ Public IP هنا <b>مثال توضيحي</b> (203.0.113.25). كل الأجهزة بتشارك نفس العنوان العام بس بأرقام Port مختلفة.</div>`;
    const devs = [['192.168.1.10', 51234], ['192.168.1.11', 51877], ['192.168.1.12', 52340]];
    const rows = {}; let next = 40001;
    h.querySelectorAll('#natBtns .chip').forEach(b => b.addEventListener('click', () => {
      const d = +b.dataset.d; const [ip, port] = devs[d];
      if (!rows[d]) rows[d] = next++;
      h.querySelector('#natBody').innerHTML = Object.keys(rows).map(k => `<tr><td class="ltr">${devs[k][0]}:${devs[k][1]}</td><td class="ltr">203.0.113.25:${rows[k]}</td></tr>`).join('');
      h.querySelector('#natMsg').innerHTML = `الراوتر بدّل <code>${ip}:${port}</code> بـ <code>203.0.113.25:${rows[d]}</code> وسجّلها في جدول NAT. لما الرد يرجع على البورت ده، بيعرف يوصّله لجهازك بالظبط.`;
    }));
  },
  'router-isp'(h) {
    const svg = svgWrap('0 0 760 170', `
      ${pc(10, 30, 'أجهزة البيت', '')}${router(165, 45, 'Router', '', 'router')}${cloud(300, 15, 'ISP', '', 'isp')}${cloud(450, 15, 'Internet', '', 'net')}${server(660, 30, 'Destination', 'Server', 'srv')}
      ${line(80, 55, 165, 60, 'svg-line flow-line')}${line(255, 60, 310, 55, 'svg-line flow-line')}${line(400, 55, 460, 55, 'svg-line flow-line')}${line(550, 55, 660, 65, 'svg-line flow-line')}
      ${packet('M80 55 L165 60 L310 55 L460 55 L660 65', 5)}`, 'مخطط: أجهزة البيت ثم الراوتر ثم ISP ثم الإنترنت ثم السيرفر');
    mountHotspots(h, svg, {
      router: '<b>Router:</b> بيوزّع الإنترنت على أجهزة البيت ويوجّه الـ Packets للخارج.',
      isp: '<b>ISP:</b> الشركة اللي بتوفرلك الاتصال بالإنترنت (WE / Vodafone / Orange / e&amp; Egypt).',
      net: '<b>Internet:</b> شبكات ضخمة كتير متوصلة ببعض عن طريق الـ ISPs.',
      srv: '<b>Destination Server:</b> السيرفر اللي عليه الموقع أو الخدمة اللي بتطلبها.'
    }, 'Home Devices → Router → ISP → Internet → Destination Server. دوس على أي مكوّن.');
  },
  'router-img'(h) { h.innerHTML = fig(routerImg(), 'صورة توضيحية لراوتر Wi-Fi: هوائيات، منافذ LAN، منفذ WAN، ولمبات الحالة.'); },
  'dns-img'(h) { h.innerHTML = fig(dnsImg(), 'خطوات حل الدومين (مبسّطة).'); },
  'dns-sim'(h) {
    h.innerHTML = `<form class="inline-form" id="dnsForm"><input type="text" id="dnsIn" dir="ltr" value="google.com" aria-label="اسم الدومين" autocomplete="off"><button class="btn btn-primary" type="submit">Resolve Domain</button></form>
      <div class="diagram"><ol id="dnsSteps" class="muted" style="padding-inline-start:1.4rem"><li>اكتب دومين واضغط Resolve.</li></ol></div>
      <div class="info-box" id="dnsRes">النتيجة هتظهر هنا.</div>`;
    const known = { 'google.com': '142.250.185.46', 'youtube.com': '142.250.185.110', 'facebook.com': '157.240.221.35', 'github.com': '140.82.121.4', 'wikipedia.org': '185.15.58.224' };
    const cache = {};
    h.querySelector('#dnsForm').addEventListener('submit', async e => {
      e.preventDefault();
      const d = h.querySelector('#dnsIn').value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
      const steps = h.querySelector('#dnsSteps'), res = h.querySelector('#dnsRes');
      if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d)) { res.textContent = 'اكتب اسم دومين صحيح زي google.com'; return; }
      const btn = h.querySelector('button[type=submit]'); btn.disabled = true;
      let ip = known[d];
      if (!ip) { let x = 0; for (const c of d) x = (x * 31 + c.charCodeAt(0)) >>> 0; ip = [34 + (x % 150), (x >> 8) % 256, (x >> 16) % 256, 1 + ((x >> 4) % 254)].join('.'); }
      const cached = !!cache[d];
      const list = cached ? [`المتصفح بيدوّر في الـ Cache عن <code>${d}</code>…`, '✔ لقاه في الـ DNS Cache! مفيش داعي يسأل حد (أسرع).']
        : [`المتصفح بيدوّر في الـ Cache عن <code>${d}</code>… مش موجود.`, 'بيسأل الـ DNS Resolver (مثلًا Google Public DNS <code>8.8.8.8</code>).', 'الـ Resolver بيسأل سيرفرات DNS (Root ← TLD ← Authoritative) لو مش عنده الإجابة.', `رجع الإجابة: <code>${d}</code> ← <code>${ip}</code> وتخزنت في الـ Cache.`];
      steps.innerHTML = '';
      for (const s of list) { const li = document.createElement('li'); li.innerHTML = s + ' <span class="loader"></span>'; steps.appendChild(li); await wait(700); li.querySelector('.loader').remove(); }
      cache[d] = ip;
      res.innerHTML = `<b>النتيجة (مثال توضيحي):</b> <code>${d}</code> → <code>${ip}</code><br>⚠️ العنوان الحقيقي ممكن يختلف حسب ردود الـ DNS و CDN وموقعك. وكمان <code>8.8.8.8</code> هو عنوان <b>سيرفر DNS</b> مش عنوان الموقع. جرّب تضغط Resolve تاني لنفس الدومين وشوف الـ Cache.`;
      btn.disabled = false;
    });
  },
  'stepper8'(h) { mountStepper(h, LESSON8_STEPS); },
  'http-viz'(h) {
    const reqLines = [
      ['GET / HTTP/1.1', '<b>Request Line:</b> الـ Method (<code>GET</code> = اطلب)، المسار (<code>/</code>)، ونسخة البروتوكول.'],
      ['Host: www.example.com', '<b>Header:</b> الموقع المطلوب (لأن سيرفر واحد ممكن يستضيف مواقع كتير).'],
      ['User-Agent: Chrome', '<b>Header:</b> بيعرّف السيرفر بنوع المتصفح/البرنامج.'],
      ['Accept: text/html', '<b>Header:</b> نوع المحتوى اللي المتصفح عايزه (هنا HTML).']
    ];
    const resLines = [
      ['HTTP/1.1 200 OK', '<b>Status Line:</b> نسخة البروتوكول + الـ Status Code + وصفه.'],
      ['Content-Type: text/html', '<b>Response Header:</b> نوع البيانات اللي في الـ Body.'],
      ['', '<b>سطر فاضي:</b> بيفصل بين الـ Headers والـ Body.'],
      ['<html>', '<b>Body:</b> المحتوى الفعلي (هنا كود HTML).'],
      ['  <body>', '<b>Body</b> (تابع).'], ['    <h1>Welcome</h1>', '<b>Body:</b> العنوان اللي هيظهر في الصفحة.'], ['  </body>', '<b>Body</b> (تابع).'], ['</html>', '<b>Body</b> (انتهى).']
    ];
    const codes = [
      [200, 'OK', 's2', 'الطلب نجح والسيرفر رجّع البيانات.'], [201, 'Created', 's2', 'اتعمل مورد جديد بنجاح (مثلًا بعد تسجيل حساب أو POST).'],
      [301, 'Moved Permanently', 's3', 'الصفحة اتنقلت لعنوان جديد بشكل دائم.'], [302, 'Found', 's3', 'تحويل مؤقت لعنوان تاني.'],
      [400, 'Bad Request', 's4', 'الطلب غلط أو مش مفهوم للسيرفر.'], [401, 'Unauthorized', 's4', 'لازم تسجّل دخول / مفيش اعتماد صحيح.'],
      [403, 'Forbidden', 's4', 'السيرفر فاهم طلبك بس ممنوع تدخل.'], [404, 'Not Found', 's4', 'المورد أو الصفحة مش موجودة.'],
      [500, 'Internal Server Error', 's5', 'حصل خطأ جوّه السيرفر.'], [503, 'Service Unavailable', 's5', 'الخدمة مش متاحة دلوقتي (زحمة أو صيانة).']
    ];
    const mk = (arr, cls) => `<pre class="code" dir="ltr">${arr.map((l, i) => `<span class="hl" data-g="${cls}" data-i="${i}" tabindex="0" role="button" style="display:block;cursor:pointer">${l[0].replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&nbsp;'}</span>`).join('')}</pre>`;
    h.innerHTML = `<div class="grid-cards" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))"><div><h4>Request</h4>${mk(reqLines, 'req')}</div><div><h4>Response</h4>${mk(resLines, 'res')}</div></div>
      <div class="info-box" id="lineInfo">دوس على أي سطر في الـ Request أو الـ Response تشوف معناه.</div>
      <h4>Status Codes (دوس على كود)</h4><div class="status-grid">${codes.map(c => `<button class="status-btn ${c[2]}" data-c="${c[0]}" type="button">${c[0]}</button>`).join('')}</div>
      <div class="info-box" id="codeInfo">اختار Status Code.</div>
      <h4>مثال على Response بصيغة JSON (غالبًا في الـ APIs)</h4>
      <pre class="code" dir="ltr">{
  "name": "Ahmed",
  "age": 17,
  "status": "success"
}</pre>`;
    h.querySelectorAll('.hl').forEach(s => {
      const show = () => { const arr = s.dataset.g === 'req' ? reqLines : resLines; h.querySelector('#lineInfo').innerHTML = arr[s.dataset.i][1]; };
      s.addEventListener('click', show); s.addEventListener('keydown', e => { if (e.key === 'Enter') show(); });
    });
    h.querySelectorAll('.status-btn').forEach(b => b.addEventListener('click', () => {
      h.querySelectorAll('.status-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
      const c = codes.find(x => x[0] == b.dataset.c);
      h.querySelector('#codeInfo').innerHTML = `<b class="mono">${c[0]} ${c[1]}</b><br>${c[3]}`;
    }));
  },
  'http-img'(h) { h.innerHTML = fig(httpImg(), 'طلب HTTP رايح وردّه راجع.'); },
  'cmd-img'(h) { h.innerHTML = fig(cmdImg(), 'شكل نافذة Command Prompt.'); },
  'ipconfig-annot'(h) {
    const f = [
      ['Wireless LAN adapter Wi-Fi:', 'اسم كارت الشبكة (Adapter). هنا كارت الـ Wi-Fi.'],
      ['IPv4 Address . . . : 192.168.1.10', '<b>IPv4 Address:</b> عنوان جهازك في الشبكة المحلية (مثال توضيحي).'],
      ['Subnet Mask . . . . : 255.255.255.0', '<b>Subnet Mask:</b> بيحدد أي جزء من العنوان هو الشبكة وأي جزء هو الجهاز. هنا الأجهزة من 192.168.1.x في نفس الشبكة.'],
      ['Default Gateway . . : 192.168.1.1', '<b>Default Gateway:</b> عنوان الراوتر، بوابة الخروج للإنترنت.']
    ];
    h.innerHTML = `<pre class="code" dir="ltr">Windows IP Configuration

${f.map((x, i) => `<span class="hl" data-i="${i}" tabindex="0" role="button" style="display:block;cursor:pointer">${i ? '   ' : ''}${x[0]}</span>`).join('')}</pre><div class="info-box">دوس على أي سطر. <b>الأرقام أمثلة توضيحية</b> مش بيانات جهازك.</div>`;
    h.querySelectorAll('.hl').forEach(s => { const sh = () => { h.querySelector('.info-box').innerHTML = f[s.dataset.i][1]; }; s.addEventListener('click', sh); s.addEventListener('keydown', e => { if (e.key === 'Enter') sh(); }); });
  },
  'term-ipconfig'(h) { Terminal.mount(h, { suggestions: ['ipconfig', 'ipconfig /all', 'help'] }); },
  'term-ping'(h) { Terminal.mount(h, { suggestions: ['ping google.com', 'ping facebook.com', 'ping youtube.com', 'ping microsoft.com', 'ping blocked.example'] }); }
};

/* ---------- Lessons ---------- */
const W = n => `<div data-widget="${n}"></div>`;
const LESSONS = [
  {
    id: 1, en: 'What is Networking?', title: 'يعني إيه شبكات؟',
    intro: 'الشبكة (Network) ببساطة هي جهازين أو أكتر متوصلين ببعض عشان يتبادلوا بيانات.',
    body: `<h3>يعني إيه شبكة كمبيوتر؟</h3>
<p>لما تبعت صورة لصاحبك على واتساب، أو تفتح فيديو على يوتيوب، جهازك بيتكلم مع أجهزة تانية. الأجهزة دي لازم تكون متوصلة ببعض بطريقة ما، والتوصيلة دي اسمها <b>شبكة (Network)</b>.</p>
<h3>ليه الأجهزة محتاجة شبكة؟</h3>
<ul><li>عشان تتبادل الملفات والرسايل.</li><li>عشان تشارك موارد زي الطابعة والإنترنت.</li><li>عشان تستخدم خدمات موجودة على أجهزة تانية (سيرفرات).</li></ul>
${W('net-two')}
<h3>الأجهزة بتتكلم مع بعض إزاي؟</h3>
<p>البيانات مابتتبعتش حاجة واحدة كبيرة؛ بتتقسم لقطع صغيرة اسمها <b>Packets</b>. كل Packet فيه عنوان المرسل وعنوان المستقبل وجزء من البيانات. الـ Packets بتتنقل عبر وسيط: كابل أو موجات راديو، وفي الآخر الجهاز المستقبل بيجمّعها ويرجّع البيانات الأصلية.</p>
<h3>شبكات سلكية (Wired) ولاسلكية (Wireless)</h3>
<ul><li><b>سلكية (Wired):</b> بكابل Ethernet. غالبًا أثبت وأقل تأثرًا بالتشويش، بس محتاجة كابلات.</li><li><b>لاسلكية (Wireless / Wi-Fi):</b> بموجات راديو. مريحة وبتدّيك حرية حركة، بس بتتأثر بالمسافة والحيطان والتداخل.</li></ul>
${W('net-wired-wireless')}
<h3>جرّب بنفسك: شبكة تفاعلية</h3>
${W('net-interactive')}`,
    analogy: 'الشبكة زي شبكة الشوارع بين البيوت: البيوت هي الأجهزة، الشوارع هي الكابلات أو الموجات، والعربيات اللي بتنقل الحاجات هي الـ Packets.',
    ex: '<b>أمثلة من حياتك:</b> شبكة الـ Wi-Fi في البيت، معمل الكمبيوتر في المدرسة، شبكة كافيه، وشبكة الموبايل (4G/5G).',
    notes: [{ t: '', h: '<b>مهم:</b> الإنترنت نفسه هو «شبكة شبكات» ضخمة، متوصلة فيها ملايين الشبكات الصغيرة.' }],
    takeaways: ['الشبكة = أجهزة متوصلة لتبادل البيانات.', 'البيانات بتتقسم لـ Packets.', 'التوصيل ممكن يكون سلكي أو لاسلكي ولكل واحد مميزاته.']
  },
  {
    id: 2, en: 'Why Are Networks Important?', title: 'ليه الشبكات مهمة؟',
    intro: 'من غير شبكات، كل جهاز هيبقى جزيرة معزولة. الشبكات هي اللي بتخلي الحاجات اللي بنستخدمها كل يوم ممكنة.',
    body: `<h3>أهم استخدامات الشبكات</h3>
<p>كل كارت تحت بيمثل استخدام حقيقي بتشوفه كل يوم:</p>${W('uses-cards')}
<h3>اشرح أكتر</h3>
<div class="accordion">
<details><summary>مشاركة الملفات (File Sharing)</summary><p>بدل ما تنقل ملف بفلاشة، بتبعته عبر الشبكة لجهاز تاني أو لمجلد مشترك.</p></details>
<details><summary>الوصول للإنترنت (Internet Access)</summary><p>راوتر واحد بيخلي كل أجهزة البيت تدخل الإنترنت في نفس الوقت.</p></details>
<details><summary>الطابعات المشتركة</summary><p>طابعة واحدة متوصلة بالشبكة تخدم المكتب كله.</p></details>
<details><summary>الألعاب الأونلاين</summary><p>جهازك بيبعت حركاتك للسيرفر والسيرفر بيوزعها على باقي اللاعبين. وقت الاستجابة (Ping) بيفرق جدًا.</p></details>
<details><summary>الخدمات السحابية (Cloud)</summary><p>ملفاتك وتطبيقاتك موجودة على سيرفرات بعيدة وبتوصلها بالشبكة من أي جهاز.</p></details>
<details><summary>تطبيقات الشركات</summary><p>فروع الشركة بتتصل بنظام واحد للحسابات والمخزون عن طريق الشبكة.</p></details>
</div>`,
    analogy: 'تخيل مدينة من غير شوارع ولا مواصلات: كل واحد قاعد في بيته ومحدش يعرف يتواصل مع حد. الشبكات هي المواصلات بتاعة العالم الرقمي.',
    ex: '<b>مثال عملي:</b> وإنت بتلعب أونلاين وفي نفس الوقت أخوك بيشوف فيديو والطابعة بتطبع، الشبكة بتخدم كله مع بعض.',
    notes: [{ t: 'ok', h: 'كل ما كانت الشبكة أحسن (سرعة واستقرار) كل الاستخدامات دي بتبقى أحسن.' }],
    takeaways: ['الشبكات بتمكّن مشاركة الملفات والطابعات والإنترنت.', 'السحابة والألعاب والشغل كلها بتعتمد على الشبكات.']
  },
  {
    id: 3, en: 'Client & Server', title: 'العميل والسيرفر (Client & Server)',
    intro: 'أغلب اللي بنعمله على الإنترنت قايم على فكرة بسيطة: طرف بيطلب (Client) وطرف بيرد (Server).',
    body: `<h3>التعريفات</h3>
<ul><li><b>Client (العميل):</b> الجهاز أو التطبيق اللي بيطلب بيانات أو خدمة. مثال: المتصفح.</li><li><b>Server (السيرفر):</b> النظام اللي بيستقبل الطلبات، يعالجها، ويرجّع ردود (Responses).</li></ul>
<h3>تشبيه المطعم</h3>
<div class="table-wrap"><table><thead><tr><th>في المطعم</th><th>في الشبكة</th></tr></thead><tbody><tr><td>الزبون</td><td>Client</td></tr><tr><td>المطبخ</td><td>Server</td></tr><tr><td>الأوردر</td><td>Request</td></tr><tr><td>الأكل</td><td>Response</td></tr></tbody></table></div>
<h3>شوفها بنفسك</h3>${W('client-server')}
<h3>مثال: متصفح بيطلب صفحة</h3>
<p>لما تفتح موقع، المتصفح (Client) بيبعت Request للسيرفر يقوله «ادّيني الصفحة الرئيسية». السيرفر بيجهز الـ HTML ويرجّعه كـ Response، والمتصفح يرسمه قدامك.</p>`,
    analogy: 'الزبون ما بيدخلش المطبخ؛ بيطلب من الجرسون والمطبخ يجهز. كذلك المتصفح ما بيدخلش جوه السيرفر؛ بيبعت طلب بس.',
    ex: '<b>أمثلة:</b> المتصفح ↔ سيرفر الموقع، تطبيق الموبايل ↔ سيرفر التطبيق، لعبة أونلاين ↔ سيرفر اللعبة.',
    notes: [{ t: '', h: 'نفس الجهاز ممكن يكون Client في موقف وServer في موقف تاني. الأدوار هي اللي بتتحدد مش الجهاز نفسه.' }],
    takeaways: ['Client بيطلب، Server بيرد.', 'الطلب = Request والرد = Response.', 'المتصفح مثال Client.']
  },
  {
    id: 4, en: 'What is an IP Address?', title: 'يعني إيه IP Address؟',
    intro: 'عشان البيانات توصل للجهاز الصح، لازم كل جهاز يبقى له عنوان. العنوان ده هو الـ IP Address.',
    body: `<h3>IP يعني إيه؟</h3>
<p><b>IP = Internet Protocol</b>، وهو مجموعة قواعد لتحديد العناوين وتوجيه البيانات. أما <b>IP Address</b> فهو رقم بيعرّف الجهاز على الشبكة، زي عنوان بيتك بالظبط.</p>
<h3>ليه الأجهزة محتاجة IP؟</h3>
<p>لما جهاز يبعت Packet، لازم يكتب فيها «من مين» و«لمين». من غير عناوين، الراوتر ماكانش هيعرف يوصّل الـ Packet لأي جهاز.</p>
<h3>شكل IPv4</h3>
<p>عنوان IPv4 مكوّن من <b>4 أرقام</b> مفصولة بنقط، كل رقم من 0 لـ 255 (يعني 32 bit). مثال: <code>192.168.1.10</code>.</p>${W('ipv4-parts')}
<h3>العناوين في الشبكة المحلية</h3>
<p>الأجهزة اللي على نفس الشبكة المحلية بيبقى ليها عناوين محلية <b>مختلفة</b> (مينفعش جهازين بنفس العنوان في نفس الشبكة، وإلا يحصل تعارض). الراوتر غالبًا بيدّي العناوين دي أوتوماتيك عن طريق DHCP.</p>
${W('ip-lan')}
<div class="note warn"><b>تنبيه:</b> العناوين اللي في الرسم (192.168.1.x) <b>أمثلة توضيحية</b>. عنوانك الحقيقي ممكن يكون مختلف.</div>`,
    analogy: 'الـ IP Address زي رقم الشقة في العمارة: لازم كل شقة يكون ليها رقم مختلف عشان ساعي البريد يعرف يوصّل.',
    ex: '<b>مثال:</b> الراوتر <code>192.168.1.1</code>، PC 1 هو <code>192.168.1.10</code>، PC 2 هو <code>192.168.1.11</code>، والموبايل <code>192.168.1.12</code> (أمثلة توضيحية).',
    notes: [{ t: '', h: 'في كمان IPv6 بعناوين أطول (128 bit) عشان عناوين IPv4 ما بقتش كافية للعالم كله.' }],
    takeaways: ['IP Address = عنوان الجهاز على الشبكة.', 'IPv4 = 4 أرقام من 0 لـ 255.', 'كل جهاز في الشبكة المحلية له عنوان مختلف.']
  },
  {
    id: 5, en: 'Private IP vs Public IP', title: 'Private IP مقابل Public IP',
    intro: 'مش كل عناوين الـ IP زي بعض. في عناوين بتشتغل جوه شبكتك بس، وعناوين بتتعرف على الإنترنت.',
    body: `<h3>الفرق</h3>
<ul><li><b>Private IP:</b> عنوان بيُستخدم جوه الشبكات المحلية فقط، وماينفعش يتوجه مباشرة على الإنترنت العام.</li><li><b>Public IP:</b> عنوان قابل للتوجيه عالميًا (Globally Routable) وبيُستخدم في الاتصال عبر الإنترنت.</li></ul>
<h3>النطاقات الخاصة (Private IPv4 Ranges)</h3>
<div class="table-wrap"><table><thead><tr><th class="ltr">Range</th><th>ملاحظات</th></tr></thead><tbody>
<tr><td class="ltr">10.0.0.0/8</td><td>من 10.0.0.0 إلى 10.255.255.255</td></tr>
<tr><td class="ltr">172.16.0.0/12</td><td>من 172.16.0.0 إلى 172.31.255.255</td></tr>
<tr><td class="ltr">192.168.0.0/16</td><td>الأشهر في البيوت</td></tr></tbody></table></div>
${W('pubpriv')}
<h3>NAT بالبساطة</h3>
<p><b>NAT (Network Address Translation)</b> هي خدمة في الراوتر بتخلي أجهزة كتير بعناوين خاصة تستخدم عنوان عام واحد للخروج للإنترنت. الراوتر بيحتفظ بجدول بيربط كل اتصال بالجهاز اللي بدأه، فلما الرد يرجع بيعرف يوصّله لصاحبه.</p>
${W('nat')}
<div class="note warn"><b>مهم:</b> مش كل بيت ليه Public IP مخصص على الراوتر. بعض مزودي الخدمة بيستخدموا <b>CGNAT (Carrier-Grade NAT)</b> وفيه عملاء كتير بيتشاركوا نفس العنوان العام، والعنوان على راوترك ممكن يكون هو نفسه عنوان خاص من الـ ISP.</div>`,
    analogy: 'العمارة ليها عنوان شارع عام (Public IP)، وكل شقة جواها ليها رقم (Private IP). الناس برّه بتعرف العمارة بس، والبواب (الراوتر/NAT) هو اللي بيوصّل الطلبات للشقة الصح.',
    ex: '<b>تمرين سريع:</b> هل <code>172.20.5.4</code> Private؟ أيوه، لأنه جوه 172.16.0.0/12 (من 172.16 لـ 172.31). وهل <code>172.40.5.4</code>؟ لأ.',
    notes: [{ t: '', h: 'العناوين العامة في الأمثلة هنا (زي 203.0.113.25) مخصصة للتوضيح فقط.' }],
    takeaways: ['Private للشبكات الداخلية، Public للإنترنت.', 'النطاقات الخاصة: 10/8 و 172.16/12 و 192.168/16.', 'NAT بيخلي أجهزة كتير تشارك Public IP؛ وفيه كمان CGNAT عند بعض الـ ISPs.']
  },
  {
    id: 6, en: 'Router & ISP', title: 'الراوتر ومزوّد الخدمة (Router & ISP)',
    intro: 'الراوتر والـ ISP هما الجسر بين بيتك وباقي العالم.',
    body: `<h3>إيه هو الراوتر (Router)؟</h3>
<p>جهاز بيوصّل شبكتك الداخلية بشبكات تانية (زي الإنترنت) وبيقرر الـ Packets تروح فين. أغلب راوترات البيوت بتجمع كذا وظيفة: Router + Wi-Fi Access Point + Switch صغير + DHCP + NAT.</p>
${W('router-img')}
<h3>الراوتر بيشتغل إزاي؟</h3>
<ol><li>بيستقبل الـ Packet من جهازك.</li><li>بيبص على عنوان الوجهة.</li><li>لو الوجهة جوه الشبكة المحلية يوصّلها مباشرة، ولو برّه يبعتها لبوابة الـ ISP.</li><li>بيعمل NAT للعناوين الخاصة.</li></ol>
<h3>إيه هو الـ ISP؟</h3>
<p><b>ISP = Internet Service Provider</b>، الشركة اللي بتوفرلك الاتصال بالإنترنت. في مصر أمثلة: <b>WE</b> و <b>Vodafone</b> و <b>Orange</b> و <b>e&amp; Egypt</b>.</p>
<h3>العلاقة بين الراوتر والـ ISP</h3>
<p>الراوتر بتاعك بيتوصل بخط الـ ISP (كابل نحاس أو ألياف ضوئية Fiber)، والـ ISP بيوصّلك بباقي الإنترنت.</p>
<h3>رحلة الداتا من البيت</h3>${W('router-isp')}`,
    analogy: 'الراوتر زي البوابة الرئيسية للكومباوند، والـ ISP زي الطريق السريع اللي بيوصّلك بباقي المدن.',
    ex: '<b>مثال:</b> لما بتفتح موقع، الـ Packet بتمشي: موبايلك ← الراوتر ← ISP (WE مثلًا) ← الإنترنت ← سيرفر الموقع.',
    notes: [{ t: 'ok', h: 'الراوتر ممكن يكون هو الـ Default Gateway اللي بتشوفه في أمر ipconfig.' }],
    takeaways: ['الراوتر بيوجّه البيانات بين شبكتك والإنترنت.', 'الـ ISP بيوفر الاتصال بالإنترنت.', 'مسار: أجهزة ← Router ← ISP ← Internet ← Server.']
  },
  {
    id: 7, en: 'DNS', title: 'الـ DNS: دليل تليفونات الإنترنت',
    intro: 'إحنا بنفتكر أسماء زي google.com، لكن الأجهزة بتتعامل بالأرقام (IP). الـ DNS هو اللي بيترجم.',
    body: `<h3>DNS يعني إيه؟</h3>
<p><b>DNS = Domain Name System</b>. وظيفته إنه يحوّل <b>اسم الدومين</b> (زي <code>google.com</code>) لـ <b>IP Address</b>.</p>
<h3>المصطلحات</h3>
<ul><li><b>Domain Name:</b> الاسم اللي بتكتبه (google.com).</li><li><b>DNS Resolver:</b> الخدمة اللي بتسأل بالنيابة عنك وبترجع الإجابة (غالبًا بتاعة الـ ISP أو عامة زي 8.8.8.8).</li><li><b>DNS Server:</b> سيرفرات بتحتفظ ببيانات الأسماء والعناوين.</li><li><b>DNS Lookup:</b> عملية السؤال نفسها.</li><li><b>DNS Caching:</b> تخزين الإجابات مؤقتًا عشان الرد يبقى أسرع في المرة الجاية.</li></ul>
${W('dns-img')}
<h3>جرّب محاكي DNS</h3>${W('dns-sim')}
<div class="note warn"><b>لا تخلط:</b> <code>8.8.8.8</code> هو عنوان <b>DNS Server</b> (Google Public DNS)، مش عنوان موقع Google. الموقع له عنوان تاني مختلف، وممكن يتغير حسب الـ DNS والـ CDN وموقعك.</div>`,
    analogy: 'الـ DNS زي دليل التليفونات: إنت بتدوّر على اسم «أحمد» والدليل بيدّيك رقمه. كمان بتحفظ الأرقام اللي بتتصل بيها كتير (Cache) عشان ماتدورش كل مرة.',
    ex: '<b>مثال:</b> <code>google.com</code> ← الـ DNS ← عنوان IP زي <code>142.250.x.x</code> (مثال توضيحي).',
    notes: [{ t: '', h: 'لو الـ DNS بايظ الإنترنت ممكن «يبان» واقع رغم إن الاتصال شغال، لأن المتصفح مش قادر يعرف عناوين المواقع.' }],
    takeaways: ['DNS بيحوّل الاسم لـ IP.', 'Resolver بيسأل بالنيابة عنك، والـ Cache بيسرّع.', 'عنوان DNS Server غير عنوان الموقع.']
  },
  {
    id: 8, en: 'How Client Requests Reach Servers', title: 'إزاي طلب المتصفح بيوصل للسيرفر؟',
    intro: 'هنمشي مع رحلة فتح <code>https://www.youtube.com/</code> خطوة بخطوة.',
    body: `<h3>الخطوات العشرة</h3>
<ol><li>المستخدم يكتب الرابط.</li><li>المتصفح يحلل الرابط.</li><li>يحصل DNS Resolution.</li><li>الجهاز يؤسس اتصال.</li><li>الراوتر يوجّه الترافيك.</li><li>الـ ISP ينقل الترافيك ناحية الوجهة.</li><li>المتصفح يبعت HTTP Request.</li><li>السيرفر يعالج الطلب.</li><li>السيرفر يرجّع HTTP Response.</li><li>المتصفح يعرض الصفحة.</li></ol>
${W('stepper8')}
<h3>TCP و TLS و QUIC (مقدمة)</h3>
<ul><li><b>TCP:</b> بروتوكول بيضمن توصيل البيانات بالترتيب وبدون ضياع (بيعمل اتصال وإعادة إرسال).</li><li><b>TLS:</b> طبقة التشفير اللي بتخلي الاتصال آمن (HTTPS = HTTP فوق TLS).</li><li><b>QUIC:</b> بروتوكول حديث بيشتغل فوق <b>UDP</b> وبيدمج التشفير جواه، وهو اللي بيستخدمه <b>HTTP/3</b>.</li></ul>
<div class="note warn"><b>مهم:</b> مش كل اتصال HTTPS بيستخدم TCP؛ HTTP/1.1 و HTTP/2 بيستخدموا TCP + TLS، أما HTTP/3 فبيستخدم QUIC.</div>`,
    analogy: 'زي ما تروح تطلب من مكتبة بعيدة: بتعرف العنوان الأول (DNS)، تتصل (اتصال آمن)، تطلب الكتاب (Request)، وتستلمه (Response).',
    ex: '<b>جرّب:</b> اضغط «التالي» وشوف المرحلة بتتحرك بين المتصفح والـ DNS والراوتر والـ ISP والسيرفر.',
    notes: [{ t: '', h: 'في الواقع الخطوات بتحصل في أجزاء من الثانية وبتتداخل أحيانًا (مثلًا الـ Cache بيخلّي DNS يتخطى).' }],
    takeaways: ['فتح موقع = DNS + اتصال آمن + Request + Response.', 'TCP+TLS للـ HTTP/1.1 و 2، QUIC للـ HTTP/3.']
  },
  {
    id: 9, en: 'HTTP Request & Response', title: 'طلب ورد HTTP',
    intro: 'HTTP هو «لغة الكلام» بين المتصفح والسيرفر.',
    body: `<h3>شكل الـ Request والـ Response</h3>
<p>دوس على أي سطر تشوف شرحه:</p>${W('http-viz')}
${W('http-img')}
<h3>الأجزاء</h3>
<ul><li><b>HTTP Methods:</b> <code>GET</code> (اقرا)، <code>POST</code> (ابعت/أنشئ)، <code>PUT</code> (حدّث/استبدل)، <code>DELETE</code> (احذف).</li><li><b>Request Headers:</b> معلومات إضافية عن الطلب (Host, User-Agent, Accept…).</li><li><b>Response Headers:</b> معلومات عن الرد (Content-Type…).</li><li><b>Response Body:</b> المحتوى الفعلي.</li><li><b>Status Codes:</b> أرقام بتلخص نتيجة الطلب: 2xx نجاح، 3xx تحويل، 4xx خطأ من العميل، 5xx خطأ من السيرفر.</li></ul>
<h3>JSON و APIs</h3>
<p>الـ APIs غالبًا بترجّع <b>JSON</b> بدل HTML. تطبيق الموبايل بياخد الـ JSON ويعرضه بطريقته.</p>`,
    analogy: 'الـ HTTP زي ورقة طلب في المطعم: فيها نوع الطلب (Method)، تفاصيل (Headers)، ورد الجرسون فيه حالة الطلب (Status) والأكل (Body).',
    ex: '<b>مثال:</b> لو كتبت رابط غلط هتشوف <code>404 Not Found</code>. لو السيرفر وقع هتشوف <code>500</code> أو <code>503</code>.',
    notes: [{ t: '', h: 'الـ Status Code بيتعمل بواسطة السيرفر؛ والمتصفح بيعرض صفحة مناسبة له.' }],
    takeaways: ['Request: Method + Path + Headers.', 'Response: Status + Headers + Body.', 'APIs بترجّع JSON غالبًا.']
  },
  {
    id: 10, en: 'CMD / Command Prompt', title: 'سطر الأوامر CMD',
    intro: 'CMD هو برنامج في ويندوز بتكتب فيه أوامر نصية بدل ما تدوس على أيقونات.',
    body: `<h3>يعني إيه CMD؟</h3>
<p><b>Command Prompt (CMD)</b> واجهة نصية بتخليك تنفذ أوامر مباشرة على النظام.</p>
<h3>ليه المبرمجين والشبكات بيستخدموه؟</h3>
<ul><li>أسرع في المهام المتكررة والأتمتة.</li><li>بيدّيك معلومات دقيقة عن الشبكة (IP, DNS, Gateway).</li><li>بيساعد في اكتشاف المشاكل (Troubleshooting) باستخدام أوامر زي <code>ping</code> و <code>ipconfig</code>.</li></ul>
<h3>إزاي تفتحه في ويندوز؟</h3>
<p><b>الطريقة 1:</b> اضغط زر <code>Windows</code> ← اكتب <code>cmd</code> ← اضغط <code>Enter</code>.</p>
<p><b>الطريقة 2:</b> اضغط <code>Windows + R</code> ← اكتب <code>cmd</code> ← اضغط <code>Enter</code>.</p>
${W('cmd-img')}`,
    analogy: 'بدل ما تفتح كل الأدراج بإيدك، بتكتب لمساعد ذكي: «هاتلي معلومات الشبكة».',
    ex: '<b>جرّب:</b> افتح CMD على جهازك واكتب <code>ipconfig</code> (هنشرحه في الدرس الجاي).',
    notes: [{ t: 'warn', h: 'ماتنفذش أي أمر مش فاهمه. الأوامر الشبكية اللي هنتعلمها آمنة وللقراءة فقط.' }],
    takeaways: ['CMD = واجهة نصية لتنفيذ الأوامر.', 'الفتح: Windows ← cmd ← Enter، أو Windows+R.']
  },
  {
    id: 11, en: 'ipconfig', title: 'أمر ipconfig',
    intro: 'ipconfig بيعرض إعدادات الـ IP للجهاز: عنوانك وبوابتك والـ DNS.',
    body: `<h3>الاستخدام الأساسي</h3>
<p>اكتب <code>ipconfig</code> واضغط Enter. شكل مخرجات توضيحي:</p>${W('ipconfig-annot')}
<h3>شرح الحقول</h3>
<ul><li><b>IPv4 Address:</b> عنوان جهازك في الشبكة المحلية.</li><li><b>Subnet Mask:</b> بيحدد حدود الشبكة المحلية.</li><li><b>Default Gateway:</b> عنوان الراوتر، مكان خروج الداتا للإنترنت.</li></ul>
<h3>ipconfig /all</h3>
<p>بيعرض تفاصيل أكتر، منها:</p>
<ul><li><b>Physical Address (MAC):</b> عنوان فريد لكارت الشبكة.</li><li><b>DHCP Server:</b> الجهاز (غالبًا الراوتر) اللي بدّاك العنوان أوتوماتيك.</li><li><b>DNS Servers:</b> السيرفرات اللي بتسألها عن الدومينات.</li><li><b>IPv4 Address</b> و <b>Default Gateway</b>.</li></ul>
<h3>جرّب المحاكي</h3>${W('term-ipconfig')}
<div class="note warn"><b>تنبيه:</b> ده <b>محاكي تعليمي</b>. الأرقام اللي بتظهر فيه أمثلة وليست عنوان IP الحقيقي بتاعك. عشان تشوف بياناتك الحقيقية نفّذ الأمر في CMD على جهازك.</div>`,
    analogy: 'ipconfig زي بطاقة التعريف بتاعة جهازك على الشبكة: بتقولك عنوانك وبوابة الخروج.',
    ex: '<b>مثال:</b> لو الـ IPv4 هو <code>192.168.1.10</code> والـ Gateway هو <code>192.168.1.1</code>، يبقى جهازك متوصل براوتر عنوانه 192.168.1.1.',
    notes: [{ t: '', h: 'ماتشاركش عنوان الـ MAC أو بيانات شبكتك بشكل عام مع غرباء. سجّل في الواجب العناوين الخاصة بالتمرين فقط.' }],
    takeaways: ['ipconfig = عرض إعدادات الـ IP.', 'ipconfig /all = تفاصيل أكتر (MAC, DHCP, DNS).', 'المحاكي مش بيعرض بيانات جهازك.']
  },
  {
    id: 12, en: 'ping google.com', title: 'أمر ping',
    intro: 'ping بيجرّب «هل أقدر أوصل للجهاز ده؟ وبسرعة قد إيه؟».',
    body: `<h3>الاستخدام</h3>
<p>اكتب <code>ping google.com</code>. مثال توضيحي للمخرجات:</p>
<pre class="code" dir="ltr">Pinging google.com [142.250.x.x] with 32 bytes of data:

Reply from 142.250.x.x: bytes=32 time=20ms TTL=115</pre>
<h3>إيه اللي بيحصل ورا الستار؟</h3>
<ul><li><b>DNS Resolution:</b> الأول بيتحول <code>google.com</code> لـ IP.</li><li><b>ICMP Echo Request:</b> جهازك بيبعت رسالة «إنت موجود؟».</li><li><b>ICMP Echo Reply:</b> الطرف التاني بيرد «أيوه».</li></ul>
<h3>معنى القيم</h3>
<ul><li><b>bytes=32:</b> حجم البيانات المبعوتة.</li><li><b>time=20ms:</b> زمن الرحلة ذهابًا وإيابًا بالمللي ثانية، كل ما قل كان أحسن.</li><li><b>TTL:</b> عدد القفزات (Hops) المسموحة قبل ما الـ Packet يتلغي.</li><li><b>Request timed out:</b> مفيش رد جه في الوقت المحدد.</li></ul>
<div class="note warn"><b>ملاحظات:</b> عناوين Google ممكن تتغير. وبعض السيرفرات بتمنع ICMP، فممكن تلاقي «Request timed out» حتى لو الموقع شغال في المتصفح.</div>
<h3>جرّب المحاكي</h3>${W('term-ping')}
<div class="note warn">المحاكي <b>مش بيعمل اتصالات حقيقية</b>؛ كل الردود والعناوين أمثلة توضيحية. جرّب <code>ping blocked.example</code> عشان تشوف شكل Request timed out.</div>`,
    analogy: 'ping زي ما تنادي على صاحبك في الشارع وتقيس بعد قد إيه رد عليك.',
    ex: '<b>مثال:</b> time=20ms يعني الرد جه بعد 20 جزء من الألف من الثانية. اتحقق من 10 دومينات في الواجب.',
    notes: [{ t: '', h: 'ping مش بيقيس سرعة التحميل، بيقيس زمن الاستجابة (Latency) بس.' }],
    takeaways: ['ping بيستخدم ICMP Echo Request/Reply.', 'time = زمن الاستجابة، TTL = عدد القفزات.', 'Request timed out مش دايمًا معناها إن الموقع واقع.']
  }
];

/* tasks.js — homework (3 tasks), localStorage persistence, JSON export, print */
const Tasks = (() => {
  const KEY = 'netcourse:hw:v1';
  const COMPANIES = [
    ['Google', 'google.com'], ['Facebook (Meta)', 'facebook.com'], ['YouTube', 'youtube.com'],
    ['Microsoft', 'microsoft.com'], ['Amazon', 'amazon.com'], ['Apple', 'apple.com'],
    ['Netflix', 'netflix.com'], ['Wikipedia', 'wikipedia.org'], ['Cloudflare', 'cloudflare.com'], ['GitHub', 'github.com']
  ];
  const QUESTIONS = [
    'ليه ممكن نفس الدومين يرجّع عناوين IP مختلفة؟',
    'ليه ممكن أجهزة كتير تشارك نفس الـ Public IP؟',
    'الـ DNS بيعمل إيه؟',
    'إيه الفرق بين Private IP و Public IP؟',
    'ليه HTTPS أأمن من HTTP؟'
  ];
  const SUGGEST = ['bbc.com', 'nasa.gov', 'spotify.com', 'linkedin.com', 'reddit.com', 'stackoverflow.com', 'mozilla.org', 'adobe.com', 'samsung.com', 'openai.com', 'twitch.tv', 'cloudflare.com'];
  const DOMAIN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
  function normDomain(v) { return (v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, ''); }
  function validDomain(v) { return DOMAIN.test(normDomain(v)); }
  let data = { name: '', t1: { ipv4: '', gateway: '', mask: '', isPrivate: '', note: '' }, t2: {}, t3: [], t4: [], final: '' };

  const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  function validIp(s) { return IPV4.test((s || '').trim()); }
  function privateRange(ip) {
    if (!validIp(ip)) return null;
    const [a, b] = ip.trim().split('.').map(Number);
    if (a === 10) return '10.0.0.0/8';
    if (a === 172 && b >= 16 && b <= 31) return '172.16.0.0/12';
    if (a === 192 && b === 168) return '192.168.0.0/16';
    return false;
  }

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); data = Object.assign(data, d); } } catch (e) { /* ignore */ }
    COMPANIES.forEach(c => { if (!data.t2[c[1]]) data.t2[c[1]] = { ip: '', note: '' }; });
    while (data.t3.length < QUESTIONS.length) data.t3.push('');
    if (!Array.isArray(data.t4)) data.t4 = [];
    while (data.t4.length < 10) data.t4.push({ domain: '', ip: '', country: '', note: '' });
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    const s = status();
    Progress.setHw(s);
    const st = document.getElementById('saveState');
    if (st) st.textContent = 'تم الحفظ تلقائيًا في المتصفح ✓';
  }
  function t1Done() { return validIp(data.t1.ipv4) && validIp(data.t1.gateway) && data.t1.isPrivate !== ''; }
  function t2Count() { return COMPANIES.filter(c => validIp(data.t2[c[1]].ip)).length; }
  function t4Count() { return data.t4.filter(r => validDomain(r.domain) && validIp(r.ip)).length; }
  function t4Dup() { const seen = {}; let dup = false; data.t4.forEach(r => { const d = normDomain(r.domain); if (!d) return; if (seen[d]) dup = true; seen[d] = 1; }); return dup; }
  function t3Count() { return data.t3.filter(a => a.trim().length >= 5).length; }
  function status() {
    const any = t1Done() || t2Count() > 0 || t3Count() > 0 || t4Count() > 0 || data.final.trim();
    if (!any) return 'none';
    return (t1Done() && t2Count() === COMPANIES.length && t3Count() === QUESTIONS.length && t4Count() === 10 && !t4Dup()) ? 'done' : 'partial';
  }

  function mount(box) {
    load();
    box.innerHTML = `
      <div class="task">
        <label for="hwName">اسمك (اختياري — ماتكتبش بيانات حساسة)</label>
        <input type="text" id="hwName" maxlength="60" autocomplete="off">
      </div>

      <div class="task" id="task1">
        <h3>Task 1: اكتشف الـ IP المحلي بتاعك <span class="tag no" id="tag1">لم يكتمل</span></h3>
        <ol>
          <li>افتح CMD (Windows ← اكتب <code>cmd</code> ← Enter).</li>
          <li>نفّذ الأمر <code>ipconfig</code>.</li>
          <li>دوّر على <code>IPv4 Address</code>.</li>
          <li>دوّر على <code>Default Gateway</code>.</li>
          <li>حدد: هل الـ IPv4 ده بيقع في نطاق Private؟</li>
        </ol>
        <div class="field-grid">
          <div class="field"><label for="t1ip">IPv4 Address</label><input type="text" id="t1ip" dir="ltr" placeholder="مثال: 192.168.1.10" autocomplete="off"><small class="muted" id="t1ipMsg"></small></div>
          <div class="field"><label for="t1mask">Subnet Mask (اختياري)</label><input type="text" id="t1mask" dir="ltr" placeholder="255.255.255.0" autocomplete="off"></div>
          <div class="field"><label for="t1gw">Default Gateway</label><input type="text" id="t1gw" dir="ltr" placeholder="مثال: 192.168.1.1" autocomplete="off"><small class="muted" id="t1gwMsg"></small></div>
          <div class="field"><label for="t1priv">هل هو Private IP؟</label>
            <select id="t1priv"><option value="">اختار</option><option value="yes">نعم</option><option value="no">لا</option></select>
            <small class="muted" id="t1privMsg"></small></div>
        </div>
        <label for="t1note">ملاحظات</label>
        <textarea id="t1note" placeholder="اكتب أي ملاحظة (مثلًا: شكل الـ IP بيتغير ولا لأ؟)"></textarea>
        <p class="muted">النطاقات الخاصة: <code>10.0.0.0/8</code> — <code>172.16.0.0/12</code> — <code>192.168.0.0/16</code>. لو الراوتر بتاعك بيدّي IP من خارجهم ممكن يكون CGNAT أو إعداد خاص؛ اكتب ملاحظة.</p>
      </div>

      <div class="task" id="task2">
        <h3>Task 2: عناوين IP لـ 10 شركات مشهورة <span class="tag no" id="tag2">0/10</span></h3>
        <p>في CMD نفّذ <code>ping domain</code> لكل دومين (مثلًا <code>ping google.com</code>) وسجّل الـ IP اللي ظهر عندك. ممكن يختلف عن زمايلك وده طبيعي (DNS / CDN / الموقع).</p>
        <div class="table-wrap"><table>
          <thead><tr><th>الشركة</th><th class="ltr">Domain</th><th class="ltr">IP Address (من عندك)</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
          <tbody id="t2Body"></tbody></table></div>
      </div>

      <div class="task" id="task3">
        <h3>Task 3: فهم النتايج <span class="tag no" id="tag3">0/5</span></h3>
        <div id="t3Body"></div>
      </div>

      <div class="task" id="task4">
        <h3>Task 4 (إضافي): اكتشف عناوين IP لـ 10 مواقع عالمية من اختيارك <span class="tag no" id="tag4">0/10</span></h3>
        <p>المرة دي <b>إنت اللي بتختار</b> المواقع! اختار <b>10 مواقع عالمية مختلفة</b> (مش اللي في Task 2) وهات الـ IP بتاع كل واحد باستخدام <code>ping</code> في CMD.</p>
        <ol>
          <li>اكتب في CMD: <code>ping اسم-الموقع</code> (مثال: <code>ping bbc.com</code>).</li>
          <li>الـ IP بيظهر في أول سطر بين الأقواس: <code>Pinging bbc.com [151.101.x.x]</code> — حتى لو ظهرت <code>Request timed out</code> (ساعتها الموقع بيمنع ping بس الـ IP بيظهر برضه).</li>
          <li>لو ظهر عنوان طويل فيه <code>:</code> يبقى IPv6، جرّب <code>ping -4 اسم-الموقع</code> عشان تاخد IPv4.</li>
          <li>اكتب الدومين والـ IP والبلد/الشركة المتوقعة (اختياري) وأي ملاحظة (زي زمن الاستجابة time).</li>
        </ol>
        <p class="muted">أفكار لو محتار (اضغط تضيفه في أول خانة فاضية):</p>
        <div class="chips" dir="ltr" id="t4Sugg"></div>
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th class="ltr">Domain</th><th class="ltr">IP Address</th><th>البلد / الشركة (اختياري)</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
          <tbody id="t4Body"></tbody></table></div>
        <small class="muted" id="t4Msg"></small>
        <div class="note ok no-print"><b>سؤال للتفكير:</b> لو عملت ping لنفس الموقع من موبايلك بشبكة المحمول، هل هيطلع نفس الـ IP؟ اكتب ملاحظتك في خانة الملاحظات.</div>
      </div>

      <div class="task" id="taskFinal">
        <h3>التسليم النهائي</h3>
        <label for="finalNote">ملخص أو ملاحظة ختامية للمدرّس</label>
        <textarea id="finalNote" placeholder="إيه أكتر حاجة اتعلمتها؟ وإيه اللي محتاج توضيح؟"></textarea>
        <p class="save-state" id="saveState">كل إجاباتك بتتحفظ تلقائيًا في المتصفح.</p>
        <div class="controls no-print">
          <button class="btn btn-primary" id="exportBtn">تصدير الإجابات (JSON)</button>
          <button class="btn btn-ghost" id="printBtn">طباعة ملخص الواجب</button>
          <button class="btn btn-ghost" id="clearBtn">مسح الإجابات</button>
        </div>
        <p class="muted" id="hwStatus"></p>
      </div>`;

    const $ = id => box.querySelector('#' + id);

    // Task 1
    $('hwName').value = data.name;
    $('t1ip').value = data.t1.ipv4; $('t1mask').value = data.t1.mask || ''; $('t1gw').value = data.t1.gateway;
    $('t1priv').value = data.t1.isPrivate; $('t1note').value = data.t1.note;

    // Task 2 rows
    const tb = $('t2Body');
    COMPANIES.forEach(([name, dom]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td></td><td class="ltr"></td><td><input type="text" dir="ltr" autocomplete="off" aria-label="IP"></td><td><span class="tag no">ناقص</span></td><td><input type="text" aria-label="ملاحظات"></td>`;
      tr.children[0].textContent = name; tr.children[1].textContent = dom;
      const ip = tr.children[2].firstChild, note = tr.children[4].firstChild, tag = tr.children[3].firstChild;
      ip.value = data.t2[dom].ip; note.value = data.t2[dom].note;
      ip.setAttribute('aria-label', 'IP ' + dom); note.setAttribute('aria-label', 'ملاحظات ' + dom);
      const upd = () => { const ok = validIp(ip.value); tag.className = 'tag ' + (ok ? 'ok' : 'no'); tag.textContent = ok ? 'مكتمل' : (ip.value.trim() ? 'IP غير صالح' : 'ناقص'); };
      ip.addEventListener('input', () => { data.t2[dom].ip = ip.value.trim(); upd(); refresh(); save(); });
      note.addEventListener('input', () => { data.t2[dom].note = note.value; save(); });
      upd(); tb.appendChild(tr);
    });

    // Task 4
    const t4b = $('t4Body');
    data.t4.slice(0, 10).forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td><input type="text" dir="ltr" autocomplete="off" class="t4d"></td><td><input type="text" dir="ltr" autocomplete="off" class="t4i"></td><td><input type="text" class="t4c"></td><td><span class="tag no">ناقص</span></td><td><input type="text" class="t4n"></td>';
      tr.children[0].textContent = String(i + 1);
      const d = tr.querySelector('.t4d'), ip = tr.querySelector('.t4i'), co = tr.querySelector('.t4c'), nt = tr.querySelector('.t4n'), tag = tr.querySelector('.tag');
      d.value = row.domain; ip.value = row.ip; co.value = row.country || ''; nt.value = row.note || '';
      d.setAttribute('aria-label', 'دومين ' + (i + 1)); ip.setAttribute('aria-label', 'IP ' + (i + 1)); co.setAttribute('aria-label', 'البلد ' + (i + 1)); nt.setAttribute('aria-label', 'ملاحظات ' + (i + 1));
      d.placeholder = 'example.com'; ip.placeholder = '93.184.x.x';
      const upd = () => {
        const dv = validDomain(d.value), iv = validIp(ip.value);
        tag.className = 'tag ' + (dv && iv ? 'ok' : 'no');
        tag.textContent = dv && iv ? 'مكتمل' : (d.value.trim() && !dv ? 'دومين غير صالح' : (ip.value.trim() && !iv ? 'IP غير صالح' : 'ناقص'));
      };
      const sync = () => { data.t4[i] = { domain: d.value.trim(), ip: ip.value.trim(), country: co.value, note: nt.value }; upd(); refresh(); save(); };
      [d, ip, co, nt].forEach(x => x.addEventListener('input', sync));
      upd(); t4b.appendChild(tr);
    });
    const sg = $('t4Sugg');
    SUGGEST.forEach(dom => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = dom;
      b.addEventListener('click', () => {
        const inputs = Array.from(t4b.querySelectorAll('.t4d'));
        if (inputs.some(x => normDomain(x.value) === dom)) { window.toast && window.toast('الدومين ده مضاف بالفعل'); return; }
        const empty = inputs.find(x => !x.value.trim());
        if (!empty) { window.toast && window.toast('الجدول مليان'); return; }
        empty.value = dom; empty.dispatchEvent(new Event('input', { bubbles: true })); empty.closest('tr').querySelector('.t4i').focus();
      });
      sg.appendChild(b);
    });

    // Task 3
    const t3 = $('t3Body');
    QUESTIONS.forEach((q, i) => {
      const d = document.createElement('div'); d.className = 'q-item';
      d.innerHTML = `<label for="t3q${i}"></label><textarea id="t3q${i}"></textarea>`;
      d.querySelector('label').textContent = (i + 1) + '. ' + q;
      const ta = d.querySelector('textarea'); ta.value = data.t3[i];
      ta.addEventListener('input', () => { data.t3[i] = ta.value; refresh(); save(); });
      t3.appendChild(d);
    });
    $('finalNote').value = data.final;

    function refresh() {
      const pr = privateRange(data.t1.ipv4);
      $('t1ipMsg').textContent = data.t1.ipv4 ? (validIp(data.t1.ipv4) ? '' : 'صيغة IPv4 غير صحيحة (4 أرقام من 0 لـ 255).') : '';
      $('t1gwMsg').textContent = data.t1.gateway ? (validIp(data.t1.gateway) ? '' : 'صيغة غير صحيحة.') : '';
      if (pr === null || data.t1.isPrivate === '') $('t1privMsg').textContent = '';
      else {
        const shouldBe = pr ? 'yes' : 'no';
        $('t1privMsg').textContent = data.t1.isPrivate === shouldBe ? ('إجابة صحيحة ✓' + (pr ? ' (نطاق ' + pr + ')' : '')) : 'راجع النطاقات الخاصة وجرب تاني.';
      }
      const a = t1Done();
      $('tag1').className = 'tag ' + (a ? 'ok' : 'no'); $('tag1').textContent = a ? 'مكتمل' : 'لم يكتمل';
      const c2 = t2Count(); $('tag2').className = 'tag ' + (c2 === 10 ? 'ok' : 'no'); $('tag2').textContent = c2 + '/10';
      const c3 = t3Count(); $('tag3').className = 'tag ' + (c3 === 5 ? 'ok' : 'no'); $('tag3').textContent = c3 + '/5';
      const c4 = t4Count(); $('tag4').className = 'tag ' + (c4 === 10 && !t4Dup() ? 'ok' : 'no'); $('tag4').textContent = c4 + '/10';
      $('t4Msg').textContent = t4Dup() ? 'في دومين مكرر — اختار 10 مواقع مختلفة.' : '';
      const s = status();
      $('hwStatus').textContent = s === 'done' ? 'الواجب مكتمل ✓ — صدّره أو اطبعه وسلّمه.' : s === 'partial' ? 'الواجب شغال… كمّل باقي الخانات.' : 'لسه ماجاوبتش على حاجة.';
    }

    $('hwName').addEventListener('input', e => { data.name = e.target.value; save(); });
    $('t1ip').addEventListener('input', e => { data.t1.ipv4 = e.target.value.trim(); refresh(); save(); });
    $('t1mask').addEventListener('input', e => { data.t1.mask = e.target.value.trim(); save(); });
    $('t1gw').addEventListener('input', e => { data.t1.gateway = e.target.value.trim(); refresh(); save(); });
    $('t1priv').addEventListener('change', e => { data.t1.isPrivate = e.target.value; refresh(); save(); });
    $('t1note').addEventListener('input', e => { data.t1.note = e.target.value; save(); });
    $('finalNote').addEventListener('input', e => { data.final = e.target.value; refresh(); save(); });

    $('exportBtn').addEventListener('click', () => {
      const out = {
        course: 'NETWORKING | الشبكات', exportedAt: new Date().toISOString(), studentName: data.name,
        task1: data.t1,
        task2: COMPANIES.map(([company, domain]) => ({ company, domain, ip: data.t2[domain].ip, completed: validIp(data.t2[domain].ip), notes: data.t2[domain].note })),
        task4_globalSites: data.t4.slice(0, 10).map(r => ({ domain: normDomain(r.domain), ip: r.ip, countryOrCompany: r.country || '', completed: validDomain(r.domain) && validIp(r.ip), notes: r.note || '' })),
        task3: QUESTIONS.map((question, i) => ({ question, answer: data.t3[i] })),
        finalNote: data.final, status: status()
      };
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'networking-homework.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (window.toast) window.toast('تم تجهيز ملف JSON للتحميل');
    });
    $('printBtn').addEventListener('click', () => window.print());
    $('clearBtn').addEventListener('click', () => {
      if (!confirm('متأكد إنك عايز تمسح كل إجابات الواجب؟')) return;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      data = { name: '', t1: { ipv4: '', gateway: '', mask: '', isPrivate: '', note: '' }, t2: {}, t3: [], t4: [], final: '' };
      Progress.setHw('none'); mount(box);
    });
    refresh();
  }
  return { mount, validIp, privateRange };
})();

/* quiz.js — one-question-at-a-time quiz with feedback after submission */
const Quiz = (() => {
  const QUESTIONS = [
    { q: 'إيه هي الشبكة (Network) بأبسط تعريف؟', o: ['جهاز واحد بيشتغل لوحده', 'جهازين أو أكتر متوصلين ببعض عشان يتبادلوا بيانات', 'برنامج لتحميل الألعاب فقط', 'نوع من أنواع الكابلات'], a: 1, e: 'الشبكة هي مجموعة أجهزة متوصلة (بكابل أو لاسلكي) عشان تتبادل البيانات والموارد.' },
    { q: 'أي من دول مثال على شبكة لاسلكية (Wireless)؟', o: ['كابل Ethernet بين جهازين', 'Wi-Fi', 'كابل الكهربا', 'كابل HDMI'], a: 1, e: 'Wi-Fi بينقل البيانات بموجات راديو من غير كابلات، عكس Ethernet اللي بيستخدم كابل.' },
    { q: 'في تشبيه المطعم، السيرفر (Server) بيمثل إيه؟', o: ['الزبون', 'المطبخ اللي بيجهز الأكل', 'الطلب', 'الفاتورة'], a: 1, e: 'الزبون = Client، المطبخ = Server، الطلب = Request، والأكل = Response.' },
    { q: 'مين اللي بيبعت الـ Request في الغالب؟', o: ['الـ Client زي المتصفح', 'السيرفر لوحده', 'الكابل', 'الـ ISP دايمًا'], a: 0, e: 'الـ Client (زي المتصفح) هو اللي بيطلب البيانات، والسيرفر بيرد.' },
    { q: 'إيه وظيفة الـ IP Address؟', o: ['يشفّر الرسايل', 'يحدد عنوان الجهاز عشان البيانات توصله', 'يسرّع النت', 'يحفظ الملفات'], a: 1, e: 'الـ IP Address هو عنوان الجهاز على الشبكة، بيه البيانات بتعرف تروح فين.' },
    { q: 'أي عنوان من دول يعتبر Private IP؟', o: ['8.8.8.8', '192.168.1.10', '142.250.185.46', '1.1.1.1'], a: 1, e: '192.168.0.0/16 من النطاقات الخاصة (Private) مع 10.0.0.0/8 و 172.16.0.0/12.' },
    { q: 'إيه اللي بيسمح لأجهزة كتير في البيت تستخدم Public IP واحد؟', o: ['DNS', 'NAT', 'HTTPS', 'ping'], a: 1, e: 'الـ NAT بيترجم العناوين الخاصة لعنوان عام وبيتتبع كل اتصال عشان الرد يرجع للجهاز الصح.' },
    { q: 'أي جملة صحيحة عن الـ Public IP؟', o: ['كل بيت لازم يكون له Public IP خاص بيه على الراوتر', 'عنوان بيتوجه عالميًا على الإنترنت، وبعض مزودي الخدمة بيستخدموا CGNAT', 'مابيتغيرش أبدًا', 'بيبدأ دايمًا بـ 192.168'], a: 1, e: 'ممكن أكتر من عميل يشاركوا Public IP عن طريق CGNAT عند الـ ISP.' },
    { q: 'الراوتر (Router) وظيفته الأساسية إيه؟', o: ['تخزين الأفلام', 'توجيه البيانات بين شبكتك والشبكات التانية زي الإنترنت', 'طباعة الملفات', 'تشغيل المواقع'], a: 1, e: 'الراوتر بيوصّل شبكتك الداخلية بالإنترنت عن طريق الـ ISP وبيوجه الـ Packets.' },
    { q: 'أي من دول مزوّد خدمة إنترنت (ISP) في مصر؟', o: ['WE', 'Windows', 'Chrome', 'Wi-Fi'], a: 0, e: 'WE و Vodafone و Orange و e& Egypt أمثلة لمزودي خدمة الإنترنت.' },
    { q: 'الـ DNS بيعمل إيه؟', o: ['بيحوّل اسم الدومين لـ IP Address', 'بيشفّر الموقع', 'بيسرّع الجهاز', 'بيمسح الفيروسات'], a: 0, e: 'DNS زي دليل التليفونات: بيدّيك العنوان (IP) لما تدّيله الاسم (google.com).' },
    { q: '8.8.8.8 هو إيه بالظبط؟', o: ['عنوان موقع Google نفسه', 'عنوان DNS Server عام (Google Public DNS)', 'عنوان الراوتر', 'رقم بورت'], a: 1, e: '8.8.8.8 هو DNS Resolver عام، مش عنوان الموقع. الفرق مهم: DNS server بيجاوب، والموقع له IP تاني.' },
    { q: 'أنهي أمر في CMD بيعرض الـ IPv4 والـ Default Gateway؟', o: ['ping', 'ipconfig', 'cls', 'echo'], a: 1, e: 'الأمر ipconfig بيعرض إعدادات الـ IP للجهاز، و ipconfig /all بيعرض تفاصيل أكتر.' },
    { q: 'الـ TTL في نتيجة ping معناه تقريبًا؟', o: ['وقت الاستجابة بالثواني', 'عدد القفزات (Hops) اللي الباكت يقدر يعديها قبل ما يتلغي', 'حجم الملف', 'سرعة الإنترنت'], a: 1, e: 'TTL (Time To Live) بيقل مع كل راوتر؛ لما يوصل صفر الباكت بيتلغي.' },
    { q: 'الـ Status Code 404 معناه؟', o: ['نجاح الطلب', 'الصفحة أو المورد مش موجود', 'خطأ داخلي في السيرفر', 'ممنوع الدخول'], a: 1, e: '404 Not Found: السيرفر شغال لكن المورد المطلوب مش موجود. 500 خطأ في السيرفر، 403 ممنوع.' },
    { q: 'في الرابط https://example.com/products/phones?id=10#details، إيه هو الـ Query؟', o: ['/products/phones', 'id=10', '#details', 'https'], a: 1, e: 'الـ Query بتيجي بعد علامة ؟ وفيها الباراميترز (id=10). الـ Path هو /products/phones والـ Fragment هو #details.' },
    { q: 'أي جملة عن HTTPS صحيحة؟', o: ['بيضمن إن الموقع مفيهوش ثغرات', 'HTTP فوق TLS: اتصال مشفّر مع التحقق من هوية السيرفر', 'بيشتغل على بورت 80 افتراضيًا', 'مابيحتاجش شهادات'], a: 1, e: 'HTTPS بيأمّن الاتصال (تشفير + سلامة + هوية السيرفر)، لكنه مايمنعش ثغرات زي SQL Injection أو XSS في الموقع نفسه.' }
  ];

  function mount(box) {
    let idx = 0, score = 0, selected = null, answered = false, answers = [];

    function showStart() {
      const prev = Progress.quiz;
      box.innerHTML = `<div class="q-result">
        <h3>جاهز تختبر نفسك؟</h3>
        <p class="muted">${QUESTIONS.length} سؤال — سؤال واحد في كل مرة. هتشوف الإجابة الصحيحة والشرح بعد ما تأكد إجابتك.</p>
        ${prev ? `<p>آخر نتيجة محفوظة: <b class="${prev.passed ? 'pass' : 'fail'}">${prev.score}/${prev.total} (${prev.pct}%)</b></p>` : ''}
        <button class="btn btn-primary" id="qStart">${prev ? 'أعد الاختبار' : 'ابدأ الاختبار'}</button></div>`;
      box.querySelector('#qStart').addEventListener('click', () => { idx = 0; score = 0; answers = []; render(); });
    }

    function render() {
      selected = null; answered = false;
      const q = QUESTIONS[idx];
      const pct = Math.round((idx / QUESTIONS.length) * 100);
      box.innerHTML = `
        <div class="q-top"><span>سؤال ${idx + 1} من ${QUESTIONS.length}</span><span>${pct}%</span></div>
        <div class="progress-line"><span style="width:${pct}%"></span></div>
        <div class="q-text" id="qText"></div>
        <div class="q-options" role="radiogroup" aria-labelledby="qText"></div>
        <div id="qFeedback" aria-live="polite"></div>
        <div class="controls"><button class="btn btn-primary" id="qSubmit" disabled>أكّد الإجابة</button></div>`;
      box.querySelector('#qText').textContent = q.q;
      const opts = box.querySelector('.q-options');
      q.o.forEach((t, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'q-opt'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.innerHTML = '<span class="mono"></span><span></span>';
        b.children[0].textContent = String.fromCharCode(65 + i) + '.';
        b.children[1].textContent = t;
        b.addEventListener('click', () => {
          if (answered) return;
          selected = i;
          opts.querySelectorAll('.q-opt').forEach((o, j) => { o.classList.toggle('selected', j === i); o.setAttribute('aria-checked', String(j === i)); });
          box.querySelector('#qSubmit').disabled = false;
        });
        opts.appendChild(b);
      });
      box.querySelector('#qSubmit').addEventListener('click', submit);
    }

    function submit() {
      if (selected === null || answered) return;
      answered = true;
      const q = QUESTIONS[idx];
      const ok = selected === q.a;
      if (ok) score++;
      answers.push({ q: q.q, chosen: selected, correct: q.a });
      const optEls = box.querySelectorAll('.q-opt');
      optEls.forEach((o, i) => {
        o.disabled = true;
        if (i === q.a) o.classList.add('correct');
        else if (i === selected) o.classList.add('wrong');
      });
      box.querySelector('#qFeedback').innerHTML = `<div class="q-explain"><b class="${ok ? 'pass' : 'fail'}">${ok ? 'إجابة صحيحة ✔' : 'إجابة غير صحيحة ✘'}</b><p></p></div>`;
      box.querySelector('#qFeedback p').textContent = q.e;
      const btn = box.querySelector('#qSubmit');
      btn.disabled = false;
      const last = idx === QUESTIONS.length - 1;
      btn.textContent = last ? 'شوف النتيجة' : 'السؤال التالي';
      btn.replaceWith(btn.cloneNode(true));
      box.querySelector('#qSubmit').addEventListener('click', () => { if (last) finish(); else { idx++; render(); } });
    }

    function finish() {
      const total = QUESTIONS.length;
      const pct = Math.round((score / total) * 100);
      const passed = pct >= 60;
      Progress.setQuiz({ score, total, pct, passed, date: new Date().toISOString() });
      box.innerHTML = `<div class="q-result">
        <div class="q-score ${passed ? 'pass' : 'fail'}">${pct}%</div>
        <h3>${passed ? 'مبروك! نجحت 🎉' : 'لسه محتاج مراجعة بسيطة'}</h3>
        <p>جاوبت صح على <b>${score}</b> من <b>${total}</b> — النجاح من 60%.</p>
        <p class="muted">${passed ? 'ممتاز، كمّل على التاسك العملي.' : 'راجع الدروس وجرّب تاني، مفيش حد بيتعلم من أول مرة.'}</p>
        <div class="controls" style="justify-content:center">
          <button class="btn btn-primary" id="qRestart">إعادة الاختبار</button>
          <a class="btn btn-ghost" href="#tasks">روح للتاسك</a>
        </div></div>`;
      box.querySelector('#qRestart').addEventListener('click', () => { idx = 0; score = 0; answers = []; render(); });
    }
    showStart();
  }
  return { mount, QUESTIONS };
})();

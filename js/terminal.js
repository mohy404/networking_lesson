/* terminal.js — SIMULATED Windows-like terminal (no real network access) */
const Terminal = (() => {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  // Illustrative sample data only. Real results differ per network, time and location.
  const HOSTS = {
    'google.com':     { ip: '142.250.185.46', ttl: 115, t: [19, 20, 22, 20] },
    'facebook.com':   { ip: '157.240.221.35', ttl: 56,  t: [31, 29, 33, 30] },
    'youtube.com':    { ip: '142.250.185.110', ttl: 115, t: [21, 20, 24, 22] },
    'microsoft.com':  { ip: '20.70.246.20',   ttl: 113, t: [48, 51, 47, 50] },
    'amazon.com':     { ip: '205.251.242.103', ttl: 232, t: [112, 108, 115, 110] },
    'apple.com':      { ip: '17.253.144.10',  ttl: 54,  t: [64, 61, 66, 63] },
    'netflix.com':    { ip: '54.155.178.5',   ttl: 231, t: [58, 60, 57, 59] },
    'wikipedia.org':  { ip: '185.15.58.224',  ttl: 57,  t: [45, 44, 47, 46] },
    'cloudflare.com': { ip: '104.16.132.229', ttl: 58,  t: [17, 18, 17, 19] },
    'github.com':     { ip: '140.82.121.4',   ttl: 117, t: [55, 52, 56, 54] }
  };

  const IPCONFIG = [
    'Windows IP Configuration',
    '',
    '',
    'Wireless LAN adapter Wi-Fi:',
    '',
    '   Connection-specific DNS Suffix  . :',
    '   IPv4 Address. . . . . . . . . . . : 192.168.1.10',
    '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
    '   Default Gateway . . . . . . . . . : 192.168.1.1'
  ];
  const IPCONFIG_ALL = [
    'Windows IP Configuration',
    '',
    '   Host Name . . . . . . . . . . . . : STUDENT-PC',
    '   Primary Dns Suffix  . . . . . . . :',
    '   Node Type . . . . . . . . . . . . : Hybrid',
    '   IP Routing Enabled. . . . . . . . : No',
    '',
    'Wireless LAN adapter Wi-Fi:',
    '',
    '   Connection-specific DNS Suffix  . :',
    '   Description . . . . . . . . . . . : Example Wi-Fi Adapter',
    '   Physical Address. . . . . . . . . : AA-BB-CC-11-22-33',
    '   DHCP Enabled. . . . . . . . . . . : Yes',
    '   Autoconfiguration Enabled . . . . : Yes',
    '   IPv4 Address. . . . . . . . . . . : 192.168.1.10(Preferred)',
    '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
    '   Default Gateway . . . . . . . . . : 192.168.1.1',
    '   DHCP Server . . . . . . . . . . . : 192.168.1.1',
    '   DNS Servers . . . . . . . . . . . : 8.8.8.8',
    '                                       8.8.4.4'
  ];

  let seq = 0;
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function mount(el, opts = {}) {
    const uid = 'termIn' + (++seq);
    const suggestions = opts.suggestions || ['ipconfig', 'ipconfig /all', 'ping google.com'];
    el.innerHTML = `
      <div class="term-notice" role="note"><span aria-hidden="true">ℹ️</span><div><b>محاكي تعليمي (Simulation)</b> — مش Terminal حقيقي ومابيتصلش بالإنترنت. كل الأرقام اللي هتظهر <b>أمثلة توضيحية</b> ومش بيانات جهازك. اكتب <code>help</code> لقايمة الأوامر.</div></div>
      <div class="term-try"><span class="term-try-label">جرّب أمر:</span><div class="chips" dir="ltr" role="group" aria-label="أوامر مقترحة"></div></div>
      <div class="terminal" role="region" aria-label="محاكي سطر الأوامر">
        <div class="term-bar"><span class="dots"><i></i><i></i><i></i></span><span class="term-title">Command Prompt — Simulated</span><button type="button" class="term-clear" aria-label="مسح الشاشة">Clear</button></div>
        <div class="term-body" tabindex="0" aria-live="polite"></div>
        <form class="term-input" autocomplete="off">
          <label class="term-prompt" for="${uid}"><span class="p-long">C:\\Users\\Student</span>&gt;</label>
          <input id="${uid}" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Type a command, e.g. ${esc(suggestions[0])}" aria-label="اكتب أمر">
          <button type="submit" class="term-run">تنفيذ ↵</button>
        </form>
      </div>`;
    const body = el.querySelector('.term-body');
    const form = el.querySelector('form');
    const input = el.querySelector('input');
    const chips = el.querySelector('.chips');
    const history = [];
    let hIdx = 0, busy = false;

    function line(text, cls) {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.textContent = text === '' ? '\u00A0' : text;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }
    function echo(cmd) {
      const d = document.createElement('div'); d.className = 'term-echo';
      const p = document.createElement('span'); p.className = 'term-p'; p.textContent = 'C:\\Users\\Student>';
      const c = document.createElement('span'); c.className = 'term-cmd'; c.textContent = cmd;
      d.appendChild(p); d.appendChild(c); body.appendChild(d); body.scrollTop = body.scrollHeight;
    }
    async function printLines(lines, delay = 35) {
      for (const l of lines) { line(l); await sleep(delay); }
    }
    function welcome() {
      line('Simulated Command Prompt — educational sample outputs only.', 'term-line-dim');
      line('Type "help" to see available commands.', 'term-line-dim');
      line('');
    }

    async function ping(arg) {
      const raw = arg.trim().toLowerCase();
      if (!raw) {
        await printLines(['Usage: ping <hostname>', 'Example: ping google.com']);
        return;
      }
      const host = raw.replace(/^www\./, '');
      if (host === 'blocked.example') {
        await printLines(['Pinging blocked.example [203.0.113.7] with 32 bytes of data:'], 300);
        for (let i = 0; i < 4; i++) { line('Request timed out.', 'term-line-err'); await sleep(450); }
        await printLines([
          '', 'Ping statistics for 203.0.113.7:',
          '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),',
          '(Sample: some servers block ICMP, so this can happen even if the site works.)'
        ]);
        return;
      }
      const h = HOSTS[host];
      if (!h) {
        await printLines(['Ping request could not find host ' + raw + '. Please check the name and try again.',
          '(Simulator knows: ' + Object.keys(HOSTS).join(', ') + ', blocked.example)'], 60);
        return;
      }
      line('Pinging ' + host + ' [' + h.ip + '] with 32 bytes of data:');
      await sleep(350);
      for (const t of h.t) {
        line('Reply from ' + h.ip + ': bytes=32 time=' + t + 'ms TTL=' + h.ttl);
        await sleep(450);
      }
      const min = Math.min(...h.t), max = Math.max(...h.t);
      const avg = Math.round(h.t.reduce((a, b) => a + b, 0) / h.t.length);
      await printLines([
        '', 'Ping statistics for ' + h.ip + ':',
        '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),',
        'Approximate round trip times in milli-seconds:',
        '    Minimum = ' + min + 'ms, Maximum = ' + max + 'ms, Average = ' + avg + 'ms',
        '', '[Simulation] The IP above is an illustrative sample, not a live result.'
      ]);
    }

    async function run(cmdText) {
      const cmd = cmdText.trim();
      echo(cmd);
      if (!cmd) return;
      const low = cmd.toLowerCase();
      const [name, ...rest] = low.split(/\s+/);
      const arg = rest.join(' ');
      if (name === 'help') {
        await printLines([
          'Available commands (simulated):',
          '  ipconfig         show basic IP configuration',
          '  ipconfig /all    show detailed configuration',
          '  ping <host>      e.g. ping google.com',
          '  cls              clear the screen',
          '  help             show this list'
        ]);
      } else if (name === 'cls' || name === 'clear') {
        body.textContent = '';
        return;
      } else if (name === 'ipconfig') {
        if (arg === '') await printLines(IPCONFIG);
        else if (arg === '/all') await printLines(IPCONFIG_ALL);
        else await printLines(['Error: unrecognized or incomplete command line.', 'Try: ipconfig   or   ipconfig /all']);
        if (arg === '' || arg === '/all') line('[Simulation] Sample values — not your real device information.', 'term-line-dim');
      } else if (name === 'ping') {
        await ping(rest.join(' '));
      } else {
        line("'" + name + "' is not recognized as an internal or external command,", 'term-line-err');
        line('operable program or batch file.', 'term-line-err');
      }
      line('');
    }

    suggestions.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = s;
      b.addEventListener('click', () => submit(s));
      chips.appendChild(b);
    });

    async function submit(text) {
      if (busy) return;
      busy = true; input.disabled = true;
      if (text.trim()) { history.push(text); hIdx = history.length; }
      try { await run(text); } catch (err) { line('Simulator error: ' + err.message, 'term-line-err'); }
      busy = false; input.disabled = false; input.value = ''; input.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('terminal:ran', { detail: text.trim().toLowerCase() }));
    }
    form.addEventListener('submit', e => { e.preventDefault(); submit(input.value); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' && history.length) { hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx]; e.preventDefault(); }
      if (e.key === 'ArrowDown' && history.length) { hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; e.preventDefault(); }
    });
    el.querySelector('.term-clear').addEventListener('click', () => { body.textContent = ''; welcome(); input.focus({ preventScroll: true }); });
    body.addEventListener('click', () => { if (!window.getSelection().toString()) input.focus({ preventScroll: true }); });
    welcome();
  }
  return { mount, HOSTS };
})();

/* Aetheris v0.4 clickable prototype. Plain JS, no build step. Sample data only. */
(() => {
const D = window.DATA;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const params = new URLSearchParams(location.search);

/* ---------- icons (16px, 1.4 stroke, drawn for this app) ---------- */
const I = {
  home: '<path d="M2.5 7.2 8 2.8l5.5 4.4V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z"/><path d="M6.5 13.5V9.5h3v4"/>',
  wait: '<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M8 5v3.2l2 1.3"/>',
  report: '<path d="M4 1.8h5.5L12.5 5v9.2H4z"/><path d="M6 8h4.5M6 10.5h4.5M6 5.5h2"/>',
  learned: '<path d="M2 13.5h12"/><path d="M3.5 11 7 7.5l2.2 2.2L13 5.5"/><rect x="11.4" y="3.9" width="3" height="3" fill="currentColor" stroke="none"/>',
  memory: '<circle cx="8" cy="5.5" r="2.7"/><path d="M3 14c.6-2.8 2.6-4.3 5-4.3s4.4 1.5 5 4.3"/>',
  pc: '<rect x="1.8" y="2.8" width="12.4" height="8.4" rx="1"/><path d="M5.5 14h5M8 11.2V14"/>',
  settings: '<path d="M2.5 4.5h7M12 4.5h1.5M2.5 11.5h2M7 11.5h6.5"/><rect x="9.5" y="3" width="2.5" height="3"/><rect x="4.5" y="10" width="2.5" height="3"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  search: '<circle cx="7" cy="7" r="4.3"/><path d="m10.2 10.2 3.3 3.3"/>',
  sun: '<circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
  moon: '<path d="M13 9.6A5.4 5.4 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6z"/>',
  pause: '<path d="M5.5 3.5v9M10.5 3.5v9"/>',
  play: '<path d="M5 3.2v9.6L12.5 8z"/>',
  stop: '<rect x="4" y="4" width="8" height="8"/>',
  replay: '<path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 2.5v2.5h2.5"/>',
};
const icon = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square">${I[n]}</svg>`;
const LOGO = '<svg width="22" height="12" viewBox="0 0 22 12"><path d="M1 6h20" stroke="currentColor" stroke-width="1.2"/><circle cx="4" cy="6" r="2.4" fill="var(--panel)" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="3.5" width="5" height="5" fill="currentColor"/><rect x="16" y="3.5" width="5" height="5" fill="var(--ask)"/></svg>';

/* ---------- app state ---------- */
const S = {
  page: params.get('page') || 'task',
  theme: params.get('theme') || localStorage.getItem('ae-theme') || 'light',
  taskId: params.get('task') || 'date',
  approvals: D.approvals.slice(),
  memory: D.memory.slice(),
  freeLeft: 1088,
  reportId: 'today',
  settingsTab: 'ok',
  rules: { edit: 'own', cmd: 'ask', push: 'ask', install: 'ask', delete: 'ask', outside: 'never', network: 'own' },
};

/* ---------- live run engine ---------- */
const R = { steps: [], plan: [], speed: Number(params.get('speed') || 1), paused: false, stopped: false, sel: null, follow: true, state: 'idle', gen: 0, startT: Date.parse('2026-10-05T10:41:48') };
let clockMs = 0; // simulated elapsed ms since start
const now = () => { const d = new Date(R.startT + clockMs); return d.toTimeString().slice(0, 8); };
const JUMP = params.get('at');
const jumpHit = () => ({ ask: R.state === 'waiting', edit: R.steps.some(s => s.live && s.kind === 'change' && s.detail.shown.length >= 7), tests: R.steps.some(s => s.live && s.tool === 'run_tests' && s.detail.out.length >= 7), think: R.steps.some(s => s.kind === 'think' && s.typing && s.text.length > 90) }[JUMP]);
let jumped = false;
function wait(ms, gen) {
  if (JUMP && !jumped) { clockMs += ms; if (jumpHit()) { jumped = true; R.paused = true; R.speed = 1; setTimeout(renderTaskInner, 0); return new Promise(() => {}); } return Promise.resolve(); }
  return new Promise((res, rej) => {
    let left = ms;
    const tick = () => {
      if (gen !== R.gen) return rej(new Error('cancelled'));
      if (!R.paused) { const step = 40 * R.speed; left -= step; clockMs += step; }
      if (left <= 0) return res();
      setTimeout(tick, 40);
    };
    setTimeout(tick, 40);
  });
}
const sid = () => 's' + Math.random().toString(36).slice(2, 8);
function add(step) { step.id = step.id || sid(); step.time = now(); R.steps.push(step); renderIf(); return step; }
function setPlan(i, st) { if (R.plan[i]) R.plan[i].st = st; }
async function stream(step, field, text, gen, cps = 55) {
  step[field] = ''; step.typing = true;
  for (const ch of text) { step[field] += ch; renderIf(true); await wait(1000 / cps, gen); }
  step.typing = false; renderIf();
}

const TESTOUT1 = [
  ['dim', '$ python -m pytest -q'],
  ['', 'tests/test_invoice.py ........................          [ 60%]'],
  ['', 'tests/test_dates.py ............'], ['bad', 'F'], ['bad', 'F'],
  ['', '                     [100%]'],
  ['bad', 'FAILED tests/test_dates.py::test_day_first_parse - assert date(2026, 5, 10) == date(2026, 10, 5)'],
  ['bad', 'FAILED tests/test_dates.py::test_due_date_label - assert "May 10" == "5 Oct"'],
  ['', ''], ['bad', '2 failed'], ['', ', 38 passed in 1.84s'],
];
const TESTOUT2 = [
  ['dim', '$ python -m pytest -q'],
  ['', 'tests/test_invoice.py ........................          [ 58%]'],
  ['', 'tests/test_dates.py .................               [100%]'],
  ['', ''], ['ok', '41 passed'], ['', ' in 1.91s'],
];
const DIFF_DATES = {
  file: 'src/invoice_tool/dates.py', add: 6, del: 2, hunk: '@@ parse_invoice_date @@',
  lines: [
    [18, ' ', 'def parse_invoice_date(raw: str) -> date:'],
    [19, ' ', '    raw = raw.strip()'],
    [20, '-', '    return datetime.strptime(raw, "%m/%d/%Y").date()'],
    [21, '-', ''],
    [20, '+', '    fmt = settings.date_format or "%d/%m/%Y"'],
    [21, '+', '    try:'],
    [22, '+', '        return datetime.strptime(raw, fmt).date()'],
    [23, '+', '    except ValueError as err:'],
    [24, '+', '        raise InvoiceDateError(raw, fmt) from err'],
    [25, '+', ''],
    [26, ' ', ''],
    [27, ' ', 'def format_due(d: date) -> str:'],
    [28, ' ', '    return d.strftime(settings.date_format)'],
  ],
  why: 'Your settings already say day-first, but the parser ignored them. It now uses your setting and gives a clear error for bad dates instead of a wrong one.',
};
const DIFF_TEST = {
  file: 'tests/test_dates.py', add: 9, del: 0, hunk: '@@ end of file @@',
  lines: [
    [88, ' ', ''],
    [89, '+', 'def test_parse_uses_day_first_setting(monkeypatch):'],
    [90, '+', '    monkeypatch.setattr(settings, "date_format", "%d/%m/%Y")'],
    [91, '+', '    assert parse_invoice_date("05/10/2026") == date(2026, 10, 5)'],
    [92, '+', ''],
    [93, '+', ''],
    [94, '+', 'def test_bad_date_raises_clear_error():'],
    [95, '+', '    with pytest.raises(InvoiceDateError):'],
    [96, '+', '        parse_invoice_date("31/02/2026")'],
    [97, '+', ''],
  ],
  why: 'So this exact bug can never come back without a test failing.',
};

async function playDate() {
  const gen = ++R.gen; clockMs = 0;
  Object.assign(R, { steps: [], plan: [], paused: false, stopped: false, sel: null, follow: true, state: 'running' });
  S.approvalPush = false;
  render();
  try {
    add({ kind: 'you', title: 'Invoice dates are wrong for my Indian clients. 05/10 shows as May 10. Fix it.' });
    await wait(500, gen);
    const t1 = add({ kind: 'think', live: true, text: '' });
    await stream(t1, 'text', 'Dates are read somewhere in the invoice code. I\'ll find that first, then run the tests to see what\'s failing.', gen);
    t1.live = false;
    R.plan = [
      { t: 'Find where invoice dates are read', st: 'now' }, { t: 'Find out why they come out wrong', st: '' },
      { t: 'Fix it', st: '' }, { t: 'Add a test so it stays fixed', st: '' }, { t: 'Run all the tests', st: '' },
      { t: 'Push to GitHub', st: '', r: 'needs your OK' },
    ];
    renderIf();
    await wait(400, gen);
    const r1 = add({ kind: 'look', live: true, title: 'Reading files', tool: 'read_file', detail: { type: 'files', files: [] } });
    for (const f of [['src/invoice_tool/invoice.py', '212 lines'], ['src/invoice_tool/dates.py', '64 lines'], ['tests/test_dates.py', '88 lines']]) {
      await wait(500, gen); r1.detail.files.push(f); r1.sub = r1.detail.files.map(x => x[0].split('/').pop()).join(', '); renderIf();
    }
    r1.live = false; r1.title = 'Read 3 files'; setPlan(0, 'done'); setPlan(1, 'now'); renderIf();
    await wait(300, gen);
    const r2 = add({ kind: 'look', live: true, title: 'Running the tests', tool: 'run_tests', detail: { type: 'term', out: [] } });
    for (const l of TESTOUT1) { await wait(l[1].length > 40 ? 380 : 160, gen); r2.detail.out.push(l); renderIf(true); }
    r2.live = false; r2.title = 'Ran the tests'; r2.sub = '38 passed, <span class="del">2 failed</span> in test_dates.py'; renderIf();
    S.freeLeft -= 3;
    const t2 = add({ kind: 'think', live: true, text: '' });
    await stream(t2, 'text', 'Both failures are day-first dates. parse_invoice_date() always uses "%m/%d/%Y" and ignores settings.date_format, which is set to "%d/%m/%Y".', gen);
    t2.live = false;
    add({ kind: 'look', title: 'Found the cause: dates like <span class="mono">05/10/2026</span> are read as May 10, but your invoices use day first.' });
    setPlan(1, 'done'); setPlan(2, 'now'); renderIf();
    await wait(500, gen);
    await editStep(gen, DIFF_DATES, 'Editing dates.py', 'Changed dates.py');
    setPlan(2, 'done'); setPlan(3, 'now'); renderIf();
    await wait(400, gen);
    await editStep(gen, DIFF_TEST, 'Adding a test to test_dates.py', 'Added a test to test_dates.py', 2.2);
    setPlan(3, 'done'); setPlan(4, 'now'); renderIf();
    await wait(300, gen);
    const r5 = add({ kind: 'look', live: true, title: 'Running the tests again', tool: 'run_tests', detail: { type: 'term', out: [] } });
    for (const l of TESTOUT2) { await wait(l[1].length > 40 ? 420 : 160, gen); r5.detail.out.push(l); renderIf(true); }
    r5.live = false; r5.kind = 'ok'; r5.title = 'Ran the tests again'; r5.sub = 'All 41 passed'; setPlan(4, 'done'); setPlan(5, 'ask'); renderIf();
    S.freeLeft -= 2;
    await wait(400, gen);
    add({ kind: 'ask', id: 'askpush' });
    R.state = 'waiting'; S.approvalPush = true; R.follow = false;
    if (JUMP) jumped = true;
    render();
  } catch (e) { if (e.message !== 'cancelled') throw e; }
}
async function editStep(gen, diff, liveTitle, doneTitle, fast = 1) {
  const st = add({ kind: 'change', live: true, title: liveTitle, tool: 'edit_file', detail: { type: 'diff', diff, shown: [], typing: null } });
  for (const [n, s, c] of diff.lines) {
    if (s === '+') {
      const line = [n, s, '']; st.detail.shown.push(line); st.detail.typing = line;
      for (const ch of c) { line[2] += ch; renderIf(true); await wait(22 / fast, gen); }
      st.detail.typing = null; await wait(80, gen);
    } else { st.detail.shown.push([n, s, c]); renderIf(true); await wait(s === '-' ? 260 : 90, gen); }
  }
  st.live = false; st.title = doneTitle; st.sub = `<span class="add">+${diff.add}</span>${diff.del ? ` <span class="del">&minus;${diff.del}</span>` : ''}`; st.undoable = true;
  renderIf();
}
async function doPush(always) {
  const gen = R.gen;
  const a = R.steps.find(s => s.id === 'askpush'); a.kind = 'answered'; a.answer = always ? 'You allowed it, and said always allow pushing to fix/ branches.' : 'You allowed it.';
  S.approvalPush = false; R.state = 'running'; R.follow = true; R.sel = null;
  if (always) { S.rules.push = 'own'; toast('Pushing to fix/ branches won\'t ask again. Change this in Settings, What needs your OK.'); }
  render();
  try {
    const p = add({ kind: 'look', live: true, title: 'Pushing to GitHub', tool: 'shell', detail: { type: 'term', out: [] } });
    for (const l of [['dim', '$ git push origin fix/date-parsing'], ['', 'Enumerating objects: 9, done.'], ['', 'Writing objects: 100% (5/5), 1.12 KiB'], ['', 'To github.com:UnderAetheris/invoice-tool.git'], ['ok', ' * [new branch]      fix/date-parsing -> fix/date-parsing']]) { await wait(320, gen); p.detail.out.push(l); renderIf(true); }
    p.live = false; p.kind = 'change'; p.title = 'Pushed to fix/date-parsing'; p.sub = 'Sent to GitHub. This one can\'t be undone from here.'; setPlan(5, 'done');
    await wait(300, gen);
    add({ kind: 'done', title: 'Done. 2 files changed, all 41 tests pass, and the fix is on GitHub in fix/date-parsing.', sub: 'Took 1 min 12 s · 5 free requests used' });
    R.state = 'done'; render();
  } catch (e) { if (e.message !== 'cancelled') throw e; }
}
function notNow() {
  const a = R.steps.find(s => s.id === 'askpush'); a.kind = 'later';
  S.approvalPush = false; R.state = 'paused-ask'; render(); toast('OK. It stays here, and in Waiting for you, until you decide.');
}
function undoStep(id) {
  const st = R.steps.find(s => s.id === id); if (!st || st.undone) return;
  st.undone = true;
  add({ kind: 'change', title: `Undid the change to ${st.detail.diff.file.split('/').pop()}`, sub: 'The file is back exactly as it was. Tests haven\'t been run since.', redoOf: id });
  toast(`Undid the change to ${st.detail.diff.file.split('/').pop()}.`, 'Redo', () => redo(id));
  render();
}
function redo(id) {
  const st = R.steps.find(s => s.id === id); if (!st) return; st.undone = false;
  R.steps = R.steps.filter(s => s.redoOf !== id); render();
}

/* ---------- rendering helpers ---------- */
let rq = null; let followScroll = false;
let homeT = null;
function renderIf(scroll) { if (S.page !== 'task' || S.taskId !== 'date') { if (S.page === 'home' && !homeT) homeT = setTimeout(() => { homeT = null; if (S.page === 'home') render(); }, 500); return; } followScroll = followScroll || scroll || R.follow; if (rq) return; rq = requestAnimationFrame(() => { rq = null; renderTaskInner(); }); }

function sideHTML() {
  const waitN = S.approvals.length + (S.approvalPush ? 1 : 0);
  const nav = [['home', 'Home', 'home'], ['wait', 'Waiting for you', 'wait', waitN], ['reports', 'Reports', 'report'], ['learned', 'What it learned', 'learned'], ['memory', 'What it knows', 'memory'], ['pc', 'PC health', 'pc'], ['settings', 'Settings', 'settings']];
  const t = id => D.tasks.find(x => x.id === id);
  const live = t('date');
  const liveMeta = R.state === 'waiting' ? 'Needs your OK to push' : R.state === 'done' ? '10:43 · 2 files changed · pushed' : R.state === 'paused-ask' ? 'Waiting · push not sent' : R.paused ? 'Paused' : '<span class="live"></span>Working · step ' + Math.max(1, R.steps.filter(s => s.kind !== 'think' && s.kind !== 'you').length);
  const taskRow = (x, meta, cls = '') => `<a class="task ${cls} ${S.page === 'task' && S.taskId === x.id ? 'on' : ''}" data-task="${x.id}" tabindex="0"><div class="t">${esc(x.title)}</div><div class="m">${meta}</div></a>`;
  const waiting = R.state === 'waiting' || R.state === 'paused-ask';
  const running = [D.tasks[1]].concat(!waiting && R.state !== 'done' ? [live] : []);
  const done = D.tasks.filter(x => x.group === 'done');
  return `<aside class="side">
    <button class="new" data-go="new"><span style="display:flex;gap:8px;align-items:center">${icon('plus', 14)}New task</span><kbd>Ctrl N</kbd></button>
    <nav class="nav">${nav.map(([id, label, ic, n]) => `<a data-go="${id}" class="${S.page === id ? 'on' : ''}" tabindex="0">${icon(ic)}<span>${label}</span>${n ? `<span class="n ${id === 'wait' ? 'ask' : ''}">${n}</span>` : ''}</a>`).join('')}</nav>
    <div style="overflow-y:auto;min-height:0;flex:1">
    ${waiting ? `<div class="group"><span>Waiting for you</span><span>1</span></div>${taskRow(live, liveMeta, 'wait')}` : ''}
    <div class="group"><span>Running</span><span>${running.length}</span></div>
    ${running.map(x => taskRow(x, x.id === 'date' ? liveMeta : `<span class="live"></span>${x.meta}`)).join('')}
    <div class="group"><span>Done today</span><span>${done.length + (R.state === 'done' ? 1 : 0)}</span></div>
    ${R.state === 'done' ? taskRow(live, liveMeta) : ''}
    ${done.map(x => taskRow(x, x.meta)).join('')}
    </div>
  </aside>`;
}
function barHTML() {
  return `<div class="bar">
    <div class="logo">${LOGO} Aetheris</div>
    <button class="input" data-act="palette" style="margin-left:24px;width:300px;height:24px;color:var(--faint);font-family:Plex">${icon('search', 13)}<span>Search or run a command</span><kbd style="margin-left:auto;font:11px PlexMono">Ctrl K</kbd></button>
    <div class="status">
      <span>Model <b>Gemini 2.5 Flash</b></span>
      <span title="Free requests left today across your models">Free requests left today <b class="mono">${S.freeLeft.toLocaleString('en-US')} / 1,500</b></span>
      <button data-act="theme" title="Switch light / dark" style="color:var(--muted);display:flex">${icon(S.theme === 'dark' ? 'sun' : 'moon', 15)}</button>
    </div>
    <div class="win"><span><svg width="10" height="10"><path d="M0 5.5h10" stroke="currentColor"/></svg></span><span><svg width="10" height="10"><rect x=".5" y=".5" width="9" height="9" fill="none" stroke="currentColor"/></svg></span><span><svg width="10" height="10"><path d="M.5.5l9 9M9.5.5l-9 9" stroke="currentColor"/></svg></span></div>
  </div>`;
}

/* ---------- task view ---------- */
function markFor(s) {
  return { you: 'you', think: '', look: '', change: 'chg', ok: 'ok', ask: 'ask', answered: 'ask', later: 'ask', done: 'ok', stop: 'stop' }[s.kind] || '';
}
function rowHTML(s, i, arr) {
  const cls = ['row', s.live ? 'live' : '', R.sel === s.id ? 'sel' : '', s.undone ? 'undone' : '', s.kind === 'you' ? 'you' : '', i === arr.length - 1 ? 'last' : ''].join(' ');
  const mk = `<span class="mk"><i class="${markFor(s)}"></i></span>`;
  const time = `<span class="time mono">${s.time}</span>`;
  let txt = '', act = '';
  if (s.kind === 'you') txt = `<span class="txt"><span class="who">You</span>${esc(s.title)}</span>`;
  else if (s.kind === 'think') txt = `<span class="txt think"><span class="lbl">THINKING</span>${esc(s.text)}${s.typing ? '<span class="caret"></span>' : ''}</span>`;
  else if (s.kind === 'ask') {
    txt = `<span class="txt"><div class="askbox fade-in">
      <div class="q">Can I push this fix to GitHub?</div>
      <div class="cmd mono">git push origin fix/date-parsing</div>
      <div class="why">Pushing is outside what I'm allowed to do on my own. It sends the 2 changed files to your repository. I can't undo it from here once it's sent.</div>
      <div class="btns"><button class="btn primary" data-act="push">Push</button><button class="btn" data-act="notnow">Not now</button><button class="btn" data-act="always">Always allow pushing to fix/ branches</button><span class="hint">Y / N</span></div>
    </div></span>`;
  } else if (s.kind === 'answered') txt = `<span class="txt">Asked to push to GitHub<span class="sub">${esc(s.answer)}</span></span>`;
  else if (s.kind === 'later') txt = `<span class="txt"><b>Waiting for you:</b> push to GitHub<span class="sub">You said not now. Nothing was sent.</span></span>`, act = `<span class="act"><a data-act="push">Push now</a></span>`;
  else {
    txt = `<span class="txt">${s.kind === 'change' || s.kind === 'done' ? `<b>${s.title}</b>` : `<span>${s.title}</span>`}${s.tool ? `<span class="tag">${s.tool}</span>` : ''}${s.sub ? `<span class="sub ${s.kind === 'change' && s.detail ? 'mono' : ''}">${s.sub}</span>` : ''}${s.undone ? '<span class="undone-note">Undone</span>' : ''}${s.live ? '<span class="prog"><b></b></span>' : ''}</span>`;
    if (s.undoable && !s.undone) act = `<span class="act"><a data-undo="${s.id}">Undo</a></span>`;
    else if (s.undoable && s.undone) act = `<span class="act"><a data-redo="${s.id}">Redo</a></span>`;
    else if (s.detail && s.detail.type === 'term' && !s.live) act = `<span class="act"><a>Output</a></span>`;
  }
  return `<div class="${cls}" data-step="${s.id}">${time}${mk}${txt}${act || '<span class="act"></span>'}</div>`;
}
function planHTML() {
  if (!R.plan.length) return '';
  const d = R.plan.filter(p => p.st === 'done').length;
  return `<div class="plan fade-in"><div class="ph"><b>Plan</b><span class="mono">${d} of ${R.plan.length}</span><span style="margin-left:auto">Made from your request. You can edit it.</span></div><ol>${R.plan.map(p => `<li class="${p.st}"><span class="c"></span><span>${esc(p.t)}</span><span class="r">${p.r || ''}</span></li>`).join('')}</ol></div>`;
}
function detailHTML() {
  const live = [...R.steps].reverse().find(s => s.live && s.detail);
  const s = (R.sel && R.steps.find(x => x.id === R.sel)) || (R.follow && live) || [...R.steps].reverse().find(x => x.detail && x.kind === 'change' && !x.undone) || [...R.steps].reverse().find(x => x.detail);
  if (!s || !s.detail) return `<aside class="detail"><div class="dh"><div class="k">Details</div></div><div class="empty">Select a step to see exactly what it did. While it works, this shows the live output.</div></aside>`;
  const idx = R.steps.filter(x => x.kind !== 'think' && x.kind !== 'you').indexOf(s) + 1;
  const liveB = s.live ? '<span class="livebadge"><i></i>Live</span>' : '';
  const d = s.detail;
  if (d.type === 'files') return `<aside class="detail"><div class="dh"><div class="k" style="display:flex;justify-content:space-between"><span>Step ${idx} · ${s.time}</span>${liveB}</div><div class="f"><span class="mono">read_file</span></div></div><div class="files" style="background:var(--surface);flex:1">${d.files.map(f => `<div class="fade-in"><span>${f[0]}</span><span>${f[1]}</span></div>`).join('')}</div><div class="why2"><div class="k">What this means</div>It only read these files. Nothing on your computer was changed.</div></aside>`;
  if (d.type === 'term') return `<aside class="detail"><div class="dh"><div class="k" style="display:flex;justify-content:space-between"><span>Step ${idx} · ${s.time}</span>${liveB}</div><div class="f"><span class="mono">${s.tool}</span><span class="muted small">in D:\\projects\\invoice-tool</span></div></div><div class="term" id="term">${d.out.map(([c, t]) => t === '' ? '\n' : `<span class="${c}">${esc(t)}</span>${/^(F|\.|2 failed|41 passed)$/.test(t) || t.startsWith(', ') || t.startsWith(' in ') ? '' : '\n'}`).join('')}${s.live ? '<span class="caret"></span>' : ''}</div><div class="why2"><div class="k">What this means</div>${s.tool === 'shell' ? 'This sent your changes to GitHub. You allowed it.' : 'Running tests only reads your code. Nothing was changed.'}</div></aside>`;
  const df = d.diff; const lines = d.shown || df.lines;
  return `<aside class="detail"><div class="dh"><div class="k" style="display:flex;justify-content:space-between"><span>Step ${idx} · ${s.time}</span>${liveB}</div><div class="f"><span class="mono">${df.file}</span>${!s.live ? `<span class="mono"><span class="add">+${df.add}</span>${df.del ? ` <span class="del">&minus;${df.del}</span>` : ''}</span>` : ''}</div>
    <div class="btns">${s.undone ? `<button class="btn" data-redo="${s.id}">Redo this change</button>` : `<button class="btn" data-undo="${s.id}" ${s.live ? 'disabled style="opacity:.5"' : ''}>Undo this change</button>`}<button class="btn">Open in editor</button></div></div>
    <div class="diff" id="diff"><div class="hunk">${df.hunk}</div>${lines.map(l => `<div class="ln ${l[1] === '+' ? 'a' : l[1] === '-' ? 'd' : ''} ${d.typing === l ? 'typing' : ''} ${s.undone ? 'gone' : ''}"><span class="n">${l[0]}</span><span class="s">${l[1] === ' ' ? '' : l[1]}</span><span class="c">${esc(l[2])}</span></div>`).join('')}</div>
    <div class="why2"><div class="k">${s.undone ? 'Undone' : 'Why this change'}</div>${s.undone ? 'You undid this. The file is back exactly as it was before.' : (s.live ? 'Writing the change now. You can pause at any time.' : df.why)}</div></aside>`;
}
function taskHeadHTML() {
  const files = R.steps.filter(s => s.undoable && !s.undone).length;
  const n = R.steps.filter(s => s.kind !== 'think' && s.kind !== 'you').length;
  const ctrl = R.state === 'running'
    ? `<button class="btn sm" data-act="pause">${icon(R.paused ? 'play' : 'pause', 12)}&nbsp;${R.paused ? 'Resume' : 'Pause'}</button><button class="btn sm" data-act="stop">${icon('stop', 12)}&nbsp;Stop</button>`
    : `<button class="btn sm" data-act="replay">${icon('replay', 12)}&nbsp;Replay demo</button>`;
  return `<div class="head"><div class="htop"><div style="flex:1;min-width:0"><h1>Fix the date parsing bug in invoices</h1>
    <div class="meta"><span>You asked at 10:41</span><span>${n} steps</span><span>${files} file${files === 1 ? '' : 's'} changed</span><span>Everything it changed can be undone</span></div></div>
    <div class="bar2 controls">${ctrl}<span class="speed" data-act="speed" title="Demo speed">${R.speed}×</span></div></div></div>`;
}
function renderTaskInner() {
  const v = $('#taskview'); if (!v) return;
  const st = $('.steps', v); const atBottom = st ? st.scrollHeight - st.scrollTop - st.clientHeight < 60 : true;
  $('.log .head', v).outerHTML = taskHeadHTML();
  $('.steps', v).innerHTML = planHTML() + R.steps.map(rowHTML).join('');
  $('.detail', v).outerHTML = detailHTML();
  const st2 = $('.steps', v); if (followScroll && atBottom) st2.scrollTop = st2.scrollHeight;
  const t = $('#term') || $('#diff'); if (t) t.scrollTop = t.scrollHeight;
  followScroll = false;
  const side = $('.side'); if (side) side.outerHTML = sideHTML();
}
function taskView() {
  if (S.taskId !== 'date') return otherTaskView();
  return `<div class="taskview" id="taskview"><section class="log"><div class="head"></div><div class="steps"></div>
    <div class="composer">${R.state === 'running' ? 'Add an instruction while it works. It reads it before the next step.' : 'Reply, or tell it what to change'}<kbd>Enter</kbd></div></section><aside class="detail"></aside></div>`;
}
function otherTaskView() {
  const t = D.tasks.find(x => x.id === S.taskId);
  const rows = {
    rename: [['you', 'Rename "client" to "customer" everywhere in invoice-tool, including the database column.'], ['look', 'Searched the project for "client"', '214 matches in 31 files'], ['look', 'Plan: rename in code first, then add a database migration, then run tests'], ['chg', 'Changed 9 files', '+118 −118'], ['chg', 'Changed 5 files', '+40 −40'], ['live', 'Editing 14 more files', 'templates/, api/, tests/']],
    csv: [['you', 'Add a CSV export button to the reports page.'], ['look', 'Read 4 files'], ['chg', 'Added export_csv() to reports.py', '+38'], ['chg', 'Added the button to reports.html', '+6 −1'], ['chg', 'Added 3 tests', '+41'], ['ok', 'Ran the tests', 'All 44 passed'], ['done', 'Done. 3 files changed.']],
    slow: [['you', 'Why is startup slow?'], ['look', 'Checked startup apps and boot time', 'Windows reported 74 s from power on to desktop'], ['look', 'Measured each startup app'], ['done', 'Answer: 3 apps add 41 s together (Teams 18 s, OneDrive 12 s, Adobe Updater 11 s). Turning off Adobe Updater is the safest win. Nothing was changed.']],
    logs: [['you', 'Clean up old log files in Downloads.'], ['look', 'Found 212 .log files older than 30 days', '1.4 GB'], ['ask', 'You allowed: move them to the Recycle Bin'], ['chg', 'Moved 212 files to the Recycle Bin', '1.4 GB freed'], ['undone', 'You undid it at 9:20. All 212 files are back.']],
    commits: [['you', "Summarise yesterday's commits."], ['look', 'Read git log for 4 projects', '17 commits'], ['done', 'Answer: mostly invoice-tool (11 commits: PDF layout, tax rounding fix). 6 small commits in aetheris docs. Nothing was changed.']],
  }[S.taskId] || [];
  const mk = { you: 'you', look: '', chg: 'chg', ok: 'ok', done: 'ok', ask: 'ask', live: 'chg', undone: '' };
  return `<div class="taskview"><section class="log"><div class="head"><h1>${esc(t.title)}</h1><div class="meta"><span>${esc(t.meta)}</span></div></div><div class="steps">
    ${rows.map((r, i) => `<div class="row ${r[0] === 'live' ? 'live' : ''} ${r[0] === 'you' ? 'you' : ''} ${r[0] === 'undone' ? '' : ''} ${i === rows.length - 1 ? 'last' : ''}"><span class="time mono">${['09:01:10', '09:01:22', '09:01:40', '09:02:15', '09:03:02', '09:03:40', '09:04:05'][i]}</span><span class="mk"><i class="${mk[r[0]]}"></i></span><span class="txt">${r[0] === 'you' ? '<span class="who">You</span>' : ''}${r[0] === 'chg' || r[0] === 'done' || r[0] === 'live' ? `<b>${esc(r[1])}</b>` : esc(r[1])}${r[2] ? `<span class="sub ${r[0] === 'chg' ? 'mono' : ''}">${esc(r[2])}</span>` : ''}${r[0] === 'live' ? '<span class="prog"><b></b></span>' : ''}</span><span class="act">${r[0] === 'chg' ? '<a>Undo</a>' : ''}</span></div>`).join('')}
  </div><div class="composer">Reply, or tell it what to change<kbd>Enter</kbd></div></section><aside class="detail"><div class="dh"><div class="k">Details</div></div><div class="empty">Select a step to see exactly what it did.</div></aside></div>`;
}

/* ---------- other pages ---------- */
function home() {
  const waitN = S.approvals.length + (S.approvalPush ? 1 : 0);
  const live = R.steps.filter(s => s.kind !== 'think' && s.kind !== 'you');
  const cur = [...R.steps].reverse().find(s => s.live) || live[live.length - 1];
  const sc = D.score;
  return `<div class="pg"><div class="head"><h1>Monday, 5 October</h1><p>${waitN ? `${waitN} thing${waitN > 1 ? 's' : ''} waiting for you. ` : ''}2 tasks running, 4 done today.</p></div><div class="inner">
  ${waitN ? `<div class="sec"><div class="sh"><b>Waiting for you</b><a data-go="wait">See all</a></div><div class="box lst">
    ${S.approvalPush ? `<a data-task="date" style="grid-template-columns:10px 1fr auto"><span class="dot ask"></span><span><span class="ink">Push the date fix to GitHub</span><span class="muted small" style="display:block">Fix the date parsing bug · git push origin fix/date-parsing</span></span><span class="btn sm">Open</span></a>` : ''}
    ${S.approvals.map(a => `<a data-go="wait" style="grid-template-columns:10px 1fr auto"><span class="dot ask"></span><span><span class="ink">${esc(a.title)}</span><span class="muted small" style="display:block">${esc(a.from)}</span></span><span class="btn sm">Review</span></a>`).join('')}
  </div></div>` : ''}
  <div class="sec"><div class="sh"><b>Running now</b><span>Updates live</span></div><div class="box lst">
    <a data-task="date" style="grid-template-columns:10px 1fr 160px"><span class="dot sq" style="${R.state === 'running' ? 'animation:blink 1.2s steps(2) infinite' : ''}"></span><span><span class="ink">Fix the date parsing bug in invoices</span><span class="muted small" style="display:block">${cur ? (cur.title || cur.text || '').replace(/<[^>]+>/g, '').slice(0, 90) : 'Starting'}</span></span><span class="small muted" style="text-align:right">${R.plan.filter(p => p.st === 'done').length} of ${R.plan.length || 6} planned steps</span></a>
    <a data-task="rename" style="grid-template-columns:10px 1fr 160px"><span class="dot sq" style="animation:blink 1.2s steps(2) infinite"></span><span><span class="ink">Rename "client" to "customer" everywhere</span><span class="muted small" style="display:block">Editing 14 more files in templates/, api/, tests/</span></span><span class="small muted" style="text-align:right">3 of 5 planned steps</span></a>
  </div></div>
  <div class="sec"><div class="sh"><b>Today</b><a data-go="reports">Open today's report</a></div><div class="box grid3" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="k">Tasks done</div><div class="v">4</div><div class="d">1 undone by you</div></div>
    <div class="stat"><div class="k">Files changed</div><div class="v">11</div><div class="d">All can be undone</div></div>
    <div class="stat"><div class="k">Asked you</div><div class="v">3</div><div class="d">2 allowed, 1 waiting</div></div>
    <div class="stat"><div class="k">Free requests used</div><div class="v">${1500 - S.freeLeft}<small> / 1,500</small></div><div class="meter"><b style="width:${(1500 - S.freeLeft) / 15}%"></b></div></div>
  </div></div>
  <div class="grid2 sec">
    <div><div class="sh" style="display:flex;justify-content:space-between;margin-bottom:8px"><b>Getting better</b><a class="small muted" data-go="learned">What it learned</a></div><div class="box" style="padding:14px 16px">
      <div class="small muted">Practice tasks solved, out of 50</div><div style="display:flex;align-items:baseline;gap:10px;margin-top:2px"><span class="mono" style="font-size:20px;font-weight:500">31</span><span class="small">up from 27 four weeks ago</span></div>${spark(sc.vals, 600, 46)}</div></div>
    <div><div class="sh" style="display:flex;justify-content:space-between;margin-bottom:8px"><b>PC health</b><a class="small muted" data-go="pc">Details</a></div><div class="box lst">
      <div style="grid-template-columns:10px 1fr auto"><span class="dot c"></span><span>Disk C:</span><span class="mono small">41 GB free of 237</span></div>
      <div style="grid-template-columns:10px 1fr auto"><span class="dot c"></span><span>Windows Security</span><span class="small">On · last scan yesterday</span></div>
      <div style="grid-template-columns:10px 1fr auto"><span class="dot ask"></span><span>1 cleanup suggestion</span><span class="small">1.4 GB</span></div>
    </div></div>
  </div>
  </div></div>`;
}
function spark(vals, w, h) {
  const mn = 20, mx = 35; const X = i => 4 + i * (w - 8) / (vals.length - 1); const Y = v => h - 4 - (v - mn) / (mx - mn) * (h - 8);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;margin-top:8px;width:100%;height:${h}px"><polyline fill="none" stroke="var(--ink)" stroke-width="1.4" points="${vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/>${vals.map((v, i) => D.score.kept.includes(i) ? `<rect x="${X(i) - 3}" y="${Y(v) - 3}" width="6" height="6" fill="var(--ink)"/>` : '').join('')}</svg>`;
}
function waitPage() {
  const items = (S.approvalPush ? [{ id: 'push', title: 'Push the date fix to GitHub', cmd: 'git push origin fix/date-parsing', why: 'Pushing is outside what it may do on its own. It sends 2 changed files to your repository.', undo: "Can't be undone from here", from: 'Fix the date parsing bug · 10:42', yes: 'Push' }] : []).concat(S.approvals);
  return `<div class="pg"><div class="head"><h1>Waiting for you</h1><p>Things Aetheris wants to do but isn't allowed to do on its own. Nothing here happens until you say yes.</p></div><div class="inner">
  ${items.length ? items.map(a => `<div class="box fade-in" style="margin-top:14px;padding:14px 16px">
    <div style="display:flex;gap:10px;align-items:baseline"><span class="dot ask"></span><b style="font-weight:500">${esc(a.title)}</b><span class="small muted" style="margin-left:auto">${esc(a.from)}</span></div>
    <div class="cmd mono" style="margin:10px 0 8px 17px;padding:7px 10px;background:var(--panel);border:1px solid var(--line);border-radius:4px">${esc(a.cmd)}</div>
    <div style="margin-left:17px;color:var(--ink-2)">${esc(a.why)}</div>
    <div style="margin:10px 0 0 17px;display:flex;gap:8px;align-items:center"><button class="btn primary" data-allow="${a.id}">${a.yes}</button><button class="btn" data-deny="${a.id}">No</button><span class="pill" style="margin-left:6px">${esc(a.undo)}</span></div>
  </div>`).join('') : `<div class="box" style="margin-top:14px;padding:28px;text-align:center;color:var(--muted)">Nothing is waiting. When Aetheris needs your OK, it shows up here and on the task.</div>`}
  </div></div>`;
}
function reports() {
  const list = [['today', 'Today', 'Mon 5 Oct · so far'], ['sun', 'Sunday', '4 Oct · 3 tasks'], ['sat', 'Saturday', '3 Oct · 6 tasks'], ['w40', 'Week 40', '28 Sep - 4 Oct · 31 tasks'], ['w39', 'Week 39', '21-27 Sep · 24 tasks']];
  return `<div class="rep"><div class="rl"><div class="g">Daily</div>${list.slice(0, 3).map(r => `<a data-rep="${r[0]}" class="${S.reportId === r[0] ? 'on' : ''}"><div>${r[1]}</div><div class="m">${r[2]}</div></a>`).join('')}<div class="g">Weekly</div>${list.slice(3).map(r => `<a data-rep="${r[0]}" class="${S.reportId === r[0] ? 'on' : ''}"><div>${r[1]}</div><div class="m">${r[2]}</div></a>`).join('')}</div>
  <div class="doc">${S.reportId.startsWith('w') ? weekReport() : dayReport()}</div></div>`;
}
function dayReport() {
  return `<div class="w"><h1>Today, Monday 5 October</h1><div class="sub">Written by Aetheris from its own log. Updated 10:45. Every line links to the step it came from.</div>
  <div class="box grid3" style="margin-top:18px;grid-template-columns:repeat(4,1fr)"><div class="stat"><div class="k">Tasks done</div><div class="v">4</div></div><div class="stat"><div class="k">Files changed</div><div class="v">11</div></div><div class="stat"><div class="k">You undid</div><div class="v">1</div></div><div class="stat"><div class="k">Free requests</div><div class="v">${1500 - S.freeLeft}</div></div></div>
  <h2>Done</h2><ul>
  <li><span class="dot sq"></span><span>Added a CSV export to the reports page. 3 files, 3 new tests, all 44 pass.</span></li>
  <li><span class="dot c"></span><span>Found why startup is slow: Teams, OneDrive and Adobe Updater add 41 s. Changed nothing.</span></li>
  <li><span class="dot c"></span><span>Summarised yesterday's 17 commits across 4 projects.</span></li>
  <li><span class="dot sq"></span><span>Moved 212 old log files to the Recycle Bin. <span class="muted">You undid this at 9:20; the files are back.</span></span></li></ul>
  <h2>Still going</h2><ul><li><span class="dot sq"></span><span>Fix the date parsing bug: ${R.state === 'done' ? 'finished and pushed.' : 'fix written and tested, waiting for your OK to push.'}</span></li><li><span class="dot sq"></span><span>Rename "client" to "customer": 14 of 31 files left.</span></li></ul>
  <h2>What went wrong</h2><ul><li><span class="dot bad"></span><span>Groq hit its free limit at 9:40, so 6 requests went to Gemini instead. Nothing failed because of it.</span></li><li><span class="dot bad"></span><span>Its first guess for the slow startup (antivirus scan) was wrong. It checked and corrected itself.</span></li></ul>
  <h2>What it learned today</h2><ul><li><span class="dot sq"></span><span>You don't want old logs deleted without seeing the list first. Next time it will show the list.</span></li></ul>
  </div>`;
}
function weekReport() {
  return `<div class="w"><h1>Week 40, 28 September to 4 October</h1><div class="sub">Written by Aetheris from its own log and the weekly practice run.</div>
  <div class="box grid3" style="margin-top:18px;grid-template-columns:repeat(4,1fr)"><div class="stat"><div class="k">Tasks done</div><div class="v">31</div><div class="d">27 last week</div></div><div class="stat"><div class="k">Practice score</div><div class="v">31<small> / 50</small></div><div class="d">29 last week</div></div><div class="stat"><div class="k">Changes kept</div><div class="v">2</div><div class="d">of 6 tried</div></div><div class="stat"><div class="k">You undid</div><div class="v">3</div><div class="d">of 58 changes</div></div></div>
  <h2>Biggest things</h2><ul><li><span class="dot sq"></span><span>Finished the PDF layout fixes in invoice-tool (9 tasks).</span></li><li><span class="dot sq"></span><span>Freed 6.2 GB on C: across 3 cleanups you approved.</span></li></ul>
  <h2>How it got better</h2><ul><li><span class="dot sq"></span><span>Runs failing tests first. Solved 2 more practice tasks, broke none.</span></li><li><span class="dot sq"></span><span>Uses Groq for short summaries: same quality, 3× faster.</span></li><li><span class="dot c"></span><span>Tried 4 other changes that didn't help. Not kept.</span></li></ul>
  <h2>Where it struggled</h2><ul><li><span class="dot bad"></span><span>Database migrations: 2 of 3 attempts needed your help. It will ask earlier next time.</span></li></ul></div>`;
}
function learned() {
  const sc = D.score; const W = 620, H = 150, x0 = 30, y0 = 10, y1 = 130;
  const X = i => x0 + i * (W - x0 - 20) / (sc.vals.length - 1), Y = v => y1 - (v - 20) / 15 * (y1 - y0);
  let svg = `<svg width="${W}" height="${H + 22}" style="display:block;margin-top:8px;overflow:visible">`;
  for (const g of [20, 25, 30, 35]) svg += `<line x1="${x0}" x2="${W}" y1="${Y(g)}" y2="${Y(g)}" stroke="var(--line-2)"/><text x="${x0 - 8}" y="${Y(g) + 4}" text-anchor="end" font-family="PlexMono" font-size="10.5" fill="var(--faint)">${g}</text>`;
  sc.weeks.forEach((w, i) => { svg += `<text x="${X(i)}" y="${H + 14}" text-anchor="middle" font-family="PlexMono" font-size="10.5" fill="var(--faint)">${w}</text>`; });
  svg += `<polyline points="${sc.vals.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
  sc.vals.forEach((v, i) => { svg += sc.kept.includes(i) ? `<rect x="${X(i) - 3.5}" y="${Y(v) - 3.5}" width="7" height="7" fill="var(--ink)"/>` : `<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="var(--surface)" stroke="var(--faint)"/>`; });
  svg += '</svg>';
  const st = { kept: ['kept', 'Kept', 'Undo'], no: ['no', 'Not kept', ''], mem: ['kept', 'Remembered', 'Forget'] };
  return `<div class="pg"><div class="head"><h1>What it learned</h1><p>Aetheris tries one change at a time to how it works, then reruns the same 50 practice tasks. It only keeps the change if more tasks pass and nothing that passed before breaks.</p></div>
  <div class="top" style="display:grid;grid-template-columns:1fr 260px;border-top:1px solid var(--line-2);border-bottom:1px solid var(--line-2)"><div class="chart" style="padding:16px 32px 10px"><div class="small muted">Practice tasks solved, out of 50 · <span class="dot sq"></span> a change was kept that week</div>${svg}</div>
  <div class="nums" style="border-left:1px solid var(--line-2);padding:16px 22px;display:flex;flex-direction:column;gap:14px"><div><div class="small muted">This week</div><div class="mono" style="font-size:22px;font-weight:500">31<span class="small muted"> / 50</span></div><div class="small">Up from 27 four weeks ago</div></div><div><div class="small muted">Changes tried, last 30 days</div><div class="mono" style="font-size:22px;font-weight:500">14</div><div class="small">5 kept, 9 not kept</div></div><div><div class="small muted">Practice set</div><div class="small" style="margin-top:2px">50 coding tasks, fixed since Aug 24. Aetheris can't edit them.</div></div></div></div>
  <div class="inner"><div class="sec"><div class="sh"><b>Recent changes</b><span>Every kept change can be undone</span></div><div class="box lst">
  ${D.learned.map(r => `<div style="grid-template-columns:56px 1.1fr 1.4fr 110px 56px"><span class="mono small muted">${r[0]}</span><span class="ink">${esc(r[1])}</span><span class="small" style="color:var(--ink-2)">${esc(r[2])}</span><span class="small" style="display:flex;gap:6px;align-items:center;${r[3] === 'no' ? 'color:var(--muted)' : ''}"><span class="dot ${r[3] === 'no' ? 'c' : 'sq'}"></span>${st[r[3]][1]}</span><span class="small" style="text-align:right">${st[r[3]][2] ? `<a style="text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--line)">${st[r[3]][2]}</a>` : ''}</span></div>`).join('')}
  </div></div>
  <div class="sec"><div class="sh"><b>Skills it has built</b><span>Saved ways of doing a job that worked before</span></div><div class="box lst">
  <div style="grid-template-columns:1fr 90px 110px 100px" class="small muted"><span>Skill</span><span>Used</span><span>Worked</span><span>Since</span></div>
  ${D.skills.map(s => `<div style="grid-template-columns:1fr 90px 110px 100px"><span class="ink">${s[0]}</span><span class="mono small">${s[1]}×</span><span class="mono small">${s[2]}</span><span class="mono small muted">${s[3]}</span></div>`).join('')}
  </div></div></div></div>`;
}
function memory() {
  return `<div class="pg"><div class="head"><h1>What it knows</h1><p>Everything Aetheris remembers about you and your computer. It only learns from what you tell it and what it sees while working. You can change or remove anything.</p></div><div class="inner">
  <div style="display:flex;gap:8px;margin-top:6px"><div class="input" style="flex:1;font-family:Plex">${icon('search', 13)}<span style="color:var(--faint)">Search what it knows</span></div><button class="btn" data-act="addmem">Tell it something</button><button class="btn">Export</button></div>
  <div class="box lst" style="margin-top:14px">${S.memory.map((m, i) => `<div style="grid-template-columns:110px 1fr 200px 90px" class="fade-in"><span class="pill" style="justify-self:start">${m.kind}</span><span class="ink">${esc(m.fact)}</span><span class="small muted">${esc(m.src)}</span><span class="small" style="text-align:right;display:flex;gap:10px;justify-content:flex-end"><a class="muted">Edit</a><a data-forget="${i}" class="muted">Forget</a></span></div>`).join('')}</div>
  <div class="small muted" style="margin-top:10px">Stored only on this computer in D:\\Aetheris\\memory. Never sent anywhere except as part of a task you started.</div>
  </div></div>`;
}
function pc() {
  return `<div class="pg"><div class="head"><h1>PC health</h1><p>What Aetheris sees on this computer. It only looks. Anything that would change something goes to Waiting for you first. Windows Security stays your antivirus.</p></div><div class="inner">
  <div class="box grid3" style="margin-top:8px;grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="k">Disk C:</div><div class="v">41<small> GB free</small></div><div class="meter warn"><b style="width:83%"></b></div><div class="d" style="margin-top:4px">196 of 237 GB used</div></div>
    <div class="stat"><div class="k">Memory now</div><div class="v">5.9<small> / 8 GB</small></div><div class="meter"><b style="width:74%"></b></div><div class="d" style="margin-top:4px">Chrome uses 2.1 GB</div></div>
    <div class="stat"><div class="k">Startup time</div><div class="v">74<small> s</small></div><div class="d">Was 52 s in August</div></div>
    <div class="stat"><div class="k">Windows Security</div><div class="v" style="font-size:15px;font-family:Plex;margin-top:6px">On</div><div class="d">Last quick scan yesterday, 0 threats</div></div>
  </div>
  <div class="sec"><div class="sh"><b>Suggestions</b><span>Each one asks before doing anything</span></div><div class="box lst">
    <div style="grid-template-columns:10px 1fr 120px auto"><span class="dot ask"></span><span><span class="ink">Delete 212 old log files in Downloads</span><span class="small muted" style="display:block">Older than 30 days. Go to the Recycle Bin first.</span></span><span class="mono small">1.4 GB</span><button class="btn sm" data-go="wait">Review</button></div>
    <div style="grid-template-columns:10px 1fr 120px auto"><span class="dot c"></span><span><span class="ink">Turn off Adobe Updater at startup</span><span class="small muted" style="display:block">Adds about 11 s to startup. You can turn it back on any time.</span></span><span class="mono small">−11 s</span><button class="btn sm">Suggest</button></div>
    <div style="grid-template-columns:10px 1fr 120px auto"><span class="dot c"></span><span><span class="ink">Empty the Windows temp folder</span><span class="small muted" style="display:block">Files Windows and apps no longer use.</span></span><span class="mono small">2.3 GB</span><button class="btn sm">Suggest</button></div>
  </div></div>
  <div class="sec"><div class="sh"><b>Startup apps</b><span>Measured at the last boot</span></div><div class="box lst">
    ${[['Microsoft Teams', '18.2 s', 'On'], ['OneDrive', '12.1 s', 'On'], ['Adobe Updater', '10.8 s', 'On'], ['Realtek Audio', '1.4 s', 'On'], ['Aetheris', '0.9 s', 'On']].map(r => `<div style="grid-template-columns:1fr 100px 60px"><span class="ink">${r[0]}</span><span class="mono small">${r[1]}</span><span class="small muted">${r[2]}</span></div>`).join('')}
  </div></div>
  </div></div>`;
}
function settings() {
  const tabs = [['ok', 'What needs your OK'], ['models', 'Models'], ['folders', 'Folders'], ['look', 'Appearance'], ['data', 'Your data']];
  const rule = (k, label, sub, locked) => `<div><div class="l"><b>${label}</b><span>${sub}</span></div><div>${locked ? `<span class="pill">Never. Can't be changed</span>` : `<div class="seg">${[['own', 'On its own'], ['ask', 'Ask me'], ['never', 'Never']].map(([v, l]) => `<button data-rule="${k}" data-v="${v}" class="${S.rules[k] === v ? 'on ' + v : ''}">${l}</button>`).join('')}</div>`}</div></div>`;
  let body = '';
  if (S.settingsTab === 'ok') body = `<div class="form">
    ${rule('edit', 'Change files in your project folders', 'Every change can be undone')}
    ${rule('cmd', 'Run commands that change things', 'Like installing packages or moving files')}
    ${rule('push', 'Push to GitHub', "Can't be undone from Aetheris")}
    ${rule('install', 'Install programs or packages', '')}
    ${rule('delete', 'Delete files', 'Always goes to the Recycle Bin first')}
    ${rule('network', 'Look things up on the web', 'Read only, from sites it trusts')}
    ${rule('outside', 'Touch system files, Windows Security, or the registry', '', true)}
    ${rule('outside', 'Change its own safety checks or practice tasks', '', true)}
  </div>`;
  if (S.settingsTab === 'models') body = `<div class="form">
    <div><div class="l"><b>Order to try</b><span>If one is busy or out of free requests, it moves to the next</span></div><div class="box lst">${[['1', 'Google Gemini 2.5 Flash', 'Key saved', '412 of 1,500 used today'], ['2', 'Groq Llama 3.3 70B', 'Key saved', 'Limit reached, resets 5:30 am'], ['3', 'OpenRouter (free models)', 'No key', '']].map(r => `<div style="grid-template-columns:20px 1fr 90px 190px"><span class="mono small muted">${r[0]}</span><span class="ink">${r[1]}</span><span class="small ${r[2] === 'No key' ? 'muted' : ''}">${r[2]}</span><span class="small muted">${r[3]}</span></div>`).join('')}</div></div>
    <div><div class="l"><b>Daily limit</b><span>Stops before you'd be charged</span></div><div><div class="input" style="width:160px">1,500 requests</div></div></div>
    <div><div class="l"><b>Small local model</b><span>For tiny jobs when you're offline</span></div><div><span class="toggle"></span> <span class="small muted" style="margin-left:6px">Off · needs about 2 GB of memory</span></div></div>
    <div><div class="l"><b>Hide secrets before sending</b><span>Keys, passwords, emails, and your user folder are removed from anything sent to a model</span></div><div><span class="pill">Always on</span></div></div></div>`;
  if (S.settingsTab === 'folders') body = `<div class="form"><div><div class="l"><b>Folders it can work in</b><span>It can't read or change anything outside these</span></div><div class="box lst">${['D:\\projects', 'D:\\Users\\you\\Downloads', 'D:\\Aetheris'].map(f => `<div style="grid-template-columns:1fr auto"><span class="mono small">${f}</span><a class="small muted">Remove</a></div>`).join('')}</div><button class="btn sm" style="margin-top:8px">Add folder</button></div><div><div class="l"><b>Never touch</b><span>Even inside the folders above</span></div><div class="box lst"><div style="grid-template-columns:1fr auto"><span class="mono small">D:\\Finance</span><a class="small muted">Remove</a></div></div></div></div>`;
  if (S.settingsTab === 'look') body = `<div class="form"><div><div class="l"><b>Theme</b></div><div class="seg">${['light', 'dark'].map(t => `<button data-theme="${t}" class="${S.theme === t ? 'on' : ''}">${t === 'light' ? 'Light' : 'Dark'}</button>`).join('')}</div></div><div><div class="l"><b>Show its thinking</b><span>The short notes it writes while working</span></div><div><span class="toggle on"></span></div></div><div><div class="l"><b>Reduce motion</b><span>Follows Windows by default</span></div><div><span class="toggle"></span></div></div></div>`;
  if (S.settingsTab === 'data') body = `<div class="form"><div><div class="l"><b>Export everything</b><span>History, what it knows, skills, settings. One zip file.</span></div><div><button class="btn">Export</button></div></div><div><div class="l"><b>Where it's stored</b></div><div class="mono small">D:\\Aetheris (412 MB)</div></div><div><div class="l"><b>Start over</b><span>Deletes everything it learned. Your files are not touched.</span></div><div><button class="btn" style="color:var(--stop)">Reset Aetheris</button></div></div></div>`;
  return `<div class="pg"><div class="head"><h1>Settings</h1></div><div style="display:flex;gap:2px;padding:0 32px;border-bottom:1px solid var(--line)">${tabs.map(([k, l]) => `<a data-stab="${k}" style="padding:8px 10px;margin-bottom:-1px;border-bottom:2px solid ${S.settingsTab === k ? 'var(--ink)' : 'transparent'};color:${S.settingsTab === k ? 'var(--ink)' : 'var(--muted)'}">${l}</a>`).join('')}</div><div class="inner" style="max-width:900px">${body}</div></div>`;
}
function newTask() {
  return `<div class="pg" style="display:flex;align-items:flex-start;justify-content:center"><div style="width:640px;margin-top:120px">
  <h1 style="font-size:18px;font-weight:600">What should it do?</h1>
  <div class="box" style="margin-top:12px;padding:12px 14px;min-height:96px;color:var(--faint)">Describe the task in your own words. It will show you a plan before changing anything.</div>
  <div style="display:flex;gap:8px;margin-top:10px;align-items:center"><span class="small muted">Work in</span><span class="input" style="height:26px">D:\\projects\\invoice-tool</span><span style="margin-left:auto" class="kbdhint">Ctrl Enter to start</span><button class="btn primary">Start</button></div>
  <div class="small muted" style="margin-top:28px">Things you often ask</div>
  <div class="box lst" style="margin-top:6px">${['Fix the failing tests in invoice-tool', 'Why is my PC slow right now?', "Summarise yesterday's commits", 'Free up space on C:'].map(t => `<a style="grid-template-columns:1fr auto"><span>${t}</span><span class="kbdhint">↵</span></a>`).join('')}</div>
  </div></div>`;
}

/* ---------- palette ---------- */
const CMDS = [['Go to', 'Home', 'home', 'G H'], ['Go to', 'Waiting for you', 'wait', 'G W'], ['Go to', 'Reports', 'reports', 'G R'], ['Go to', 'What it learned', 'learned', 'G L'], ['Go to', 'What it knows', 'memory', 'G K'], ['Go to', 'PC health', 'pc', 'G P'], ['Go to', 'Settings', 'settings', 'G S'], ['Do', 'New task', 'new', 'Ctrl N'], ['Do', 'Switch light / dark', 'theme', 'Ctrl Shift L'], ['Do', 'Replay the live demo', 'replay', ''], ['Tasks', 'Fix the date parsing bug in invoices', 'task:date', ''], ['Tasks', 'Rename "client" to "customer" everywhere', 'task:rename', ''], ['Tasks', 'Add a CSV export to the reports page', 'task:csv', '']];
let palSel = 0;
function palette(open) {
  const sc = $('#scrim'); sc.classList.toggle('open', open);
  if (open) { $('#palq').value = ''; palSel = 0; palRender(); setTimeout(() => $('#palq').focus(), 0); }
}
function palRender() {
  const q = $('#palq').value.toLowerCase(); const items = CMDS.filter(c => c[1].toLowerCase().includes(q));
  palSel = Math.min(palSel, Math.max(0, items.length - 1));
  let g = ''; $('#palres').innerHTML = items.map((c, i) => { const h = c[0] !== g ? `<div class="g">${c[0]}</div>` : ''; g = c[0]; return `${h}<a data-cmd="${c[2]}" class="${i === palSel ? 'on' : ''}">${c[1]}<kbd>${c[3]}</kbd></a>`; }).join('') || '<div class="g">No matches</div>';
  palette.items = items;
}
function runCmd(c) {
  palette(false);
  if (c === 'theme') return setTheme(S.theme === 'dark' ? 'light' : 'dark');
  if (c === 'replay') { S.page = 'task'; S.taskId = 'date'; render(); return playDate(); }
  if (c.startsWith('task:')) { S.page = 'task'; S.taskId = c.slice(5); return render(); }
  S.page = c; render();
}

/* ---------- toast ---------- */
let toastT;
function toast(msg, action, fn) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<a id="toastact">${action}</a>` : ''}`; t.classList.add('show');
  if (action) $('#toastact').onclick = () => { fn(); t.classList.remove('show'); };
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4200);
}

/* ---------- main render ---------- */
function setTheme(t) { S.theme = t; localStorage.setItem('ae-theme', t); document.body.className = t; render(); }
function render() {
  const pages = { home, wait: waitPage, reports, learned, memory, pc, settings, new: newTask, task: taskView };
  $('#root').innerHTML = `<div class="app">${barHTML()}<div class="main">${sideHTML()}<div class="view">${(pages[S.page] || home)()}</div></div></div>`;
  if (S.page === 'task' && S.taskId === 'date') renderTaskInner();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-task],[data-act],[data-step],[data-undo],[data-redo],[data-allow],[data-deny],[data-rep],[data-stab],[data-rule],[data-theme],[data-cmd],[data-forget]');
  if (!t) { if (e.target.id === 'scrim') palette(false); return; }
  const ds = t.dataset;
  if (ds.cmd) return runCmd(ds.cmd);
  if (ds.undo) { e.stopPropagation(); return undoStep(ds.undo); }
  if (ds.redo) { e.stopPropagation(); return redo(ds.redo); }
  if (ds.go) { S.page = ds.go; return render(); }
  if (ds.task) { S.page = 'task'; S.taskId = ds.task; return render(); }
  if (ds.rep) { S.reportId = ds.rep; return render(); }
  if (ds.stab) { S.settingsTab = ds.stab; return render(); }
  if (ds.rule) { S.rules[ds.rule] = ds.v; render(); return toast(`Saved. ${t.textContent} from now on.`); }
  if (ds.theme) return setTheme(ds.theme);
  if (ds.forget) { const m = S.memory.splice(+ds.forget, 1)[0]; render(); return toast('Forgotten.', 'Undo', () => { S.memory.splice(+ds.forget, 0, m); render(); }); }
  if (ds.allow || ds.deny) {
    const id = ds.allow || ds.deny;
    if (id === 'push') { if (ds.allow) { S.page = 'task'; S.taskId = 'date'; render(); return doPush(false); } return notNow(); }
    const a = S.approvals.find(x => x.id === id); S.approvals = S.approvals.filter(x => x.id !== id); render();
    return toast(ds.allow ? `Done: ${a.title.toLowerCase()}.` : 'OK, it won\'t do that.', ds.allow ? 'Undo' : null, () => { S.approvals.unshift(a); render(); });
  }
  if (ds.step) { if (t.classList.contains('you')) return; R.sel = R.sel === ds.step ? null : ds.step; R.follow = !R.sel; return renderTaskInner(); }
  const a = ds.act;
  if (a === 'palette') return palette(true);
  if (a === 'theme') return setTheme(S.theme === 'dark' ? 'light' : 'dark');
  if (a === 'push') return doPush(false);
  if (a === 'always') return doPush(true);
  if (a === 'notnow') return notNow();
  if (a === 'pause') { R.paused = !R.paused; return renderTaskInner(); }
  if (a === 'stop') { R.gen++; R.state = 'stopped'; R.steps.forEach(s => s.live = false); add({ kind: 'stop', title: 'You stopped it', sub: 'Changes made so far are kept. Undo any of them below.' }); return render(); }
  if (a === 'replay') return playDate();
  if (a === 'speed') { R.speed = R.speed === 1 ? 3 : R.speed === 3 ? 10 : 1; return renderTaskInner(); }
  if (a === 'addmem') { S.memory.unshift({ fact: 'Invoices for Indian clients use DD/MM/YYYY and INR.', src: 'You told it · just now', kind: 'Preference' }); render(); return toast('Saved. It will use this from now on.'); }
});
document.addEventListener('input', e => { if (e.target.id === 'palq') { palSel = 0; palRender(); } });
let gPending = false;
document.addEventListener('keydown', e => {
  const open = $('#scrim').classList.contains('open');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return palette(!open); }
  if (open) {
    if (e.key === 'Escape') return palette(false);
    if (e.key === 'ArrowDown') { palSel++; palRender(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { palSel = Math.max(0, palSel - 1); palRender(); e.preventDefault(); }
    if (e.key === 'Enter' && palette.items[palSel]) runCmd(palette.items[palSel][2]);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); S.page = 'new'; return render(); }
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); return setTheme(S.theme === 'dark' ? 'light' : 'dark'); }
  if (S.approvalPush && S.page === 'task') { if (e.key === 'y') return doPush(false); if (e.key === 'n') return notNow(); }
  if (S.page === 'task' && e.key === ' ' && R.state === 'running') { e.preventDefault(); R.paused = !R.paused; return renderTaskInner(); }
  if (gPending) { gPending = false; const m = { h: 'home', w: 'wait', r: 'reports', l: 'learned', k: 'memory', p: 'pc', s: 'settings' }[e.key]; if (m) { S.page = m; render(); } return; }
  if (e.key === 'g') { gPending = true; setTimeout(() => gPending = false, 900); }
});

/* ---------- boot ---------- */
document.body.className = S.theme;
document.body.insertAdjacentHTML('beforeend', `<div id="scrim" class="scrim"><div class="pal"><div class="in">${icon('search')}<input id="palq" placeholder="Search or run a command" autocomplete="off"></div><div class="res" id="palres"></div></div></div><div id="toast" class="toast"></div>`);
render();
const jump = params.get('at'); // for screenshots: run demo fast to a point
if (jump) playDate();
else if (params.get('demo') !== '0') playDate();
if (params.get('palette')) palette(true);
})();

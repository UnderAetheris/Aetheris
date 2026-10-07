/* Aetheris prototype v0.9. Vanilla JS, no build step. Simulated run, sample data. */
(() => {
const D = window.DATA, I = window.ICONS;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ic = (n, cls = '') => (I[n] || '').replace('<svg ', `<svg class="${cls}" aria-hidden="true" `);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const params = new URLSearchParams(location.search);
const typing = () => /INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;

/* ---------- state ---------- */
const LEVELS = [
  ['Read only', 'Read only', 'Reads files and the web. Suggests changes but never makes them.'],
  ['Ask first', 'Ask before changes', 'Reads files in your folders. Asks before editing, installing, deleting or pushing.'],
  ['Edit files', 'Edits files', 'Edits files in your folders. Still asks before installing, deleting or pushing.'],
];
const FOLDERS = [['invoice-tool', 'invoice-tool', 'D:\\projects\\invoice-tool', ''], ['website', 'website', 'D:\\projects\\website', ''], ['projects', 'All projects', 'D:\\projects', ''], ['pick', 'Choose a folder\u2026', 'Only folders you add can be used', '']];
const S = {
  view: params.get('view') || 'home',
  theme: params.get('theme') || localStorage.getItem('ae-theme') || 'dark',
  needs: D.needs.slice(), queue: D.queue.slice(), changed: D.changed.map(c => Object.assign({}, c)),
  away: false, level: 1, allPaused: false, model: 'auto', mode: 'do', folder: 'invoice-tool', perm: 1, dIdx: 0,
  act: [0,1,0,2,3,1,0,0,2,4,3,2,1,0,1,3,5,2,1,2,0,0,1,2,4,6,3,2,1,3,2,1,0,2,3,1], actNow: 0, plan: null, extra: [], queueNext: false,
  run: { steps: [], plan: 0, status: 'live', paused: false, speed: 1, clock: 0, sel: null, follow: true, tab: 'changes', ask: null, done: false },
  rename: { file: 3, total: 14, paused: false },
};
const R = S.run;
document.documentElement.dataset.theme = S.theme;

/* ---------- logo ---------- */
const MARK = `<svg class="mark" viewBox="0 0 24 24" aria-label="Aetheris"><rect width="24" height="24" rx="7.5" fill="var(--text)"/><path d="M6.5 16.5 12 12l5.5-4.5" stroke="var(--panel)" stroke-width="1.5" fill="none"/><circle cx="6.5" cy="16.5" r="2.2" fill="var(--text)" stroke="var(--panel)" stroke-width="1.5"/><circle cx="12" cy="12" r="2.2" fill="var(--text)" stroke="var(--panel)" stroke-width="1.5"/><rect x="15.3" y="5.3" width="4.4" height="4.4" rx="1.1" fill="var(--live)"/></svg>`;

/* ---------- shell ---------- */
const NAV = [['home', 'home', 'Home'], ['tasks', 'tasks', 'Tasks'], ['needs', 'inbox', 'Approvals'], ['reports', 'report', 'Reports'], ['learned', 'learn', 'Progress'], ['knows', 'memory', 'Memory'], ['skills', 'skills', 'Skills'], ['pc', 'pc', 'PC health'], ['settings', 'settings', 'Settings']];
const TABS_SHOWN = ['home', 'tasks', 'needs', 'reports', 'learned', 'knows', 'skills', 'pc'];
const needsList = () => (R.ask ? [{ id: 'push', title: 'Push the date fix to GitHub', src: 'Fix the date parsing bug', when: 'just now', cmd: 'git push origin fix/date-parsing', facts: [['branch', 'Creates a branch. Nothing is merged into main.'], ['refresh', 'Undo: delete the branch']], det: [['src/invoice/dates.py', '+8 \u22123'], ['tests/test_dates.py', '+5']], yes: 'Push', chg: 'Pushed fix/date-parsing to GitHub' }] : []).concat(S.needs);

function shell() {
  document.body.innerHTML = `
  <div class="app">
    <aside class="con" aria-label="Aetheris">
      <div class="con-h">${MARK}<b>Aetheris</b><span class="state" id="state"><i></i><span></span></span></div>
      <div class="pulse-box" title="Each bar is 2 seconds. Height = number of steps and edits."><div class="bars" id="bars">${S.act.map(() => '<i></i>').join('')}</div><div class="cap"><span>Activity \u00b7 72 s</span><b id="actN">0 actions</b></div><div class="btip" id="btip"></div></div>
      <div class="con-scroll">
        <div class="grp"><div class="grp-h">RUNNING<span class="n" id="nowN"></span></div><div id="nowList"></div></div>
        <div class="grp"><div class="grp-h">QUEUE<span class="n" id="qN"></span><span class="hint">drag to reorder</span></div><div id="qList"></div><button class="addq" data-act="new">${ic('plus')}Add task</button></div>
        <div class="doneline" data-go="tasks">${ic('check')}<span id="doneN"></span><span class="chev">${ic('right')}</span></div><div class="failline" id="failLine" data-act="toProblems"></div>
      </div>
      <div class="ctrl">
        <div><div class="lbl">Permissions</div>
          <div class="level" id="level" role="radiogroup" aria-label="Permissions"><span class="knob"></span>${LEVELS.map((l, i) => `<button role="radio" data-level="${i}">${l[0]}</button>`).join('')}</div>
          <div class="level-d" id="levelD"></div></div>
        <div id="quota"></div>
        <button class="kill" id="kill" data-act="killall"></button>
      </div>
      <div class="me"><span class="av">U</span>UnderAetheris<span class="sp"></span><button class="iconbtn" data-act="theme" aria-label="Switch theme" id="themeB">${ic(S.theme === 'dark' ? 'sun' : 'moon')}</button><button class="iconbtn" data-go="settings" aria-label="Settings">${ic('settings')}</button></div>
    </aside>
    <main class="main">
      <header class="top"><nav class="tabs-nav" id="tabsNav"><span class="ind"></span>${TABS_SHOWN.map(id => { const n = NAV.find(x => x[0] === id); return `<a data-go="${id}">${n[2]}${id === 'needs' ? '<span class="n" id="needN"></span>' : ''}</a>`; }).join('')}</nav>
        <span class="sp"></span><button class="searchbtn" data-act="palette">${ic('search')}Search<kbd>Ctrl K</kbd></button></header>
      <div class="pausebar" id="pausebar">${ic('stopall')}<span><b>All tasks are paused.</b> Nothing runs or changes until you resume.</span><button class="btn live sm" data-act="killall">${ic('play')}Resume all</button></div><div class="netbar" id="netbar"></div>
      <section class="view" id="view"></section>
    </main>
  </div><div class="toasts" id="toasts"></div>`;
  paintLevel(); paintKill(); paintQueue(); paintSide(); paintBars(); paintNet(); paintQuota(); barsInteract();
  new ResizeObserver(() => moveInd(false)).observe($('#tabsNav'));
}
function topbar() { $$('#tabsNav a').forEach(a => a.classList.toggle('on', a.dataset.go === S.view || (S.view === 'task' && a.dataset.go === 'tasks'))); moveInd(true); }
function moveInd(anim) {
  const on = $('#tabsNav a.on'), ind = $('#tabsNav .ind'); if (!ind) return;
  if (!anim) ind.style.transition = 'none';
  if (on) { ind.style.opacity = 1; ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`; } else ind.style.opacity = 0;
  if (!anim) { void ind.offsetWidth; ind.style.transition = ''; }
}
function paintLevel() {
  $$('#level button').forEach(b => { const on = +b.dataset.level === S.level; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $('#level .knob').style.transform = `translateX(${S.level * 100}%)`;
  $('#levelD').textContent = LEVELS[S.level][2];
}
function paintKill() {
  const k = $('#kill');
  k.className = 'kill' + (S.allPaused ? ' resume' : '');
  k.innerHTML = S.allPaused ? `${ic('play')}Resume all<kbd>Ctrl \u21e7 P</kbd>` : `${ic('stopall')}Pause all<kbd>Ctrl \u21e7 P</kbd>`;
  $('#pausebar').classList.toggle('on', S.allPaused);
  document.body.classList.toggle('paused-all', S.allPaused);
}
function paintModelChip() { if (!$('#modelChip')) return; const p = D.providers.find(x => x[0] === S.model); $('#modelChip').innerHTML = `${ic('bolt')}<span>${p[0] === 'auto' ? 'Auto' : p[1]}</span><span class="meter"><i style="width:72%"></i></span><span class="mono faint">1,085 left</span>${ic('down', 'chev')}`; }
function ring(p, cls) { return `<svg class="ring ${cls}" viewBox="0 0 16 16"><circle class="bg" cx="8" cy="8" r="6"/><circle class="fg" cx="8" cy="8" r="6" stroke-dasharray="37.7" stroke-dashoffset="${37.7 * (1 - p)}" transform="rotate(-90 8 8)"/></svg>`; }
function paintSide() {
  const n = needsList().length;
  const el = $('#needN'); if (el) { el.textContent = n; el.style.display = n ? '' : 'none'; }
  const st = $('#state');
  if (st) {
    const [cls, txt] = S.allPaused ? ['paused', 'Paused'] : blocked() ? ['paused', 'Offline'] : R.ask ? ['ask', 'Waiting'] : S.problems.length ? ['bad', plural(S.problems.length, 'problem')] : !runCount() ? ['paused', 'Idle'] : ['', 'Running'];
    st.className = 'state ' + cls; st.lastChild.textContent = txt;
  }
  const pct = Math.min(1, (R.plan + (R.done ? 1 : .5)) / 6), rp = S.rename.file / S.rename.total;
  const dPaused = R.paused || S.allPaused, rPaused = S.rename.paused || S.allPaused;
  const items = [];
  if (!R.done && !S.first) items.push(`<div class="ti ${S.view === 'task' ? 'on' : ''}" data-go="task">${ring(pct, R.ask ? 'ask' : dPaused ? 'paused' : '')}<div><div class="t">Fix the date parsing bug in invoices</div><div class="m ${R.ask ? 'ask' : ''}">${R.ask ? 'Waiting for approval' : dPaused ? 'Paused' : blocked() ? 'Waiting for internet' : esc(R.now || 'Starting')}</div></div>
    <div class="tools"><button class="mini" data-act="pause" aria-label="${R.paused ? 'Resume' : 'Pause'}">${ic(R.paused ? 'play' : 'pause')}</button></div></div>`);
  if (S.stuck) items.push(`<div class="ti" data-act="toProblems">${ring(.4, 'ask')}<div><div class="t">${esc(S.stuck.t)}</div><div class="m ask">No progress for 6 min</div></div><div class="tools"><button class="mini" data-pact="stop:${S.stuck.id}" aria-label="Stop" title="Stop">${ic('stop')}</button></div></div>`);
  if (!S.rename.off) items.push(`<div class="ti">${ring(rp, rPaused ? 'paused' : '')}<div><div class="t">Rename \u201cclient\u201d to \u201ccustomer\u201d</div><div class="m">${rPaused ? 'Paused' : blocked() ? 'Waiting for internet' : `Editing file ${S.rename.file} of ${S.rename.total}`}</div></div>
    <div class="tools"><button class="mini" data-act="pauseRename" aria-label="${S.rename.paused ? 'Resume' : 'Pause'}">${ic(S.rename.paused ? 'play' : 'pause')}</button></div></div>`);
  S.extra.forEach(x => items.push(`<div class="ti" data-xid="${x.id}">${ring(x.p, S.allPaused || x.paused ? 'paused' : '')}<div><div class="t">${esc(x.t)}</div><div class="m">${S.allPaused || x.paused ? 'Paused' : x.step}</div></div>
    <div class="tools"><button class="mini" data-xpause="${x.id}" aria-label="${x.paused ? 'Resume' : 'Pause'}">${ic(x.paused ? 'play' : 'pause')}</button></div></div>`));
  $('#nowList').innerHTML = items.join('') || '<div class="faint" style="font-size:12.5px;padding:4px 8px">Nothing running.</div>';
  const fl = $('#failLine'), fn = failedN(); fl.style.display = fn ? '' : 'none'; fl.innerHTML = `${ic('fail')}<span>${fn} failed today</span><span class="chev">${ic('right')}</span>`;
  $('#nowN').textContent = runCount();
  const dn = doneBase() + (R.done ? 1 : 0) + (S.doneX || 0); $('#doneN').textContent = dn ? `${dn} completed today` : 'None completed yet';
  const dl = $('.doneline'); if (dl) dl.dataset.go = R.done ? 'task' : 'tasks';
}
function paintQueue() {
  paintBrief();
  $('#qN').textContent = S.queue.length;
  $('#qList').innerHTML = S.queue.map((q, i) => `<div class="ti q" draggable="true" data-q="${q.id}"><span class="grip">${ic('grip')}</span><span class="pos">${i + 1}</span><div><div class="t">${esc(q.t)}</div><div class="m">${esc(q.m)}</div></div>
    <div class="tools">${i ? `<button class="mini" data-qtop="${q.id}" aria-label="Move to top" title="Move to top">${ic('up')}</button>` : ''}<button class="mini" data-qdel="${q.id}" aria-label="Remove" title="Remove">${ic('x')}</button></div></div>`).join('') || '<div class="faint" style="font-size:12.5px;padding:4px 8px">Queue is empty.</div>';
}
const runCount = () => (R.done || S.first ? 0 : 1) + (S.rename.off ? 0 : 1) + S.extra.length + (S.stuck ? 1 : 0);
function bump(n = 1, l, task = 'date') { if (ff && evN < ff) return; S.actNow += n; if (l) S.actNowL.push({ l: String(l).replace(/<[^>]+>/g, ''), task }); }
function paintBars() {
  const max = Math.max(6, ...S.act);
  $$('#bars i').forEach((b, i) => { const v = S.act[i]; b.style.height = (v ? 5 + Math.sqrt(v / max) * 25 : 2) + 'px'; b.className = v ? (R.ask && i === S.act.length - 1 ? 'ask' : 'on') : ''; });
  const tot = S.act.reduce((a, b) => a + b, 0); $('#actN').textContent = tot ? `${tot} actions` : 'Idle';
}
setInterval(() => { S.act.push(S.allPaused ? 0 : S.actNow); S.act.shift(); S.actL.push(S.allPaused ? [] : S.actNowL.slice(0, 6)); S.actL.shift(); S.actNow = 0; S.actNowL = []; paintBars(); }, 2000);

/* ---------- router ---------- */
function go(v) {
  S.view = v; closePop();
  const view = $('#view'); view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
  view.scrollTop = 0; mounted = null;
  if (v === 'home') home(); else if (v === 'task') task(); else if (v === 'needs') approvals(); else if (v === 'settings') settings(); else placeholder(v);
  topbar(); paintSide();
}

/* ---------- popover ---------- */
let popEl = null;
function closePop() { if (popEl) { popEl.remove(); popEl = null; $$('.chip.open').forEach(c => c.classList.remove('open')); } }
function pop(anchor, title, opts, cur, pick) {
  const was = popEl && popEl.anchor === anchor; closePop(); if (was) return;
  const p = document.createElement('div'); p.className = 'pop'; p.anchor = anchor; p.setAttribute('role', 'listbox');
  p.innerHTML = `<h6>${title}</h6>` + opts.map(o => `<div class="o ${o[0] === cur ? 'sel' : ''}" data-o="${o[0]}" role="option"><span class="ck">${o[0] === cur ? ic('check') : ''}</span><div><div class="t">${esc(o[1])}</div>${o[2] ? `<div class="d">${esc(o[2])}</div>` : ''}</div>${o[3] ? `<span class="r">${esc(o[3])}</span>` : '<span></span>'}</div>`).join('');
  document.body.appendChild(p); popEl = p; anchor.classList.add('open');
  const r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
  let left = Math.min(r.left, innerWidth - w - 12), top = r.bottom + 6;
  if (top + h > innerHeight - 12) { top = r.top - h - 6; p.style.transformOrigin = 'bottom left'; }
  p.style.left = left + 'px'; p.style.top = top + 'px';
  p.addEventListener('click', e => { const o = e.target.closest('.o'); if (o) { closePop(); pick(o.dataset.o); } });
}

/* ---------- home ---------- */
const MODES = [['do', 'play', 'Task'], ['plan', 'route', 'Plan'], ['ask', 'msg', 'Question']];
function home() {
  const d = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#view').innerHTML = `<div class="home">
    <div class="hello"><div class="date">${d}</div><h1 id="headline"></h1><p id="brief"></p></div>
    <div id="awayBox"></div><div id="setupBox"></div>
    <div class="card composer" id="composer">
      <div class="modes" role="tablist">${MODES.map(([id, i, l]) => `<button role="tab" data-mode="${id}" class="${S.mode === id ? 'on' : ''}">${ic(i)}${l}</button>`).join('')}</div>
      <textarea id="ask" rows="1" placeholder="${placeholderFor()}" aria-label="Task or question"></textarea>
      <div class="bar"><button class="chip" data-pop="folder" id="folderChip"></button><button class="chip" data-pop="perm" id="permChip"></button><button class="chip" data-pop="model2" id="model2Chip"></button><button class="iconbtn" aria-label="Attach a file" data-act="attach">${ic('clip')}</button><span class="sp"></span><span class="faint" style="font-size:12px;margin-right:10px" id="enterHint"></span><button class="send" id="send" disabled aria-label="Run">${ic('up')}</button></div>
      <div class="before" id="before"><div><div class="in" id="beforeIn"></div></div></div>
    </div>
    ${S.first ? `<div class="sugg">${EXAMPLES.map(([i, t]) => `<button data-sugg="${esc(t)}">${ic(i)}${esc(t)}</button>`).join('')}</div>` : ''}
    <div id="planBox"></div>
    <div id="probBox"></div>
    <div class="grid">
      <section><div class="sec-h"><h2>Approvals</h2><span class="c ask" id="needC"></span><div class="r" id="dnav"></div></div><div id="dstack"></div></section>
      <section><div class="sec-h"><h2>Changes today</h2><span class="c" id="chgC"></span><button class="linkbtn" data-act="openHistory">${ic('scroll')}History</button><button class="linkbtn" data-act="undoSince" id="undoSince">${ic('history')}Undo since\u2026</button></div><div class="card chg" id="chg"></div></section>
    </div></div>`;
  const ta = $('#ask'), comp = $('#composer');
  ta.addEventListener('focus', () => comp.classList.add('focus'));
  ta.addEventListener('blur', () => comp.classList.remove('focus'));
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'; $('#send').disabled = !ta.value.trim(); paintBefore(); });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e.altKey); } });
  $('#send').addEventListener('click', () => submit(false));
  paintChips(); paintBefore(); paintNeeds(); paintChanged(); paintPlan(); paintProblems(); paintAwayCard(); paintSetup();
}
function placeholderFor() { return { do: 'Describe a task\u2026', plan: 'Describe a task. You review the plan before it runs\u2026', ask: 'Ask a question. No files are changed\u2026' }[S.mode]; }
function paintChips() {
  const f = FOLDERS.find(x => x[0] === S.folder);
  $('#folderChip').innerHTML = `${ic('folder')}${esc(f[1])}${ic('down', 'chev')}`;
  $('#permChip').innerHTML = `${ic('shield')}${LEVELS[S.perm][1]}${ic('down', 'chev')}`;
  $('#permChip').style.display = S.mode === 'ask' ? 'none' : '';
  const p = D.providers.find(x => x[0] === S.model);
  $('#model2Chip').innerHTML = `${ic('bolt')}${p[0] === 'auto' ? 'Model: Auto' : esc(p[1])}${ic('down', 'chev')}`;
  $('#enterHint').innerHTML = S.queueNext ? '<kbd>Enter</kbd> add to queue' : `<kbd>Enter</kbd> ${S.mode === 'plan' ? 'plan' : S.mode === 'ask' ? 'ask' : 'run'}<span class="sep"></span><kbd>Alt Enter</kbd> queue`;
}
function paintBefore(flashKey) {
  const ta = $('#ask'); if (!ta) return;
  const on = !!ta.value.trim(); $('#before').classList.toggle('on', on);
  const f = FOLDERS.find(x => x[0] === S.folder), p = D.providers.find(x => x[0] === S.model);
  const starts = S.queueNext ? `After ${S.queue.length} queued task${S.queue.length === 1 ? '' : 's'}` : S.mode === 'plan' ? 'After you approve the plan' : S.mode === 'ask' ? 'Now \u00b7 no task is created' : S.allPaused ? 'When you resume' : `Now \u00b7 ${runCount()} other task${runCount() === 1 ? '' : 's'} running`;
  const cells = [['clock', 'Starts', starts], ['folder', 'Folder', f[2]], ['shield', 'Permissions', S.mode === 'ask' ? 'Read only' : LEVELS[S.perm][1]], ['bolt', 'Model', `${p[0] === 'auto' ? 'Auto' : p[1]} \u00b7 ~${S.mode === 'ask' ? 2 : 12} requests`]];
  $('#beforeIn').innerHTML = cells.map(([i, k, v], n) => `<div><div class="k">${ic(i)}${k}</div><div class="v ${flashKey === n ? 'flash' : ''}">${esc(v)}</div></div>`).join('');
}
function submit(toQueue) {
  const ta = $('#ask'), text = ta.value.trim(); if (!text) return;
  toQueue = toQueue || S.queueNext; S.queueNext = false;
  if (S.mode === 'plan' && !toQueue) return showPlan(text);
  ta.value = ''; ta.dispatchEvent(new Event('input')); paintChips();
  if (S.mode === 'ask' && !toQueue) return showAnswer(text);
  if (toQueue) return enqueue(text, `${S.folder} \u00b7 ${LEVELS[S.perm][1].toLowerCase()}`);
  startExtra(text);
}
function enqueue(text, m) {
  const q = { id: 'n' + Date.now(), t: text, m };
  S.queue.unshift(q); paintQueue(); flashQueue(q.id);
  toast(ic('check') + 'Added to the queue.', () => { S.queue = S.queue.filter(x => x !== q); paintQueue(); });
}
const XSTEPS = ['Reading files', 'Finding what to change', 'Editing files', 'Running tests', 'Writing the summary'];
function startExtra(text, from) {
  const x = { id: 'x' + Date.now(), t: text, p: 0, paused: false, step: XSTEPS[0] };
  S.extra.push(x); S.setup.run = true; paintSetup(); paintSide(); paintLives(); paintBrief(); bump(2, 'Started: ' + text, x.id);
  if (from !== 'quiet') toast(ic('play') + (S.allPaused ? 'Task added. It starts when you resume.' : 'Task started.'), () => { S.extra = S.extra.filter(y => y !== x); paintSide(); paintLives(); });
  return x;
}
function flashQueue(id) { const el = $(`[data-q="${id}"]`); if (el) { el.style.animation = 'fresh 1.6s var(--ease-out)'; } }
function showAnswer(text) {
  $('#planBox').innerHTML = `<div class="card planrev"><div class="h">${ic('msg')}<b>${esc(text)}</b><span class="sp"></span><button class="mini" data-act="closePlan" aria-label="Close">${ic('x')}</button></div><div class="sub" id="ans"></div></div>`;
  const msg = 'Sample answer. In the desktop app the answer streams in here, with links to the files and pages it is based on. One click turns it into a task.';
  let i = 0; const t = setInterval(() => { i += 3; const a = $('#ans'); if (!a) return clearInterval(t); a.innerHTML = esc(msg.slice(0, i)) + (i < msg.length ? '<span class="caret"></span>' : ''); if (i >= msg.length) clearInterval(t); }, 24);
}
function showPlan(text) {
  const changePerm = S.perm === 0 ? 'look' : S.perm === 1 ? 'ask' : 'auto';
  S.plan = { text, steps: [['Read the relevant files', 'look', true], ['Find what to change', 'look', true], ['Edit the files', changePerm, true], ['Run the tests', 'look', true], ['Write a summary', 'look', true]].map((s, i) => ({ id: 'p' + i, t: s[0], perm: s[1], on: s[2] })) };
  paintPlan();
}
const PERM = { look: 'read only', ask: 'ask first', auto: 'automatic' };
function paintPlan() {
  const P = S.plan, box = $('#planBox'); if (!P) { box.innerHTML = ''; return; }
  const active = P.steps.filter(s => s.on), askAt = active.findIndex(s => s.perm === 'ask');
  box.innerHTML = `<div class="card planrev"><div class="h">${ic('route')}<b>Plan: ${esc(P.text)}</b><span class="tag">${active.length} steps</span><span class="sp"></span><button class="mini" data-act="closePlan" aria-label="Close">${ic('x')}</button></div>
    <div class="sub">Drag to reorder. Click a step to rename it. Click a permission to change it.</div>
    <div class="psteps" id="psteps">${P.steps.map((s, i) => `<div class="ps ${s.on ? '' : 'off'}" draggable="true" data-ps="${s.id}"><span class="grip">${ic('grip')}</span><span class="no">${i + 1}</span><span class="tt" contenteditable="true" spellcheck="false" data-pst="${s.id}">${esc(s.t)}</span><span class="perm ${s.perm}" data-pperm="${s.id}" title="Click to change">${PERM[s.perm]}</span><button class="mini" data-pskip="${s.id}" aria-label="${s.on ? 'Skip this step' : 'Keep this step'}" title="${s.on ? 'Skip' : 'Keep'}">${ic(s.on ? 'x' : 'refresh')}</button></div>`).join('')}</div>
    <div class="acts"><button class="btn pri" data-act="startPlan">${ic('play')}Run plan</button><button class="btn ghost" data-act="addPlanStep">${ic('plus')}Add step</button><span class="sp"></span><span class="faint">${!active.length ? 'No steps left.' : askAt >= 0 ? `Approval needed before step ${askAt + 1}.` : active.some(s => s.perm === 'auto') ? 'Runs without approvals.' : 'Read only. No files change.'}</span></div></div>`;
  dragList($('#psteps'), '.ps', 'ps', (from, to) => { const a = P.steps, f = a.findIndex(s => s.id === from), t = a.findIndex(s => s.id === to); const [x] = a.splice(f, 1); a.splice(t, 0, x); paintPlan(); });
  $$('[data-pst]', box).forEach(el => el.addEventListener('blur', () => { const s = P.steps.find(x => x.id === el.dataset.pst); s.t = el.textContent.trim() || s.t; }));
  $$('[data-pst]', box).forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } }));
}
function paintNeeds() {
  paintApprovals();
  const box = $('#dstack'); if (!box) return;
  const list = needsList(); S.dIdx = Math.max(0, Math.min(S.dIdx, list.length - 1));
  $('#needC').textContent = list.length || '';
  $('#dnav').innerHTML = list.length > 1 ? `<span class="mono">${S.dIdx + 1} of ${list.length}</span><span class="dnav"><button class="mini" data-dnav="-1" aria-label="Previous">${ic('chevl')}</button><button class="mini" data-dnav="1" aria-label="Next">${ic('right')}</button></span>` : '';
  if (!list.length) { box.innerHTML = `<div class="card allclear"><span class="ic">${ic('check')}</span><div><div style="color:var(--text)">No approvals waiting.</div><div class="faint" style="font-size:12.5px">New requests appear here and in the sidebar.</div></div></div>`; paintBrief(); return; }
  const x = list[S.dIdx], behind = list.length - 1;
  box.innerHTML = `<div class="dstack">${behind >= 2 ? '<div class="back b2"></div>' : ''}${behind >= 1 ? '<div class="back b1"></div>' : ''}
    <div class="card dcard in" data-dc="${x.id}"><div class="src"><span class="tag ${x.id === 'push' ? 'live' : ''}">${x.id === 'push' ? 'Task' : 'PC health'}</span>${esc(x.src.replace(/^PC health \u00b7 /, 'Found at '))}${x.when ? ' \u00b7 ' + x.when : ''}</div>
      <div class="tt">${esc(x.title)}</div><div class="cmd">${esc(x.cmd)}</div>
      <div class="facts">${x.facts.map(([i, t]) => `<div class="fact">${ic(i)}<span>${t}</span></div>`).join('')}</div>
      <div class="det" id="det"><div><ul>${(x.det || []).map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul></div></div>
      <div class="acts"><button class="btn pri" data-yes="${x.id}">${x.yes}<kbd>Y</kbd></button><button class="btn sec" data-no="${x.id}">Later<kbd>N</kbd></button><span class="sp"></span><button class="more" data-act="det">Details${ic('down')}</button></div></div></div>`;
  paintBrief();
}
function decide(yes) {
  const list = needsList(), x = list[S.dIdx]; if (!x) return;
  const card = $('.dcard'); if (card) card.classList.add(yes ? 'out-yes' : 'out-no');
  setTimeout(() => {
    if (x.id === 'push') { giveAnswer(yes ? 'yes' : 'no'); paintNeeds(); return; }
    const idx = S.needs.indexOf(x); S.needs.splice(idx, 1);
    let ch = null; if (yes) { ch = { id: 'c' + Date.now(), t: x.chg, m: 'just now', i: 'pencil', fresh: true }; S.changed.unshift(ch); }
    const he = logH(yes ? 'approved' : 'later', x.title, { task: x.src.split(' \u00b7 ')[0], log: [x.cmd.replace(/\s+/g, ' '), yes ? x.done : 'Snoozed until tomorrow'], files: yes ? [[x.chg, '']] : [] });
    paintNeeds(); paintSide(); paintChanged();
    toast(ic(yes ? 'check' : 'clock') + (yes ? x.done : 'Snoozed until tomorrow.'), () => { dropH(he); S.needs.splice(idx, 0, x); if (ch) S.changed = S.changed.filter(c => c !== ch); paintNeeds(); paintSide(); paintChanged(); });
  }, 260);
}
function paintBrief() {
  const n = needsList().length, p = S.problems.length, run = runCount(), ch = S.changed.length;
  const h = $('#headline'); if (!h) return;
  if (S.first && !run && !ch) { h.textContent = 'No tasks yet'; $('#brief').textContent = 'Describe a task below. Aetheris only uses the folders you add.'; return; }
  const parts = [n && plural(n, 'approval') + ' waiting', p && plural(p, 'problem')].filter(Boolean);
  h.textContent = S.allPaused ? 'All tasks paused' : blocked() ? 'Offline' : parts.length ? parts.join(' \u00b7 ') : 'Nothing needs your approval';
  $('#brief').innerHTML = `${plural(run, 'task')} ${blocked() ? 'waiting for internet' : 'running'} \u00b7 ${S.queue.length} queued \u00b7 ${plural(ch, 'change')} today`;
}
function paintLives() {
  paintBrief(); const box = $('#lives'); if (!box) return;
  const dP = R.paused || S.allPaused, rP = S.rename.paused || S.allPaused;
  const steps = D.plan.map((_, i) => i < R.plan || R.done ? 'done' : i === R.plan ? (R.ask ? 'ask' : 'act') : 'wait');
  const strip = steps.map((s, i) => `${i ? `<i class="${s === 'wait' ? '' : s === 'act' && !dP ? 'act' : 'done'}"></i>` : ''}<span class="node ${s} ${i === 2 || i === 3 || i === 5 ? 'sq' : 'look'}"></span>`).join('');
  const rs = Array.from({ length: 5 }, (_, i) => i < 2 ? 'done' : i === 2 ? 'act' : 'wait');
  const rstrip = rs.map((s, i) => `${i ? `<i class="${s === 'wait' ? '' : s === 'act' && !rP ? 'act' : 'done'}"></i>` : ''}<span class="node ${s} ${i > 1 ? 'sq' : 'look'}"></span>`).join('');
  const now = R.done ? 'Finished. 2 files changed, all 40 tests pass.' : R.ask ? '<span style="color:var(--ask)">Waiting for you: can it push the fix to GitHub?</span>' : dP ? 'Paused' : `<span class="caret">${esc(R.now || 'Starting')}</span>`;
  box.innerHTML = `
    <div class="card live-card" data-go="task"><div class="h"><span class="tt">Fix the date parsing bug in invoices</span><span class="el mono">${R.done ? 'done' : `step ${Math.min(R.plan + 1, 6)} of 6 \u00b7 ${fmt(R.clock)}`}</span>${R.done ? '' : `<span class="tools"><button class="mini" data-act="pause" aria-label="${R.paused ? 'Resume' : 'Pause'}">${ic(R.paused ? 'play' : 'pause')}</button></span>`}</div><div class="strip">${strip}</div><div class="now">${now}</div></div>
    <div class="card live-card"><div class="h"><span class="tt">Rename \u201cclient\u201d to \u201ccustomer\u201d everywhere</span><span class="el mono">step 3 of 5</span><span class="tools"><button class="mini" data-act="pauseRename" aria-label="${S.rename.paused ? 'Resume' : 'Pause'}">${ic(S.rename.paused ? 'play' : 'pause')}</button></span></div><div class="strip">${rstrip}</div><div class="now">${rP ? 'Paused' : `<span class="caret">Editing file ${S.rename.file} of ${S.rename.total}: templates/invoice.html</span>`}</div></div>`;
  box.insertAdjacentHTML('beforeend', S.extra.map(x => { const P = S.allPaused || x.paused, k = Math.floor(x.p * 5); return `<div class="card live-card"><div class="h"><span class="tt">${esc(x.t)}</span><span class="el mono">step ${Math.min(k + 1, 5)} of 5</span><span class="tools"><button class="mini" data-xpause="${x.id}" aria-label="${x.paused ? 'Resume' : 'Pause'}">${ic(x.paused ? 'play' : 'pause')}</button></span></div><div class="strip">${Array.from({ length: 5 }, (_, i) => `${i ? `<i class="${i < k ? 'done' : i === k && !P ? 'act' : i === k ? 'done' : ''}"></i>` : ''}<span class="node ${i < k ? 'done' : i === k ? 'act' : 'wait'} look"></span>`).join('')}</div><div class="now">${P ? 'Paused' : `<span class="caret">${esc(x.step)}</span>`}</div></div>`; }).join(''));
  $('#liveC').textContent = runCount();
  paintBrief();
}
function paintChanged() {
  const box = $('#chg'); if (!box) return; stampChanges();
  $('#chgC').textContent = S.changed.length || '';
  const u = $('#undoSince'); if (u) u.style.display = S.changed.filter(c => !c.undone).length >= 2 ? '' : 'none';
  box.innerHTML = S.changed.map(c => `<div class="r ${c.undone ? 'undone' : ''} ${c.fresh ? 'fresh' : ''}">${ic(c.i)}<div><div class="t">${esc(c.t)}</div><div class="m">${c.undone ? 'Undone \u00b7 ' : ''}${esc(c.m)}</div></div><button class="btn ghost" data-undo="${c.id}">${ic(c.undone ? 'redo' : 'undo')}${c.undone ? 'Redo' : 'Undo'}</button></div>`).join('') || `<div class="empty-chg">${ic('undo')}<div>No changes yet. Each change appears here with Undo.</div></div>`;
  S.changed.forEach(c => { c.fresh = false; });
  paintBrief();
}
function scoreCard() {
  const { vals, weeks, kept } = D.score, W = 300, H = 64, min = 24, max = 32;
  const pts = vals.map((v, i) => [i * (W / (vals.length - 1)), H - ((v - min) / (max - min)) * H]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<div class="card score"><div class="lbl"><span>Practice tasks solved, out of 50</span></div>
    <div class="big"><b>${vals.at(-1)}</b><span>/ 50</span><span class="delta">+${vals.at(-1) - vals[0]} in 4 weeks</span></div>
    <div class="chart" id="chart"><div class="tip" id="tip"></div><svg viewBox="0 -6 ${W} ${H + 12}" preserveAspectRatio="none"><defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--text)" stop-opacity=".12"/><stop offset="1" stop-color="var(--text)" stop-opacity="0"/></linearGradient></defs>
      <path class="ar" d="${line} L${W} ${H} L0 ${H} Z"/><path class="ln" d="${line}" vector-effect="non-scaling-stroke"/>
      ${kept.map(k => `<circle class="kp" cx="${pts[k][0]}" cy="${pts[k][1]}" r="3.5" vector-effect="non-scaling-stroke"/>`).join('')}
      ${pts.map((p, i) => `<rect class="hit" data-i="${i}" x="${Math.max(0, p[0] - W / 8)}" y="-6" width="${W / 4}" height="${H + 12}"/>`).join('')}</svg>
      <div class="ax">${weeks.map(w => `<span>${w}</span>`).join('')}</div></div>
    <div class="tried">${D.tried.map(([t, r]) => `<div><span>${t}</span><span class="tag ${r === 'kept' ? 'good' : r === 'broke 1' ? 'bad' : ''}">${r}</span></div>`).join('')}</div></div>`;
}
function chartHover() {
  const c = $('#chart'); if (!c) return; const tip = $('#tip'), { vals, weeks, kept } = D.score;
  c.addEventListener('mousemove', e => { const h = e.target.closest('.hit'); if (!h) return; const i = +h.dataset.i; tip.textContent = `${weeks[i]} \u00b7 ${vals[i]} solved${kept.includes(i) ? ' \u00b7 change kept' : ''}`; tip.style.left = (i / (vals.length - 1)) * 100 + '%'; tip.classList.add('on'); });
  c.addEventListener('mouseleave', () => tip.classList.remove('on'));
}

/* ---------- drag to reorder ---------- */
function dragList(root, sel, key, move) {
  let from = null;
  root.addEventListener('dragstart', e => { const el = e.target.closest(sel); if (!el) return; from = el.dataset[key]; el.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; });
  root.addEventListener('dragover', e => { const el = e.target.closest(sel); if (!el || !from) return; e.preventDefault(); $$(sel, root).forEach(x => x.classList.toggle('over', x === el && x.dataset[key] !== from)); });
  root.addEventListener('dragend', () => { from = null; $$(sel, root).forEach(x => x.classList.remove('drag', 'over')); });
  root.addEventListener('drop', e => { const el = e.target.closest(sel); if (!el || !from) return; e.preventDefault(); const to = el.dataset[key]; const f = from; from = null; if (f !== to) move(f, to); });
}

/* ---------- task view ---------- */
let mounted = null;
function task() {
  $('#view').innerHTML = `<div class="task">
    <div class="thread-wrap">
      <div class="thead"><h1>Fix the date parsing bug in invoices</h1>
        <div class="meta"><span class="chip">${ic('folder')}invoice-tool</span><span class="chip">${ic('branch')}<span class="mono">fix/date-parsing</span></span><span id="status" style="margin-left:6px"></span><span class="sp"></span>
          <div class="ctl"><button class="btn sec" data-act="pause" id="pauseB"></button><button class="btn ghost" data-act="stop" id="stopB">${ic('stop')}Stop</button></div></div>
        <div class="plan" id="plan"></div></div>
      <div class="thread" id="thread"></div>
      <div class="steer"><div class="in"><input id="steer" placeholder="Add an instruction\u2026" aria-label="Add an instruction"><button class="send" id="steerSend" aria-label="Send" disabled>${ic('up')}</button></div>
        <div class="hint"><span><kbd>Space</kbd> pause</span><span><kbd>Y</kbd> <kbd>N</kbd> answer</span><span><kbd>\u2191</kbd> <kbd>\u2193</kbd> move between steps</span></div></div>
    </div>
    <aside class="insp"><div class="tabs" id="tabs"></div><div class="pane" id="pane"></div></aside></div>`;
  mounted = new Map();
  R.steps.forEach(s => mountStep(s, false));
  paintHead(); paintInsp();
  const si = $('#steer');
  si.addEventListener('input', () => { $('#steerSend').disabled = !si.value.trim(); });
  si.addEventListener('keydown', e => { if (e.key === 'Enter' && si.value.trim()) { addStep({ kind: 'note', title: si.value.trim() }); si.value = ''; $('#steerSend').disabled = true; toast(ic('check') + 'Instruction added. Used from the next step.'); } });
  scrollEnd(true);
}
function paintHead() {
  if (!mounted || !$('#status')) return;
  const P = R.paused || S.allPaused;
  $('#status').innerHTML = R.done ? `<span class="status done">${ic('check')}Completed<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>` : R.ask ? `<span class="status ask"><span class="dot"></span>Waiting for approval<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>` : P ? `<span class="status paused">${ic(R.stopped ? 'stop' : 'pause')}${R.stopped ? 'Stopped' : 'Paused'}<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>` : `<span class="status"><span class="dot pulse"></span>Running<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>`;
  $('#pauseB').innerHTML = R.stopped ? `${ic('refresh')}Start again` : R.paused ? `${ic('play')}Resume` : `${ic('pause')}Pause`;
  $('.thead .ctl').style.display = R.done ? 'none' : '';
  const si = $('#steer'); if (si) si.placeholder = R.done ? 'Add a follow-up task\u2026' : 'Add an instruction\u2026';
  $('#plan').innerHTML = D.plan.map((p, i) => `<div class="p ${i < R.plan || R.done ? 'done' : i === R.plan ? (R.ask ? 'ask' : 'act') : ''}" title="${p}"><span class="i">${i + 1}</span>${p}</div>`).join('');
}

/* ---------- day states: normal, first, problems, away, offline ---------- */
const DAY = params.get('state') || 'normal';
const SEED_L = ['Read src/invoice/dates.py', 'Searched the project for strptime', 'Rename: edited a template', 'Ran tests/test_dates.py', 'Read templates/invoice.html', 'Rename: edited a test file'];
Object.assign(S, { problems: [], awayCard: null, first: false, offline: false, local: false, quota: { used: 415, total: 1500 }, setup: { run: false, undo: false, hidden: false }, stuck: null, actNowL: [] });
S.actL = S.act.map((v, i) => Array.from({ length: Math.min(v, 3) }, (_, k) => ({ l: SEED_L[(i + k) % SEED_L.length], task: SEED_L[(i + k) % SEED_L.length].startsWith('Rename') ? 'rename' : 'date' })));
const cloneP = id => JSON.parse(JSON.stringify(D.problems.find(p => p.id === id)));
if (DAY === 'problems') { S.problems = [cloneP('fail1'), cloneP('stuck1')]; S.stuck = { id: 'stuck1', t: 'Find unused CSS in the website' }; S.queue = S.queue.filter(q => q.id === 'q3'); S.quota.used = 1310; }
if (DAY === 'away') { S.problems = [cloneP('fail1')]; S.awayCard = D.away; S.queue = S.queue.filter(q => q.id !== 'q1'); }
if (DAY === 'first') { S.first = true; S.queue = []; S.changed = []; S.needs = []; S.rename.off = true; S.act = S.act.map(() => 0); S.actL = S.act.map(() => []); }
if (DAY === 'offline') S.offline = true;
const blocked = () => S.offline && !S.local;
const doneBase = () => S.first ? 0 : D.done.length;
const failedN = () => S.problems.filter(p => p.kind === 'failed').length;
const plural = (n, w, pl) => `${n} ${n === 1 ? w : (pl || w + 's')}`;

/* ---------- problems ---------- */
function paintProblems() {
  const box = $('#probBox'); if (!box) return;
  if (!S.problems.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<section id="probSec"><div class="sec-h"><h2>Problems</h2><span class="c bad">${S.problems.length}</span></div>
    <div class="card probs">${S.problems.map(p => `<div class="pr ${p.kind}" data-pid="${p.id}">
      <span class="pi">${ic(p.kind === 'failed' ? 'fail' : 'hourglass')}</span>
      <div class="pb"><div class="t">${esc(p.title)}<span class="tag ${p.kind === 'failed' ? 'bad' : 'ask'}">${p.kind === 'failed' ? 'Failed' : 'No progress'}</span></div><div class="m">${esc(p.why)}</div></div>
      <span class="when mono">${esc(p.when)}</span>
      <div class="pa"><button class="btn ghost sm ${p.open ? 'on' : ''}" data-pact="details:${p.id}">Details${ic('down', 'chev')}</button>${p.kind === 'failed'
        ? `${p.undone ? '<span class="tag">Changes undone</span>' : `<button class="btn sec sm" data-pact="undo:${p.id}">${ic('undo')}Undo its changes</button>`}<button class="btn pri sm" data-pact="retry:${p.id}">${ic('refresh')}Retry</button>`
        : `<button class="btn sec sm" data-pact="wait:${p.id}">Keep waiting</button><button class="btn pri sm" data-pact="stop:${p.id}">${ic('stop')}Stop</button>`}</div>
      <div class="pd ${p.open ? 'on' : ''}"><div><div class="pdi">
        ${p.steps.map(([a, b]) => `<div class="ps2"><span>${esc(a)}</span><span class="mono faint">${esc(b)}</span></div>`).join('')}
        <div class="out">${p.out.map(l => `<div class="${/^(FAILED|E )/.test(l) ? 'f' : ''}">${esc(l)}</div>`).join('')}</div>
        <div class="note">${ic('shield')}${esc(p.note)}</div></div></div></div></div>`).join('')}</div></section>`;
}
function problemAct(act, id) {
  const p = S.problems.find(x => x.id === id); if (!p) return;
  const idx = S.problems.indexOf(p), drop = () => { S.problems.splice(S.problems.indexOf(p), 1); }, back = () => { S.problems.splice(idx, 0, p); };
  const repaint = () => { paintProblems(); paintSide(); paintBrief(); };
  if (act === 'details') { p.open = !p.open; return paintProblems(); }
  if (act === 'undo') { p.undone = true; const c = { id: 'cu' + id, t: 'Edited README.md and docs/usage.md (failed task)', m: '7:10 pm \u00b7 2 files', i: 'pencil', undone: true, at: 1150, time: '7:10 pm' }; S.changed.unshift(c); paintChanged(); paintProblems(); const e = logH('undone', 'Changes from: ' + p.title, { task: p.title, files: [['README.md, docs/usage.md', '+42 \u221210']], log: ['Task failed at step 3 of 5', '2 of 40 tests failed', 'Restored README.md and docs/usage.md'] }); return whyCard(e, { msg: '<b>Undone</b> changes from the failed task.', undo: () => { p.undone = false; S.changed = S.changed.filter(x => x !== c); paintChanged(); paintProblems(); }, retry: note => { drop(); repaint(); startExtra(p.title + ' \u2014 ' + note); }, retryLabel: 'Save and retry this way' }); }
  if (act === 'retry') { drop(); repaint(); const e = logH('retried', p.title, { task: p.title, log: ['Failed at step 3 of 5', 'FAILED tests/test_docs.py::test_examples_run', 'FAILED tests/test_docs.py::test_links'] }); const x = startExtra(p.title, 'quiet'); return whyCard(e, { msg: `<b>Retrying</b> ${esc(p.title)}.`, q: 'Anything to change this time?', saveLabel: 'Save', undo: () => { S.extra = S.extra.filter(y => y !== x); back(); repaint(); paintLives(); paintSide(); }, onSave: y => { if (x && y.reason) x.step = 'Plan changed: ' + y.reason.toLowerCase(); } }); }
  if (act === 'wait') { drop(); repaint(); return toast(ic('clock') + 'Checking it again in 10 min.', () => { back(); repaint(); }); }
  if (act === 'stop') { const st = S.stuck; drop(); S.stuck = null; repaint(); const e = logH('stopped', p.title, { task: p.title, log: (p.out || []).concat(['Stopped after 6 min with no progress']) }); return whyCard(e, { msg: `<b>Stopped</b> ${esc(p.title)}. Nothing was changed.`, undo: () => { back(); S.stuck = st; repaint(); }, retry: note => startExtra(p.title + ' \u2014 ' + note), retryLabel: 'Save and start again' }); }
}

/* ---------- while you were away ---------- */
function paintAwayCard() {
  const box = $('#awayBox'); if (!box) return; const A = S.awayCard;
  box.innerHTML = A ? `<div class="card awayc"><div class="h">${ic('history')}<b>While you were away</b><span class="mono faint">${A.from} \u2013 ${A.to}</span><span class="sp"></span><button class="mini" data-act="awayClose" aria-label="Dismiss">${ic('x')}</button></div>
    <div class="cells">${A.rows.map(([i, t, d, to, cls]) => `<button class="cell ${cls || ''}" data-awayto="${to}">${ic(i)}<div><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div></div></button>`).join('')}</div></div>` : '';
}
function awayGo(to) {
  if (to === 'problems' || to === 'needs') { const el = $(to === 'problems' ? '#probSec' : '#dstack'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.animate([{ filter: 'brightness(1.6)' }, { filter: 'none' }], { duration: 900 }); } return; }
  go(to);
}

/* ---------- first day ---------- */
const EXAMPLES = [['eye', 'Explain what invoice-tool does and how it is organised'], ['terminal', 'Find one failing test in invoice-tool and fix it'], ['disk', 'List the 20 largest files on drive C:']];
function paintSetup() {
  const box = $('#setupBox'); if (!box) return;
  if (!S.first || S.setup.hidden) { box.innerHTML = ''; return; }
  const items = [[true, 'Add a folder', 'invoice-tool \u00b7 D:\\projects\\invoice-tool'], [true, 'Connect a free model', 'Gemini 2.5 Flash \u00b7 Google AI Studio key'], [S.setup.run, 'Run a first task', 'Try one of the examples under the task box'], [S.setup.undo, 'Undo a change once', 'Every change can be undone. Try it once so you know how.']];
  const n = items.filter(x => x[0]).length;
  box.innerHTML = `<div class="card setup"><div class="h">${ic('flag')}<b>Getting started</b><span class="mono faint">${n} of 4</span><span class="bar"><i style="width:${n * 25}%"></i></span><span class="sp"></span><button class="btn ghost sm" data-act="setupHide">${n === 4 ? 'Done' : 'Hide'}</button></div>
    <div class="items">${items.map(([ok, t, d], i) => `<div class="it ${ok ? 'ok' : ''}"><span class="ck">${ok ? ic('check') : i + 1}</span><div><div class="t">${t}</div><div class="d">${esc(d)}</div></div></div>`).join('')}</div></div>`;
}

/* ---------- offline ---------- */
function paintNet() {
  const b = $('#netbar'); if (!b) return;
  b.classList.toggle('on', S.offline);
  b.innerHTML = S.local ? `${ic('wifioff')}<span><b>Offline.</b> Using the local model (Ollama). Slower, but tasks continue.</span><button class="btn sec sm" data-act="netRetry">${ic('reload')}Retry online</button>`
    : `${ic('wifioff')}<span><b>No internet connection.</b> Tasks that need an online model are waiting.</span><button class="btn sec sm" data-act="netRetry">${ic('reload')}Retry</button><button class="btn live sm" data-act="useLocal">${ic('pc')}Use local model</button>`;
}

/* ---------- quota (only shown when low) ---------- */
function paintQuota() {
  const el = $('#quota'); if (!el) return; const { used, total } = S.quota, low = used / total > 0.8;
  el.style.display = low ? '' : 'none';
  el.innerHTML = `<div class="lbl">Model requests today<b>${used.toLocaleString('en-GB')} / ${total.toLocaleString('en-GB')}</b></div><div class="budget warn"><i style="width:${used / total * 100}%"></i></div><div class="qsub">About 2 h left at this rate.<button data-pop="model">Change model</button></div>`;
}

/* ---------- undo since a time ---------- */
let chgSeq = 0;
function stampChanges() { S.changed.forEach(c => { if (c.at == null) { c.at = 1440 + (++chgSeq); c.time = 'just now'; } }); }
function undoSinceOptions() {
  stampChanges(); const live = S.changed.filter(c => !c.undone).sort((a, b) => b.at - a.at); const seen = new Set();
  return live.filter(c => !seen.has(c.time) && seen.add(c.time)).map(c => { const k = live.filter(x => x.at >= c.at).length; return [String(c.at), `Since ${c.time}`, plural(k, 'change'), '']; });
}
function confirmUndo(at) {
  const list = S.changed.filter(c => !c.undone && c.at >= at), first = list[list.length - 1]; if (!list.length) return;
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  scrim.innerHTML = `<div class="dlg" role="dialog" aria-label="Undo changes"><h3>Undo ${plural(list.length, 'change')} since ${first.time}?</h3>
    <ul>${list.map(c => `<li>${ic(c.i)}<span>${esc(c.t)}</span><span class="mono faint">${esc(c.time)}</span></li>`).join('')}</ul>
    <p>${ic('shield')}Files go back to how they were ${first.time === 'just now' ? 'a moment ago' : 'at ' + first.time}. Running tasks pause while this happens.</p>
    <div class="acts"><button class="btn ghost" data-dlg="no">Cancel<kbd>Esc</kbd></button><button class="btn pri" data-dlg="yes">${ic('undo')}Undo ${plural(list.length, 'change')}<kbd>Enter</kbd></button></div></div>`;
  document.body.appendChild(scrim);
  const close = () => { scrim.remove(); removeEventListener('keydown', key, true); };
  const yes = () => { close(); list.forEach(c => { c.undone = true; }); S.setup.undo = true; paintChanged(); paintSetup(); const e = logH('undone', `${plural(list.length, 'change')} since ${first.time}`, { task: 'Undo since', files: list.map(c => [c.t, c.time]), log: ['Restored files to how they were at ' + first.time, 'Paused running tasks while restoring', 'Checked: files match the saved copies'] }); whyCard(e, { msg: `<b>Undid ${plural(list.length, 'change')}</b> since ${first.time}.`, undo: () => { list.forEach(c => { c.undone = false; }); paintChanged(); } }); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'Enter') { e.preventDefault(); yes(); } };
  addEventListener('keydown', key, true);
  scrim.addEventListener('click', e => { const b = e.target.closest('[data-dlg]'); if (b) b.dataset.dlg === 'yes' ? yes() : close(); else if (e.target === scrim) close(); });
  setTimeout(() => $('[data-dlg="yes"]', scrim).focus(), 30);
}

/* ---------- activity bars: hover and click show what happened ---------- */
function barsInteract() {
  const bars = $('#bars'), tip = $('#btip');
  const at = e => { const r = bars.getBoundingClientRect(); return Math.max(0, Math.min(S.act.length - 1, Math.floor((e.clientX - r.left) / r.width * S.act.length))); };
  const ago = i => (S.act.length - 1 - i) * 2;
  bars.addEventListener('mousemove', e => {
    const i = at(e), L = S.actL[i] || [];
    tip.innerHTML = `<b>${ago(i) ? ago(i) + ' s ago' : 'now'}</b> \u00b7 ${plural(S.act[i], 'action')}${L.length ? '<br>' + L.slice(0, 2).map(x => esc(x.l)).join('<br>') : ''}`;
    tip.classList.add('on'); { const bw = tip.parentElement.clientWidth, tw = tip.offsetWidth, x = (i + .5) / S.act.length * bars.clientWidth + bars.offsetLeft; tip.style.left = Math.max(tw / 2 - 12, Math.min(bw - tw / 2 - 12, x - 12)) + 'px'; }
    $$('#bars i').forEach((b, k) => b.classList.toggle('hov', k === i));
  });
  bars.addEventListener('mouseleave', () => { tip.classList.remove('on'); $$('#bars i').forEach(b => b.classList.remove('hov')); });
  bars.addEventListener('click', e => {
    e.stopPropagation(); closePop(); const i = at(e), L = S.actL[i] || []; if (!L.length) return toast(ic('clock') + 'Nothing happened in those 2 seconds.');
    pop(bars, `${ago(i) ? ago(i) + ' s ago' : 'Just now'} \u00b7 ${plural(S.act[i], 'action')}`, L.map((x, k) => [String(k), x.l, x.task === 'date' ? 'Fix the date parsing bug \u00b7 open' : x.task === 'rename' ? 'Rename \u201cclient\u201d to \u201ccustomer\u201d' : '', '']), null, k => { if (L[+k].task === 'date' && !S.first) go('task'); });
  });
}

/* ---------- v0.8: reasons, history and the Approvals page ---------- */
const WHY = {
  stopped: ['Taking too long', 'Wrong approach', 'Not needed now', 'Doing it myself'],
  undone: ['Wrong result', 'Broke something', 'Not what I asked', 'Changed my mind'],
  declined: ['Too risky', 'Wrong files', 'Not needed', 'Do it differently'],
  removed: ['Not needed', 'Already done', 'Wrong task'],
  flagged: ['Wrong value', 'Should not change', 'Wrong file', 'Explain this'],
  retried: ['Same again', 'Fix the failing tests first', 'Smaller steps', 'Use another model'],
};
/* What each reason does. Shown before saving, written to History after. kind: none | note | mem | rule | task */
const EFF = {
  'Taking too long': ['rule', 'If it happens again, Rules suggests a time limit for this step.'],
  'Wrong approach': ['note', 'Use Save and start again to tell it the approach you want.'],
  'Not needed now': ['none', 'Nothing else happens.'],
  'Doing it myself': ['none', 'Nothing else happens. Its changes stay undoable.'],
  'Wrong result': ['mem', 'Your note is added to Memory and shown to the next task that edits these files.'],
  'Broke something': ['rule', 'Adds a rule: run the tests before a change like this.'],
  'Not what I asked': ['mem', 'Your note is added to Memory. You can edit or remove it there.'],
  'Changed my mind': ['none', 'Nothing else happens.'],
  'Too risky': ['rule', 'Requests like this show your decline next time.'],
  'Wrong files': ['mem', 'Your note is added to Memory for this folder.'],
  'Not needed': ['none', 'Nothing else happens.'],
  'Do it differently': ['note', 'Use Save and ask again to tell it what to do instead.'],
  'Already done': ['none', 'Nothing else happens.'],
  'Wrong task': ['none', 'Nothing else happens.'],
  'Wrong value': ['task', 'Sent to the task. It fixes this line before the next step.'],
  'Should not change': ['task', 'Sent to the task. It puts this line back and leaves it alone.'],
  'Wrong file': ['task', 'Sent to the task. It stops editing this file.'],
  'Explain this': ['task', 'Sent to the task. It explains this line in the thread before going on.'],
  'Same again': ['none', 'Runs again with the same plan.'],
  'Fix the failing tests first': ['task', 'The new run starts with the failing tests.'],
  'Smaller steps': ['task', 'The new run asks after each step.'],
  'Use another model': ['task', 'The new run uses the next free model.'],
};
const KIND = { approved: ['check', 'Approved', 'good'], declined: ['ban', 'Declined', 'bad'], later: ['clock', 'Later', ''], stopped: ['stop', 'Stopped', 'ask'], undone: ['undo', 'Undone', 'ask'], redone: ['redo', 'Redone', ''], retried: ['refresh', 'Retried', ''], removed: ['x', 'Removed', ''], flagged: ['flag', 'Flagged', 'ask'], setting: ['sliders', 'Setting', ''] };
const RVAL = { auto: 'No approval needed', ask: 'Ask first', never: 'Never', on: 'On', off: 'Off' };
Object.assign(S, {
  hist: S.first ? [] : D.hist.map(h => Object.assign({}, h, { files: h.files.map(f => f.slice()) })),
  rules: D.rules.map(r => Object.assign({}, r)), suggest: S.first ? null : Object.assign({}, D.suggest),
  sub: params.get('sub') || 'waiting', hf: 'all', hr: '', flags: new Set(), mem: [], hq: '', hOpen: params.get('open') || null, hEdit: null, hDraft: '', hNote: '', aSel: 0,
});
let hSeq = 0, whyEl = null, whyT = 0;
const clockNow = () => `7:${String(20 + Math.min(hSeq, 39)).padStart(2, '0')} pm`;
const asksWhy = k => !!WHY[k] && k !== 'retried';

function logH(kind, t, o = {}) {
  hSeq++;
  const e = { id: 'n' + hSeq, day: 'Today', time: clockNow(), kind, t, task: o.task || '', reason: '', note: '', log: o.log || [], files: o.files || [], next: o.next || '', fresh: true };
  S.hist.unshift(e); paintApprovals(); return e;
}
function dropH(e) { S.hist = S.hist.filter(x => x !== e); paintApprovals(); }

/* The reason card. The action has already happened; the reason is optional and can be added later from History.
   Pick a reason, point at the log line or file it is about, add a note. The card says what the reason will do before you save. */
function markItems(e) { return e.log.map((l, i) => ['l' + i, l, e.kind === 'flagged' ? 'line' : 'log']).concat(e.files.map(([f, c], i) => ['f' + i, f + (c ? '  ' + c : ''), 'file'])); }
function whyCard(e, o) {
  closeWhy();
  const el = document.createElement('div'); el.className = 'why'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Reason');
  const items = markItems(e); e.marks = e.marks || (o.marks || []).slice();
  const what = e.log.length && e.files.length ? 'the log and files' : e.files.length ? 'the files' : 'the log';
  el.innerHTML = `<div class="wh">${ic(KIND[e.kind][0])}<span class="wm">${o.msg}</span>${o.undo ? '<button class="wb" data-w="undo">Undo</button>' : ''}<button class="wx" data-w="skip" aria-label="Close">${ic('x')}</button></div>
    <div class="wbody"><div class="wq">${o.q || 'Why?'} <span>Optional. Saved in History with ${what}.</span></div>
    <div class="wchips">${WHY[e.kind].map(c => `<button data-wc="${esc(c)}">${esc(c)}</button>`).join('')}${items.length ? `<button class="wpt" data-w="mark">${ic('flag')}Point at the line<span class="n"></span></button>` : ''}</div>
    <div class="wmarks" hidden>${items.map(([k, t, ty]) => `<button data-wm="${k}" class="${e.marks.includes(k) ? 'on' : ''}"><span class="fl">${ic('flag')}</span><span class="ty">${ty}</span><span class="tx">${esc(t)}</span></button>`).join('')}</div>
    <div class="weff" hidden></div>
    <div class="wrow"><input id="whyIn" placeholder="${o.retry ? 'Details, or what to do instead' : 'Details'}" autocomplete="off" spellcheck="false">
    <button class="btn ghost sm" data-w="skip">Skip</button>${o.retry ? `<button class="btn sec sm" data-w="retry" hidden>${ic('refresh')}${o.retryLabel || 'Save and retry'}</button>` : ''}<button class="btn pri sm" data-w="save">${o.saveLabel || 'Save'}<kbd>Enter</kbd></button></div></div>`;
  $('#toasts').appendChild(el); whyEl = el;
  let sel = '';
  const inp = $('#whyIn', el), rb = $('[data-w="retry"]', el), eff = $('.weff', el), mk = $('.wmarks', el);
  const upd = () => {
    if (rb) rb.hidden = !(inp.value.trim() || /approach|differently/.test(sel));
    const f = EFF[sel]; eff.hidden = !f; if (f) eff.innerHTML = `${ic(f[0] === 'none' ? 'check' : f[0] === 'rule' ? 'rule' : f[0] === 'mem' ? 'memory' : 'play')}<span><b>What this does:</b> ${esc(f[1])}</span>`;
    const n = $('.wpt .n', el); if (n) n.textContent = e.marks.length ? ' \u00b7 ' + e.marks.length : '';
  };
  if (e.marks.length) { mk.hidden = false; const pb = $('.wpt', el); if (pb) pb.classList.add('on'); }
  const save = retry => {
    e.reason = sel; e.note = inp.value.trim();
    const out = applyEffect(e, EFF[sel]);
    if (retry && o.retry) { e.next = 'Started again with your note.'; o.retry(e.note || sel); }
    if (o.onSave) o.onSave(e);
    closeWhy(); paintApprovals();
    toast(ic('check') + (out || (e.reason || e.note ? 'Reason saved in History.' : 'Saved in History without a reason.')), () => openH(e.id), 'View');
  };
  const touch = () => clearTimeout(whyT);
  el.addEventListener('pointerdown', touch); el.addEventListener('focusin', touch);
  whyT = setTimeout(() => closeWhy(), 20000);
  el.addEventListener('click', ev => {
    const c = ev.target.closest('[data-wc]');
    if (c) { sel = sel === c.dataset.wc ? '' : c.dataset.wc; $$('[data-wc]', el).forEach(b => b.classList.toggle('on', b.dataset.wc === sel)); upd(); return inp.focus(); }
    const m = ev.target.closest('[data-wm]');
    if (m) { const k = m.dataset.wm; e.marks = e.marks.includes(k) ? e.marks.filter(x => x !== k) : e.marks.concat(k); m.classList.toggle('on'); return upd(); }
    const b = ev.target.closest('[data-w]'); if (!b) return;
    const w = b.dataset.w;
    if (w === 'mark') { mk.hidden = !mk.hidden; b.classList.toggle('on', !mk.hidden); return; }
    if (w === 'skip') closeWhy();
    else if (w === 'save') save(false);
    else if (w === 'retry') save(true);
    else if (w === 'undo') { o.undo(); dropH(e); closeWhy(); toast(ic('redo') + 'Reversed. Removed from History.'); }
  });
  inp.addEventListener('input', upd); upd();
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); save(false); } if (ev.key === 'Escape') { ev.stopPropagation(); closeWhy(); } });
}
/* Turn a saved reason into its effect. Returns the toast text. */
function applyEffect(e, f) {
  if (!f) return '';
  const what = e.note ? `\u201c${e.note}\u201d` : `\u201c${e.reason}\u201d`;
  if (f[0] === 'mem') { S.mem.unshift({ t: e.note || e.reason, from: e.id }); e.next = `Added to Memory: ${what}`; return 'Reason saved. Added to Memory.'; }
  if (f[0] === 'rule' && e.reason === 'Broke something') { const r = { id: 'r' + Date.now(), what: `Run the tests before: ${e.t}`, val: 'on', from: `Your undo, today ${e.time}`, ref: e.id }; S.rules.unshift(r); e.next = 'Added a rule: run the tests before a change like this.'; return 'Reason saved. Rule added.'; }
  if (f[0] === 'rule') { e.next = f[1]; return 'Reason saved.'; }
  if (f[0] === 'task') { e.next = f[1]; return f[1].split('.')[0] + '.'; }
  return '';
}
function closeWhy() {
  clearTimeout(whyT); if (!whyEl) return;
  const el = whyEl; whyEl = null; el.classList.add('out'); setTimeout(() => el.remove(), 220);
}

/* ---------- actions that ask why ---------- */
function undoChange(c) {
  c.undone = !c.undone; if (c.undone) { S.setup.undo = true; paintSetup(); } paintChanged();
  const n = (c.m.split(' \u00b7 ')[1] || 'files');
  const e = logH(c.undone ? 'undone' : 'redone', c.t, { task: c.task || '', files: [[n, '']], log: [c.undone ? 'Restored the files from the change record' : 'Applied the change again', 'Checked: files match the saved copy'] });
  if (c.undone) whyCard(e, { msg: `<b>Undone</b> ${esc(c.t)}`, undo: () => { c.undone = false; paintChanged(); }, retry: note => startExtra(c.t + ' \u2014 ' + note), retryLabel: 'Save and redo it this way' });
  else toast(ic('redo') + 'Redone.', () => { c.undone = true; dropH(e); paintChanged(); });
}
function stopTask() {
  if (R.done) return toast(ic('check') + 'This task is already done.');
  if (R.stopped) return;
  R.paused = true; R.stopped = true; repaintRun();
  const e = logH('stopped', 'Fix the date parsing bug in invoices', { task: 'Fix the date parsing bug', log: [`Stopped at step ${Math.min(R.plan + 1, 6)} of 6 after ${fmt(R.clock)}`, R.now || 'Working', 'Changes so far stay undoable'], files: R.plan >= 2 ? [['src/invoice/dates.py', '+8 \u22123']] : [] });
  whyCard(e, { msg: '<b>Stopped</b> Fix the date parsing bug. Changes so far stay undoable.', undo: () => { R.stopped = false; R.paused = false; repaintRun(); }, retry: note => { R.stopped = false; R.paused = false; repaintRun(); toast(ic('refresh') + 'Started again with your note.'); }, retryLabel: 'Save and start again' });
}
function declineNeed(i) {
  const list = needsList(), x = list[i]; if (!x) return;
  if (x.id === 'push') return giveAnswer('no');
  const idx = S.needs.indexOf(x); S.needs.splice(idx, 1); paintNeeds(); paintSide();
  const e = logH('declined', x.title, { task: x.src.split(' \u00b7 ')[0], log: [x.cmd.replace(/\s+/g, ' '), 'Declined before running. Nothing was changed.'] });
  whyCard(e, { msg: `<b>Declined</b> ${esc(x.title)}. Nothing was changed.`, undo: () => { S.needs.splice(idx, 0, x); paintNeeds(); paintSide(); }, retry: () => toast(ic('refresh') + 'It will ask again with a new plan that follows your note.'), retryLabel: 'Save and ask again' });
}
function afterAnswer(a) {
  if (a === 'no') {
    const e = logH('declined', 'Push the date fix to GitHub', { task: 'Fix the date parsing bug', log: ['git push origin fix/date-parsing', 'Declined before running. Nothing was pushed.'] });
    whyCard(e, { msg: '<b>Declined</b> Push the date fix. Nothing was pushed.', retry: () => toast(ic('refresh') + 'The task continues with your note.'), retryLabel: 'Save and continue this way' });
  } else logH('approved', 'Push the date fix to GitHub', { task: 'Fix the date parsing bug', log: ['git push origin fix/date-parsing', a === 'always' ? 'Answer: Always allow in invoice-tool' : 'Approved'] });
}

/* ---------- Approvals page ---------- */
function approvals() {
  $('#view').innerHTML = `<div class="apage"><div class="ahead"><h1>Approvals</h1><p>Requests waiting for you, every decision you made, and the rules that came from them.</p></div>
    <div class="subtabs" role="tablist" id="apTabs"></div><div id="apBody"></div></div>`;
  paintApprovals(true);
}
function paintApprovals(full) {
  if (S.view !== 'needs' || !$('#apBody')) return;
  const n = needsList().length, noR = S.hist.filter(h => asksWhy(h.kind) && !h.reason).length;
  $('#apTabs').innerHTML = [['waiting', 'Waiting', n, n ? 'ask' : ''], ['history', 'History', S.hist.length, ''], ['rules', 'Rules', S.rules.length, S.suggest ? 'ask' : '']].map(([k, l, c, cls]) => `<button role="tab" data-sub="${k}" class="${S.sub === k ? 'on' : ''}">${l}<span class="c ${cls}">${c || ''}</span></button>`).join('');
  const b = $('#apBody');
  if (S.sub === 'waiting') b.innerHTML = waitingHTML();
  else if (S.sub === 'rules') b.innerHTML = rulesHTML();
  else {
    if (full || !$('#hList')) {
      b.innerHTML = `<div class="htool"><div class="seg">${[['all', 'All'], ['approved', 'Approved'], ['declined', 'Declined'], ['stopped', 'Stopped'], ['undone', 'Undone'], ['setting', 'Settings'], ['noreason', `No reason${noR ? ' \u00b7 ' + noR : ''}`]].map(([k, l]) => `<button data-hf="${k}" class="${S.hf === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <label class="hsearch">${ic('search')}<input id="hq" placeholder="Search titles, reasons, notes" value="${esc(S.hq)}" autocomplete="off" spellcheck="false"></label></div><div id="hList"></div>`;
      $('#hq').addEventListener('input', ev => { S.hq = ev.target.value; paintHist(); });
    } else $$('[data-hf]').forEach(x => { x.classList.toggle('on', x.dataset.hf === S.hf); if (x.dataset.hf === 'noreason') x.textContent = `No reason${noR ? ' \u00b7 ' + noR : ''}`; });
    paintHist();
  }
}
function waitingHTML() {
  const list = needsList(); S.aSel = Math.max(0, Math.min(S.aSel, list.length - 1));
  if (!list.length) {
    const h = S.hist[0];
    return `<div class="card allclear wide"><span class="ic">${ic('check')}</span><div><div style="color:var(--text)">No approvals waiting.</div><div class="faint" style="font-size:12.5px">${h ? `Last decision: ${esc(h.t)} \u00b7 ${KIND[h.kind][1].toLowerCase()} \u00b7 ${h.time}` : 'New requests appear here, on Home and in the sidebar.'}</div></div>${h ? '<button class="btn sec sm" data-sub="history" style="margin-left:auto">Open History</button>' : ''}</div>`;
  }
  const x = list[S.aSel], src = x.id === 'push' ? 'Task' : 'PC health';
  return `<div class="wgrid"><div class="wlist">${list.map((y, i) => `<button class="witem ${i === S.aSel ? 'on' : ''}" data-ai="${i}"><span class="tag ${y.id === 'push' ? 'live' : ''}">${y.id === 'push' ? 'Task' : 'PC health'}</span><div class="t">${esc(y.title)}</div><div class="m">${esc(y.src.replace(/^PC health \u00b7 /, 'Found at '))}</div></button>`).join('')}
      <div class="wkeys"><kbd>\u2191</kbd><kbd>\u2193</kbd> move <kbd>Y</kbd> approve <kbd>N</kbd> later <kbd>D</kbd> decline</div></div>
    <div class="card wdet"><div class="src"><span class="tag ${x.id === 'push' ? 'live' : ''}">${src}</span>${esc(x.src.replace(/^PC health \u00b7 /, 'Found at '))}${x.when ? ' \u00b7 ' + x.when : ''}</div>
      <div class="tt">${esc(x.title)}</div><div class="cmd">${esc(x.cmd)}</div>
      <div class="facts">${x.facts.map(([i, t]) => `<div class="fact">${ic(i)}<span>${t}</span></div>`).join('')}</div>
      <h6>What it changes</h6><ul class="wfiles">${(x.det || []).map(([a, c]) => `<li><span>${esc(a)}</span><span class="mono">${esc(c)}</span></li>`).join('')}</ul>
      <div class="wsim">${ic('history')}<span>${esc(D.similar[x.id] || 'First request of this kind.')}</span></div>
      <div class="acts"><button class="btn pri" data-ay="${S.aSel}">${x.yes}<kbd>Y</kbd></button><button class="btn sec" data-an="${S.aSel}">Later<kbd>N</kbd></button><button class="btn ghost" data-ad="${S.aSel}">${ic('ban')}Decline<kbd>D</kbd></button></div></div></div>`;
}
function paintHist() {
  const box = $('#hList'); if (!box) return;
  const q = S.hq.trim().toLowerCase();
  const list = S.hist.filter(h => (!S.hr || h.reason === S.hr) && (S.hf === 'all' || (S.hf === 'noreason' ? asksWhy(h.kind) && !h.reason : h.kind === S.hf || (S.hf === 'undone' && h.kind === 'redone'))) && (!q || [h.t, h.reason, h.note, h.task].join(' ').toLowerCase().includes(q)));
  if (!list.length) { box.innerHTML = `<div class="hempty">${ic('search')}${S.hist.length ? 'Nothing matches.' : 'Nothing yet. Every approval, decline, stop and undo appears here with its reason and log.'}</div>`; return; }
  const days = [...new Set(list.map(h => h.day))];
  box.innerHTML = reasonsSummary() + days.map(d => `<div class="hday">${d}</div><div class="card hcard">${list.filter(h => h.day === d).map(rowHTML).join('')}</div>`).join('');
  $$('.hrow.fresh').forEach(r => { r.classList.remove('fresh'); });
  const ed = $('#hEditIn'); if (ed && S.hEdit) ed.focus();
}
function reasonsSummary() {
  const c = {}; S.hist.forEach(h => { if (h.reason && asksWhy(h.kind)) c[h.reason] = (c[h.reason] || 0) + 1; });
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]); if (!top.length) return '';
  const max = top[0][1];
  return `<div class="hsum"><div class="k">Reasons, last 7 days</div><div class="hbars">${top.slice(0, 6).map(([r, n]) => `<button data-hr="${esc(r)}" class="${S.hr === r ? 'on' : ''}"><span class="lb">${esc(r)}</span><span class="tr"><i style="width:${Math.round(n / max * 100)}%"></i></span><span class="mono">${n}</span></button>`).join('')}</div>${S.hr ? `<button class="linkbtn" data-hr="">${ic('x')}Show all reasons</button>` : ''}</div>`;
}
function rowHTML(h) {
  const [i, label, cls] = KIND[h.kind], open = S.hOpen === h.id;
  const nm = (h.marks || []).length, right = h.reason || h.note || nm ? `${h.reason || nm ? `<span class="rsl">${h.reason ? `<span class="rs">${esc(h.reason)}</span>` : ''}${nm ? `<span class="mkc">${ic('flag')}${plural(nm, 'line')}</span>` : ''}</span>` : ''}${h.note ? `<span class="nt">${esc(h.note)}</span>` : ''}` : asksWhy(h.kind) ? '<span class="nr">No reason given</span>' : '';
  return `<div class="hrow ${open ? 'open' : ''} ${h.fresh ? 'fresh' : ''}" id="hr-${h.id}"><button class="hmain" data-hx="${h.id}" aria-expanded="${open}"><span class="hic ${cls}">${ic(i)}</span>
    <div class="hm"><div class="t">${esc(h.t)}</div><div class="m"><span class="tag ${cls}">${label}</span>${h.task && h.task !== h.t ? esc(h.task) + ' \u00b7 ' : ''}${h.time}</div></div><div class="hr">${right}</div><span class="chev">${ic('down')}</span></button>
    ${open ? detHTML(h) : ''}</div>`;
}
function detHTML(h) {
  const edit = S.hEdit === h.id || (asksWhy(h.kind) && !h.reason && !h.note);
  const reason = !asksWhy(h.kind) ? `<p class="faint">${h.kind === 'approved' ? 'Approvals do not ask for a reason.' : 'No reason needed.'}</p>`
    : edit ? `<div class="wchips">${WHY[h.kind].map(c => `<button data-hc="${esc(c)}" class="${(S.hEdit === h.id ? S.hDraft : '') === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
      <div class="wrow"><input id="hEditIn" data-hid="${h.id}" placeholder="Details, or what to do instead" value="${esc(S.hEdit === h.id ? S.hNote : '')}" autocomplete="off" spellcheck="false"><button class="btn pri sm" data-hsave="${h.id}">Save</button></div>`
    : `<p>${h.reason ? `<span class="rs">${esc(h.reason)}</span>` : ''}${h.note ? ` ${esc(h.note)}` : ''}</p><button class="linkbtn" data-hedit="${h.id}">${ic('pencil')}Edit reason</button>`;
  return `<div class="hdet"><div class="hcol"><h6>Reason</h6>${reason}<h6>What happened next</h6><p class="${h.next ? '' : 'faint'}">${esc(h.next || 'Nothing else yet.')}</p></div>
    <div class="hcol"><h6>Log at the time${asksWhy(h.kind) ? '<span class="hint">Click a line to point at it</span>' : ''}</h6><div class="hlog">${h.log.map((l, i) => `<button class="ll ${(h.marks || []).includes('l' + i) ? 'mk' : ''}" ${asksWhy(h.kind) ? `data-hm="${h.id}|l${i}"` : 'disabled'}><span class="fl">${ic('flag')}</span>${esc(l)}</button>`).join('') || '<span class="faint">No log lines.</span>'}</div>${h.files.length ? `<h6>Files</h6><ul class="wfiles">${h.files.map(([a, c], i) => `<li class="${(h.marks || []).includes('f' + i) ? 'mk' : ''}"><span>${(h.marks || []).includes('f' + i) ? ic('flag') : ''}${esc(a)}</span><span class="mono">${esc(c)}</span></li>`).join('')}</ul>` : ''}</div></div>`;
}
function rulesHTML() {
  const s = S.suggest;
  return `${s ? `<div class="card srule">${ic('rule')}<div class="sb"><div class="k">Suggested rule</div><div class="w">${esc(s.what)}</div><div class="d">${esc(s.why)} <button class="linkbtn inl" data-hopen="${s.refs[0]}">See the stops</button></div></div>
      <div class="acts"><button class="btn ghost sm" data-sr="no">Not now</button><button class="btn pri sm" data-sr="yes">Add rule</button></div></div>` : ''}
    <div class="card rules">${S.rules.map(r => `<div class="rrow"><div class="rw"><div class="w">${esc(r.what)}</div><div class="m">${esc(r.from)}${r.ref ? ` \u00b7 <button class="linkbtn inl" data-hopen="${r.ref}">View decision</button>` : ''}</div></div>
      <button class="rval ${r.val}" data-rv="${r.id}" ${r.locked ? 'disabled title="Built in. Cannot be changed."' : ''}>${RVAL[r.val]}${ic(r.locked ? 'lock' : 'down')}</button>
      <button class="mini" data-rdel="${r.id}" aria-label="Remove rule" ${r.locked ? 'style="visibility:hidden"' : ''}>${ic('x')}</button></div>`).join('')}</div>
    <p class="rnote">${ic('shield')}Rules come from your answers and notes. Built-in rules keep deleting, installing and Windows changes on Ask first. Full per-action settings are in Settings.</p>`;
}
/* Point at a line while a task runs: flag it, say what is wrong, the task gets it as an instruction. */
function flagLine(type, key) {
  const [src, n] = key.split('|'), fk = type === 'd' ? key : 't:' + key;
  let title, line, file;
  if (type === 'd') { const d = D.diffs[src], l = d.lines.find(x => String(x[1]) === n); file = d.file; line = (l ? l[2] : '').trim(); title = `Line ${n} in ${file.split('/').pop()}`; }
  else { line = D.term[src][+n]; file = 'Terminal'; title = `Terminal: ${line.slice(0, 48)}`; }
  S.flags.add(fk); if (mounted) paintInsp();
  const e = logH('flagged', title, { task: 'Fix the date parsing bug', log: [line], files: type === 'd' ? [[file, 'line ' + n]] : [] });
  e.marks = ['l0'];
  whyCard(e, { msg: `<b>Flagged</b> ${esc(title)}. The task keeps going.`, q: 'What is wrong with it?', saveLabel: 'Send to task',
    undo: () => { S.flags.delete(fk); if (mounted) paintInsp(); },
    onSave: x => { if (S.view === 'task' && !R.done) addStep({ kind: 'note', title: `${title}: ${[x.reason, x.note].filter(Boolean).join(' \u2014 ') || 'check this line'}` }); } });
}
function openH(id) { S.sub = 'history'; S.hf = 'all'; S.hq = ''; S.hOpen = id; S.hEdit = null; if (S.view !== 'needs') go('needs'); else paintApprovals(true); setTimeout(() => { const r = $('#hr-' + id); if (r) r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); }

document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-hr],[data-hm],[data-flag],[data-tflag],[data-sub],[data-ai],[data-ay],[data-an],[data-ad],[data-hf],[data-hx],[data-hc],[data-hsave],[data-hedit],[data-hopen],[data-sr],[data-rv],[data-rdel],[data-act="openHistory"]');
  if (!t) return;
  const d = t.dataset;
  if (d.hr != null) { S.hr = S.hr === d.hr ? '' : d.hr; return paintHist(); }
  if (d.hm) { const [id, k] = d.hm.split('|'), h = S.hist.find(x => x.id === id); h.marks = (h.marks || []).includes(k) ? h.marks.filter(x => x !== k) : (h.marks || []).concat(k); return paintHist(); }
  if (d.flag || d.tflag) return flagLine(d.flag ? 'd' : 't', d.flag || d.tflag);
  if (d.act === 'openHistory') { S.sub = 'history'; S.hOpen = null; return go('needs'); }
  if (d.sub) { S.sub = d.sub; S.hEdit = null; return paintApprovals(true); }
  if (d.ai) { S.aSel = +d.ai; return paintApprovals(); }
  if (d.ay || d.an) { S.dIdx = +(d.ay || d.an); return decide(!!d.ay); }
  if (d.ad) return declineNeed(+d.ad);
  if (d.hf) { S.hf = d.hf; return paintApprovals(); }
  if (d.hx) { S.hOpen = S.hOpen === d.hx ? null : d.hx; S.hEdit = null; S.hDraft = ''; return paintHist(); }
  if (d.hc) { const inp = $('#hEditIn'), id = inp.dataset.hid; if (S.hEdit !== id) { S.hEdit = id; S.hDraft = ''; } S.hNote = inp.value; S.hDraft = S.hDraft === d.hc ? '' : d.hc; return paintHist(); }
  if (d.hedit) { const h = S.hist.find(x => x.id === d.hedit); S.hEdit = h.id; S.hDraft = h.reason; S.hNote = h.note; return paintHist(); }
  if (d.hsave) {
    const h = S.hist.find(x => x.id === d.hsave), inp = $('#hEditIn'); const prev = [h.reason, h.note];
    h.reason = S.hEdit === h.id ? S.hDraft : ''; h.note = inp.value.trim(); S.hEdit = null; S.hDraft = '';
    paintApprovals(); return toast(ic('check') + (h.reason || h.note ? 'Reason saved.' : 'Nothing to save.'), () => { [h.reason, h.note] = prev; paintApprovals(); });
  }
  if (d.hopen) return openH(d.hopen);
  if (d.sr) {
    const s = S.suggest; S.suggest = null;
    if (d.sr === 'yes') { const r = { id: 'r' + Date.now(), what: s.what, val: 'on', from: 'Suggested from 2 stops, added by you today', ref: s.refs[0] }; S.rules.unshift(r); paintApprovals(); return toast(ic('rule') + 'Rule added.', () => { S.rules = S.rules.filter(x => x !== r); S.suggest = s; paintApprovals(); }); }
    paintApprovals(); return toast(ic('clock') + 'Hidden. It comes back if it happens again.', () => { S.suggest = s; paintApprovals(); });
  }
  if (d.rv) {
    const r = S.rules.find(x => x.id === d.rv); if (r.locked) return;
    const opts = r.val === 'on' || r.val === 'off' ? [['on', 'On', 'Follow this rule'], ['off', 'Off', 'Keep it, but do not use it']] : [['auto', 'No approval needed', 'Do it and record it in Changes'], ['ask', 'Ask first', 'Ask in Approvals every time'], ['never', 'Never', 'Do not do this, even if a task asks']];
    return pop(t, 'For this action', opts, r.val, v => { const prev = r.val; if (v === prev) return; r.val = v; paintApprovals(); toast(ic('rule') + `${r.what}: ${RVAL[v]}`, () => { r.val = prev; paintApprovals(); }); });
  }
  if (d.rdel) { const i = S.rules.findIndex(x => x.id === d.rdel), [r] = S.rules.splice(i, 1); paintApprovals(); return toast(ic('x') + 'Rule removed.', () => { S.rules.splice(i, 0, r); paintApprovals(); }); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && whyEl && !$('.scrim') && !popEl) { closeWhy(); return; }
  if (S.view !== 'needs' || typing() || $('.scrim') || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.key === 'Enter' && document.activeElement && document.activeElement.id === 'hEditIn') return;
  if (S.sub !== 'waiting') return;
  const k = ev.key.toLowerCase(), n = needsList().length; if (!n) return;
  if (k === 'y') { S.dIdx = S.aSel; decide(true); }
  else if (k === 'n') { S.dIdx = S.aSel; decide(false); }
  else if (k === 'd') declineNeed(S.aSel);
  else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); S.aSel = (S.aSel + (ev.key === 'ArrowDown' ? 1 : -1) + n) % n; paintApprovals(); }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && document.activeElement && document.activeElement.id === 'hEditIn') { ev.preventDefault(); const b = $(`[data-hsave="${document.activeElement.dataset.hid}"]`); if (b) b.click(); } });

/* ---------- v0.9: Settings ---------- */
/* Every setting: one value, a default, a section. Every change gets Undo and a line in History. */
const PERMS = [
  ['read', 'Read files in your folders', 'Opening and searching files you added.', ['auto', 'ask', 'never'], 'auto'],
  ['edit', 'Edit files', 'Every edit is saved in Changes with Undo.', ['auto', 'ask', 'never'], 'ask'],
  ['tests', 'Run tests and build commands', 'pytest, npm test, npm run build. Nothing outside the folder.', ['auto', 'ask', 'never'], 'auto'],
  ['install', 'Install packages', 'npm install, pip install. Can change many files.', ['auto', 'ask', 'never'], 'ask'],
  ['recycle', 'Move files to the Recycle Bin', 'Restorable for 30 days.', ['auto', 'ask', 'never'], 'ask'],
  ['delete', 'Delete files permanently', 'Cannot be undone, so it can never be automatic.', ['ask', 'never'], 'ask'],
  ['branch', 'Push a branch to GitHub', 'Nothing is merged.', ['auto', 'ask', 'never'], 'ask', { 'invoice-tool': 'auto' }, 'h7'],
  ['main', 'Push to main', 'Changes what everyone gets.', ['auto', 'ask', 'never'], 'never', null, 'h6'],
  ['web', 'Read websites', 'Documentation, search results, GitHub issues.', ['auto', 'ask', 'never'], 'auto'],
  ['forms', 'Sign in or fill in forms on websites', 'Uses your accounts, so it asks or never happens.', ['ask', 'never'], 'never'],
  ['win', 'Change Windows settings or startup apps', 'Always asks. Restore point first.', ['ask'], 'ask'],
  ['money', 'Spend money or buy anything', 'Hard limit. Aetheris has no way to pay.', ['never'], 'never'],
];
const PV = { auto: 'Automatic', ask: 'Ask first', never: 'Never' };
const PRESETS = [ // sidebar levels map to these
  { read: 'auto', edit: 'never', tests: 'ask', install: 'never', recycle: 'never', branch: 'never', web: 'auto' },
  { read: 'auto', edit: 'ask', tests: 'auto', install: 'ask', recycle: 'ask', branch: 'ask', web: 'auto' },
  { read: 'auto', edit: 'auto', tests: 'auto', install: 'ask', recycle: 'ask', branch: 'ask', web: 'auto' },
];
const SECS = [
  ['perm', 'shield', 'Permissions'], ['models', 'cpu', 'Models'], ['folders', 'folder', 'Folders'], ['sched', 'cal', 'Schedule'],
  ['notif', 'bell', 'Notifications'], ['reasons', 'note', 'Reasons'], ['privacy', 'eye', 'Privacy and data'], ['look', 'palette', 'Appearance'],
  ['limits', 'lock', 'Hard limits'], ['keys', 'keyboard', 'Shortcuts'],
];
const DEF = {
  'night.on': false, 'night.from': '11 pm', 'night.to': '7 am', 'night.max': '300', 'night.plug': true,
  'quiet.on': true, 'quiet.from': '10 pm', 'quiet.to': '8 am', 'battery': true, 'sleep': 'pause',
  'n.approval': 'win', 'n.failed': 'win', 'n.stuck': 'app', 'n.done': 'app', 'n.daily': 'off', 'n.sound': false,
  'r.ask': 'always', 'r.close': '20', 'r.suggest': '2', 'r.memok': false,
  'p.redact': true, 'p.keep': '90', 'p.paths': true, 'p.share': false,
  'look.theme': 'dark', 'look.size': '14', 'look.motion': false, 'look.density': 'normal',
  'm.guard': '95', 'm.free': true, 'm.offline': 'ask',
  'role.plan': 'auto', 'role.code': 'auto', 'role.sum': 'auto', 'role.check': 'auto',
};
Object.assign(S, {
  cfg: Object.assign({}, DEF, { 'look.theme': S.theme }), setSec: params.get('sec') || 'perm', setQ: '',
  pa: Object.fromEntries(PERMS.map(p => [p[0], p[4]])), paOv: Object.fromEntries(PERMS.map(p => [p[0], Object.assign({}, p[5] || {})])),
  provs: [
    { id: 'gemini', n: 'Google AI Studio', m: 'Gemini 2.5 Flash', key: true, used: 1310, lim: 1500, ms: 820 },
    { id: 'groq', n: 'Groq', m: 'Llama 3.3 70B', key: true, used: 212, lim: 1000, ms: 310 },
    { id: 'openrouter', n: 'OpenRouter', m: 'DeepSeek V3 (free)', key: false, used: 0, lim: 200, ms: 0 },
    { id: 'ollama', n: 'Ollama (this laptop)', m: 'Qwen 2.5 3B', key: null, used: 0, lim: 0, ms: 0, local: true },
  ],
  dirs: [
    { id: 'invoice-tool', p: 'D:\\projects\\invoice-tool', n: '214 files', lv: 'default' },
    { id: 'website', p: 'D:\\projects\\website', n: '1,032 files', lv: 'default' },
    { id: 'downloads', p: 'C:\\Users\\you\\Downloads', n: 'PC health only', lv: 'read' },
  ],
  never: ['D:\\Finance', '*.env', '**/secrets/**', 'C:\\Users\\you\\Documents\\Passwords.kdbx'],
  routines: [
    { id: 'rt1', t: 'Write this week\u2019s report', w: 'Friday \u00b7 6 pm', on: true },
    { id: 'rt2', t: 'Check for package updates in website', w: 'Monday \u00b7 9 am', on: true },
    { id: 'rt3', t: 'PC health check', w: 'Every day \u00b7 1 pm', on: false },
  ],
});
const SKEY = {}; // search index: key -> [section, label]

function settings() {
  $('#view').innerHTML = `<div class="spage"><nav class="snav" aria-label="Settings sections">
      <label class="hsearch ssearch">${ic('search')}<input id="setQ" placeholder="Search settings" autocomplete="off" spellcheck="false" value="${esc(S.setQ)}"><kbd>/</kbd></label>
      <div id="snavList"></div><div class="schg" id="schg"></div></nav>
    <div class="sbody" id="sbody"></div></div>`;
  $('#setQ').addEventListener('input', ev => { S.setQ = ev.target.value; paintSettings(); });
  paintSettings();
}
const changedIn = sec => Object.keys(SKEY).filter(k => SKEY[k][0] === sec && isChanged(k)).length;
function isChanged(k) {
  if (k.startsWith('perm.')) { const id = k.slice(5), p = PERMS.find(x => x[0] === id); return S.pa[id] !== p[4] || JSON.stringify(S.paOv[id]) !== JSON.stringify(p[5] || {}); }
  return k in DEF && S.cfg[k] !== DEF[k];
}
function paintSettings() {
  if (S.view !== 'settings' || !$('#sbody')) return;
  buildIndex();
  const q = S.setQ.trim().toLowerCase();
  const nchg = Object.keys(SKEY).filter(isChanged).length;
  $('#snavList').innerHTML = SECS.map(([k, i, l]) => { const c = changedIn(k); return `<button data-ssec="${k}" class="${S.setSec === k && !q ? 'on' : ''}">${ic(i)}<span>${l}</span>${c ? `<span class="dot" title="${plural(c, 'setting')} changed"></span>` : ''}</button>`; }).join('');
  $('#schg').innerHTML = nchg ? `<span>${plural(nchg, 'setting')} changed from the default</span><button class="linkbtn" data-sall="changed">Show</button>` : '<span>All settings are at their defaults.</span>';
  const b = $('#sbody');
  if (q || S.setSec === '_changed') {
    const hits = Object.entries(SKEY).filter(([k, [s, l, d]]) => S.setSec === '_changed' && !q ? isChanged(k) : (l + ' ' + d + ' ' + s).toLowerCase().includes(q));
    b.innerHTML = `<div class="shead"><h1>${q ? `Results for \u201c${esc(S.setQ)}\u201d` : 'Changed from the default'}</h1><p>${plural(hits.length, 'setting')}. Click one to open it.</p></div>
      <div class="card sres">${hits.map(([k, [s, l, d]]) => `<button data-sjump="${k}"><div><div class="t">${esc(l)}</div><div class="m">${esc(SECS.find(x => x[0] === s)[2])}${d ? ' \u00b7 ' + esc(d) : ''}</div></div>${isChanged(k) ? '<span class="tag ask">Changed</span>' : ''}${ic('right')}</button>`).join('') || `<div class="hempty">${ic('search')}No setting matches. Try \u201cnotifications\u201d, \u201cdelete\u201d or \u201cmodel\u201d.</div>`}</div>`;
    return;
  }
  b.innerHTML = SEC[S.setSec]();
  afterPaint();
}
function buildIndex() {
  if (Object.keys(SKEY).length) return;
  const keep = S.setSec; const tmp = document.createElement('div');
  SECS.forEach(([k]) => { tmp.innerHTML = SEC[k](); $$('[data-skey]', tmp).forEach(r => { SKEY[r.dataset.skey] = [k, r.dataset.sl || ($('.sl', r) || r).textContent.trim(), r.dataset.sd || ($('.sd', r) || { textContent: '' }).textContent.trim()]; }); });
  S.setSec = keep;
  SKEY['night.to'] = ['sched', 'Overnight practice ends', '']; SKEY['quiet.to'] = ['sched', 'Quiet hours end', ''];
}
function afterPaint() {
  const pl = $('#provList'); if (pl && !pl.dataset.drag) { pl.dataset.drag = 1; dragList(pl, '.prow', 'pv', (f, t) => { const prev = S.provs.slice(), i = S.provs.findIndex(x => x.id === f), j = S.provs.findIndex(x => x.id === t), [x] = S.provs.splice(i, 1); S.provs.splice(j, 0, x); logSet('Model order', prev.map(p => p.n.split(' ')[0]).join(', '), S.provs.map(p => p.n.split(' ')[0]).join(', ')); paintSettings(); toast(ic('route') + `Order changed. ${S.provs[0].n} is tried first.`, () => { S.provs = prev; paintSettings(); }); }); }
}

/* row helpers. data-skey makes a row searchable and lets search jump to it. */
const changedTag = k => isChanged(k) ? `<button class="sreset" data-sreset="${k}" title="Back to the default">${ic('refresh')}Default</button>` : '';
function row(k, label, desc, ctrl, extra = '') { return `<div class="srow" data-skey="${k}" id="sr-${k.replace(/\./g, '-')}"><div class="sx"><div class="sl">${label}</div>${desc ? `<div class="sd">${desc}</div>` : ''}${extra}</div><div class="sc">${changedTag(k)}${ctrl}</div></div>`; }
function seg(k, opts) { return `<div class="seg sseg">${opts.map(([v, l]) => `<button data-sset="${k}" data-v="${v}" class="${S.cfg[k] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`; }
function tog(k, locked) { return `<button class="sw ${S.cfg[k] ? 'on' : ''} ${locked ? 'locked' : ''}" data-stog="${k}" role="switch" aria-checked="${!!S.cfg[k]}" ${locked ? 'disabled title="Always on"' : ''}></button>`; }
function pick(k, opts, title) { const cur = opts.find(o => o[0] === S.cfg[k]) || opts[0]; return `<button class="rval spick" data-spick="${k}" data-opts='${esc(JSON.stringify(opts))}' data-title="${esc(title || '')}">${esc(cur[1])}${ic('down')}</button>`; }
const group = (h, inner, note) => `<section class="sgroup"><h2>${h}</h2>${note ? `<p class="snote">${note}</p>` : ''}<div class="card slist">${inner}</div></section>`;
const head = (t, p) => `<div class="shead"><h1>${t}</h1><p>${p}</p></div>`;

const SEC = {
  perm: () => {
    const lv = LEVELS.map((l, i) => `<button data-spre="${i}" class="${S.level === i ? 'on' : ''}">${l[0]}</button>`).join('');
    const rows = PERMS.map(([id, l, d, allowed, def, ov, ref]) => {
      const v = S.pa[id], o = S.paOv[id], ovs = Object.entries(o);
      const locked = allowed.length === 1;
      return `<div class="srow prm" data-skey="perm.${id}" data-sl="${esc(l)}" data-sd="${esc(d)}" id="sr-perm-${id}"><div class="sx"><div class="sl">${esc(l)}</div><div class="sd">${esc(d)}${ref ? ` <button class="linkbtn inl" data-hopen="${ref}">Why</button>` : ''}</div>
        ${ovs.length ? `<div class="sov">${ovs.map(([f, x]) => `<button class="ovc" data-sov="${id}|${f}">${ic('folder')}${esc(f)}: <b class="${x}">${PV[x]}</b>${ic('x')}</button>`).join('')}</div>` : ''}</div>
        <div class="sc">${changedTag('perm.' + id)}${locked ? '' : `<button class="mini" data-saddov="${id}" title="Different for one folder" aria-label="Different for one folder">${ic('folder')}</button>`}<button class="rval ${v}" data-sperm="${id}" ${locked ? 'disabled title="Hard limit. Cannot be changed."' : ''}>${PV[v]}${ic(locked ? 'lock' : 'down')}</button></div></div>`;
    }).join('');
    return head('Permissions', 'What Aetheris may do on its own, what it asks about first, and what it never does. Rules from your answers in Approvals change these too.')
      + `<div class="card spre"><div><div class="sl">Start from</div><div class="sd">Same as Permissions in the sidebar. Rows below can differ.</div></div><div class="seg sseg">${lv}</div></div>`
      + `<section class="sgroup"><h2>Per action</h2><div class="card slist">${rows}</div></section>`
      + `<section class="sgroup"><h2>Check an action</h2><p class="snote">Type something a task might do. It shows what would happen and which setting decides it.</p>
        <div class="card stest"><label class="hsearch">${ic('flask')}<input id="sTest" placeholder="For example: delete 40 old files in Downloads" autocomplete="off" spellcheck="false"></label>
        <div class="sex">${['delete 40 old files in Downloads', 'push to main in website', 'npm install in invoice-tool', 'open D:\\Finance\\tax-2025.pdf', 'push a branch in invoice-tool', 'buy a domain name'].map(x => `<button data-stry="${esc(x)}">${esc(x)}</button>`).join('')}</div><div id="sTestOut"></div></div></section>`;
  },
  models: () => head('Models', 'Free online models do the thinking; this laptop does the work. If one runs out or fails, the next one in the list is used.')
    + `<section class="sgroup"><h2>Order <span class="faint">Drag to change. The first one with requests left is used.</span></h2><div class="card slist" id="provList">${S.provs.map((p, i) => `<div class="srow prow" draggable="true" data-pv="${p.id}" data-skey="prov.${p.id}" data-sl="${esc(p.n)}" data-sd="${esc(p.m)}"><span class="grip">${ic('grip')}</span><span class="pnum mono">${i + 1}</span><div class="sx"><div class="sl">${esc(p.n)} <span class="faint">\u00b7 ${esc(p.m)}</span></div>
        <div class="sd">${p.local ? 'Used only when offline or when you choose it. Slower, nothing leaves the laptop.' : p.key ? `<span class="pbar"><i style="width:${Math.round(p.used / p.lim * 100)}%" class="${p.used / p.lim > .8 ? 'hi' : ''}"></i></span><span class="mono">${p.used.toLocaleString('en')} / ${p.lim.toLocaleString('en')} today</span>` : 'No key yet. Free key from openrouter.ai.'}</div></div>
        <div class="sc">${p.local ? `<span class="tag">Not installed</span><button class="btn sec sm" data-sprov="setup:${p.id}">Set up</button>` : p.key ? `<span class="tag good">Connected</span><button class="btn ghost sm" data-sprov="test:${p.id}">Test</button><button class="btn ghost sm" data-sprov="key:${p.id}">${ic('key')}Key</button>` : `<button class="btn sec sm" data-sprov="key:${p.id}">${ic('key')}Add key</button>`}</div></div>`).join('')}</div></section>`
    + group('Which model for what', [['plan', 'Planning', 'Breaking a task into steps'], ['code', 'Code changes', 'Writing and fixing code'], ['sum', 'Summaries', 'Reports, notes, History'], ['check', 'Quick checks', 'Short yes / no questions, sorting']].map(([k, l, d]) => row('role.' + k, l, d, pick('role.' + k, [['auto', 'Auto', 'Best one with requests left']].concat(S.provs.filter(p => p.key !== false).map(p => [p.id, p.m, p.n])), l))).join(''))
    + group('Limits', row('m.free', 'Free tiers only', 'Paid keys are refused. Aetheris runs at $0.', tog('m.free', true))
      + row('m.guard', 'Stop using a model at', 'Leaves room for the tasks you start yourself.', seg('m.guard', [['80', '80 %'], ['95', '95 %'], ['100', '100 %']]))
      + row('m.offline', 'When offline', 'What running tasks do without internet.', seg('m.offline', [['ask', 'Ask'], ['local', 'Use local model'], ['wait', 'Wait']]))),
  folders: () => head('Folders', 'Aetheris only opens folders on this list. Everything else on the laptop is out of reach.')
    + `<section class="sgroup"><h2>Folders it can use</h2><div class="card slist">${S.dirs.map(d => `<div class="srow" data-skey="dir.${d.id}" data-sl="${esc(d.id)}" data-sd="${esc(d.p)}"><span class="fic">${ic('folder')}</span><div class="sx"><div class="sl">${esc(d.id)}</div><div class="sd mono">${esc(d.p)} \u00b7 ${esc(d.n)}</div></div><div class="sc"><button class="rval ${d.lv}" data-sdir="${d.id}">${d.lv === 'default' ? 'Same as Permissions' : d.lv === 'read' ? 'Read only' : d.lv === 'ask' ? 'Ask first' : 'Edit files'}${ic('down')}</button><button class="mini" data-sdirrm="${d.id}" aria-label="Remove folder">${ic('x')}</button></div></div>`).join('')}
      <div class="srow add"><button class="linkbtn" data-sact="addDir">${ic('plus')}Add a folder</button></div></div></section>`
    + `<section class="sgroup"><h2>Never open</h2><p class="snote">Even inside an added folder. Matches files and folders by path or pattern.</p><div class="card slist">${S.never.map((n, i) => `<div class="srow" data-skey="never.${i}" data-sl="${esc(n)}" data-sd="Never open"><span class="fic">${ic('ban')}</span><div class="sx"><div class="sl mono">${esc(n)}</div></div><div class="sc"><button class="mini" data-snrm="${i}" aria-label="Remove">${ic('x')}</button></div></div>`).join('')}
      <div class="srow add"><div class="wrow" style="margin:0;flex:1"><input id="sNever" placeholder="Path or pattern, for example *.pem" autocomplete="off" spellcheck="false"><button class="btn sec sm" data-sact="addNever">Add</button></div></div></div></section>`
    + group('Inside folders', row('p.paths', 'Skip build and cache folders', 'node_modules, .venv, dist, .git. Faster and fewer requests.', tog('p.paths'))),
  sched: () => head('Schedule', 'When Aetheris works without you, and when it stays quiet.')
    + group('Overnight practice', row('night.on', 'Practise while you are away', 'Tries small improvements on past tasks and keeps only what passes the tests. Results in Progress.', tog('night.on'))
      + row('night.from', 'Practice hours', '', `${pick('night.from', ['9 pm', '10 pm', '11 pm', '12 am'].map(x => [x, x]), 'From')}<span class="faint">and</span>${pick('night.to', ['5 am', '6 am', '7 am', '8 am'].map(x => [x, x]), 'To')}`)
      + row('night.max', 'Requests it may use', 'Taken from the free limit. Tasks you start always come first.', seg('night.max', [['100', '100'], ['300', '300'], ['600', '600']]))
      + row('night.plug', 'Only when plugged in', '', tog('night.plug')), S.cfg['night.on'] ? '' : 'Off. Turn it on to let Aetheris practise at night.')
    + `<section class="sgroup"><h2>Routines</h2><p class="snote">Tasks that start on their own. Each run shows in Tasks and History like any other.</p><div class="card slist">${S.routines.map(r => `<div class="srow" data-skey="rt.${r.id}" data-sl="${esc(r.t)}" data-sd="${esc(r.w)}"><span class="fic">${ic('cal')}</span><div class="sx"><div class="sl">${esc(r.t)}</div><div class="sd">${esc(r.w)}</div></div><div class="sc"><button class="btn ghost sm" data-srt="run:${r.id}">${ic('play')}Run now</button><button class="sw ${r.on ? 'on' : ''}" data-srt="tog:${r.id}" role="switch" aria-checked="${r.on}"></button></div></div>`).join('')}
      <div class="srow add"><button class="linkbtn" data-sact="addRoutine">${ic('plus')}Add a routine</button></div></div></section>`
    + group('Quiet hours', row('quiet.on', 'Quiet hours', 'No notifications. Tasks keep running; approvals wait.', tog('quiet.on')) + row('quiet.from', 'Quiet hours between', '', `${pick('quiet.from', ['9 pm', '10 pm', '11 pm'].map(x => [x, x]), 'From')}<span class="faint">and</span>${pick('quiet.to', ['7 am', '8 am', '9 am'].map(x => [x, x]), 'To')}`))
    + group('Laptop', row('battery', 'On battery, pause heavy tasks', 'Installs, builds and full test runs wait for the charger.', tog('battery')) + row('sleep', 'When the laptop sleeps', '', seg('sleep', [['pause', 'Pause and continue later'], ['stop', 'Stop tasks']]))),
  notif: () => head('Notifications', 'What Aetheris tells you about, and where.')
    + group('Events', [['approval', 'Approval needed', 'Approve or Later from the notification'], ['failed', 'A task failed', ''], ['stuck', 'A task has no progress', 'After 5 min'], ['done', 'A task finished', ''], ['daily', 'Daily summary', '6 pm, what was done and changed']].map(([k, l, d]) => row('n.' + k, l, d, seg('n.' + k, [['win', 'Windows'], ['app', 'In app'], ['off', 'Off']]))).join('') + row('n.sound', 'Sound', '', tog('n.sound')))
    + `<div class="sprev"><button class="btn sec" data-sact="previewNotif">${ic('bell')}Show a test notification</button><span class="faint">${S.cfg['quiet.on'] ? `Quiet hours ${S.cfg['quiet.from']} \u2013 ${S.cfg['quiet.to']}: nothing pops up then.` : ''}</span></div>`,
  reasons: () => head('Reasons', 'The card that asks why after you stop, undo or decline something.')
    + group('Asking', row('r.ask', 'Ask for a reason', 'You can always add one later in History.', seg('r.ask', [['always', 'Always'], ['undo', 'Only stop and undo'], ['never', 'Never']]))
      + row('r.close', 'Close the card after', '', seg('r.close', [['10', '10 s'], ['20', '20 s'], ['40', '40 s'], ['0', 'Stay open']])))
    + group('What reasons may change', row('r.suggest', 'Suggest a rule after the same reason', 'The rule is only added when you click Add rule.', seg('r.suggest', [['2', '2 times'], ['3', '3 times'], ['5', '5 times']]))
      + row('r.memok', 'Ask before adding notes to Memory', 'Off: notes from reasons go to Memory right away and can be removed there.', tog('r.memok'))),
  privacy: () => head('Privacy and data', 'What leaves this laptop, and how long things are kept.')
    + group('Sent to online models', row('p.redact', 'Hide secrets before sending', 'API keys, passwords, tokens, email addresses and your user name are replaced. Always on.', tog('p.redact', true))
      + `<div class="srow col"><div class="sl">What a request looks like</div><pre class="hlog sred">Fix the failing test in <s>C:\\Users\\ravi</s><b>~</b>\\invoice-tool\nconfig.py: API_KEY = "<s>sk-live-9f2a\u2026</s><b>[key hidden]</b>"\nsend report to <s>ravi@example.com</s><b>[email hidden]</b></pre></div>`
      + row('p.share', 'Share anonymous usage with the developers', 'There is no server to send it to yet. Stays off.', tog('p.share', true)))
    + group('Kept on this laptop', row('p.keep', 'Keep History and logs for', 'Changes stay undoable for as long as they are kept.', seg('p.keep', [['30', '30 days'], ['90', '90 days'], ['365', '1 year'], ['0', 'Forever']]))
      + `<div class="srow"><div class="sx"><div class="sl">Everything Aetheris knows and did</div><div class="sd mono">D:\\Aetheris\\data \u00b7 48 MB</div></div><div class="sc"><button class="btn sec sm" data-sact="export">${ic('download')}Export</button><button class="btn ghost sm danger" data-sact="wipe">${ic('trash')}Delete History</button></div></div>`),
  look: () => head('Appearance', '')
    + group('', row('look.theme', 'Theme', '', seg('look.theme', [['dark', 'Dark'], ['light', 'Light']])) + row('look.size', 'Text size', '', seg('look.size', [['13', 'Small'], ['14', 'Default'], ['15', 'Large']]))
      + row('look.motion', 'Reduce motion', 'No sliding or fading. Status still changes colour.', tog('look.motion')) + row('look.density', 'Spacing', '', seg('look.density', [['normal', 'Default'], ['compact', 'Compact']]))),
  limits: () => head('Hard limits', 'These cannot be changed by a setting, a rule, an approval, or by Aetheris itself. They are listed so you can see them.')
    + `<div class="card slist">${[['Never spends money', 'No payment details are stored. Paid model keys are refused.'], ['Never turns off Windows Defender, the firewall or UAC', 'PC health can only report on them.'], ['Never edits System32 or deletes registry keys', 'Windows changes always ask and make a restore point first.'], ['Never deletes permanently without asking', 'Deleting goes to the Recycle Bin unless you approve otherwise.'], ['Cannot change its own safety checks or tests', 'Improvements it tries overnight must pass the same tests as before.'], ['Records every change', 'Every file it changes is saved first, so Undo always works.']].map(([t, d]) => `<div class="srow" data-skey="lim.${t.slice(0, 12)}" data-sl="${esc(t)}" data-sd="${esc(d)}"><span class="fic">${ic('lock')}</span><div class="sx"><div class="sl">${t}</div><div class="sd">${d}</div></div></div>`).join('')}</div>`,
  keys: () => head('Shortcuts', 'Work everywhere in the app unless a text box is focused.')
    + `<div class="card slist skeys">${[['Ctrl K', 'Search and commands'], ['Ctrl N', 'New task'], ['Alt Enter', 'Add to the queue'], ['Ctrl Shift P', 'Pause all'], ['Y / N / D', 'Approve, Later, Decline'], ['\u2191 \u2193', 'Move between items'], ['Space', 'Pause the open task'], ['Esc', 'Close menus and cards'], ['/', 'Search settings']].map(([k, d]) => `<div class="srow" data-skey="key.${k}" data-sl="${esc(d)}" data-sd="${esc(k)}"><div class="sx"><div class="sl">${d}</div></div><div class="sc">${k.split(' ').map(x => /^[\/\u2191\u2193]$|^[A-Z]$|^[A-Za-z]+$/.test(x) ? `<kbd>${x}</kbd>` : `<span class="faint">${x}</span>`).join('')}</div></div>`).join('')}</div>`,
};

/* apply and record */
function logSet(what, from, to) { const e = logH('setting', `${what}: ${to}`, { task: 'Settings', log: [`${what}: ${from} \u2192 ${to}`] }); return e; }
function labelOf(k) { return (SKEY[k] || [0, k])[1]; }
function nice(k, v) { if (typeof v === 'boolean') return v ? 'On' : 'Off'; const b = $(`[data-sset="${k}"][data-v="${v}"]`); return b ? b.textContent : String(v); }
function applyCfg(k) {
  const v = S.cfg[k];
  if (k === 'look.theme' && v !== S.theme) toggleTheme();
  if (k === 'look.size') document.body.style.zoom = v === '13' ? '0.93' : v === '15' ? '1.07' : '';
  if (k === 'look.motion') document.documentElement.classList.toggle('reduce', !!v);
  if (k === 'look.density') document.documentElement.classList.toggle('compact', v === 'compact');
  if (k === 'night.on') { S.away = !!v; if (typeof paintAway === 'function') paintAway(); }
}
function setCfg(k, v) {
  const prev = S.cfg[k]; if (prev === v) return;
  const from = nice(k, prev); S.cfg[k] = v; applyCfg(k); const to = nice(k, v);
  const e = logSet(labelOf(k), from, to); paintSettings();
  toast(ic('sliders') + `${esc(labelOf(k))}: ${esc(to)}`, () => { S.cfg[k] = prev; applyCfg(k); dropH(e); paintSettings(); });
}
function setPerm(id, v, folder) {
  const p = PERMS.find(x => x[0] === id), prev = S.pa[id], prevOv = Object.assign({}, S.paOv[id]);
  if (folder) { if (v === null) delete S.paOv[id][folder]; else S.paOv[id][folder] = v; } else S.pa[id] = v;
  const what = folder ? `${p[1]} in ${folder}` : p[1], to = folder ? (v ? PV[v] : 'same as all folders') : PV[v];
  const e = logSet(what, folder ? (prevOv[folder] ? PV[prevOv[folder]] : 'same as all folders') : PV[prev], to);
  if (!folder) { const r = S.rules.find(x => x.what.toLowerCase().includes(p[1].toLowerCase().split(' ').slice(0, 2).join(' '))); if (r && !r.locked && r.val !== 'on' && r.val !== 'off') r.val = v; }
  paintSettings(); toast(ic('shield') + `${esc(what)}: ${esc(to)}`, () => { S.pa[id] = prev; S.paOv[id] = prevOv; dropH(e); paintSettings(); });
}
function applyPreset(i) {
  const prev = Object.assign({}, S.pa), pl = S.level;
  setLevel(i, true);
  const e = logSet('Permissions', LEVELS[pl][0], LEVELS[i][0]); paintSettings();
  toast(ic('shield') + `Permissions: ${LEVELS[i][0]}. ${plural(Object.keys(PRESETS[i]).filter(k => prev[k] !== S.pa[k]).length, 'row')} changed.`, () => { setLevel(pl, true); S.pa = prev; dropH(e); paintSettings(); });
}
/* "Check an action": which setting decides it, in plain words. */
function checkAction(t) {
  t = t.toLowerCase(); const out = $('#sTestOut'); if (!out) return; if (!t.trim()) { out.innerHTML = ''; return; }
  const dir = S.dirs.find(d => t.includes(d.id.toLowerCase()) || (d.id === 'downloads' && t.includes('download')));
  const nv = S.never.find(n => t.includes(n.toLowerCase().replace(/\\/g, '\\').split('\\').pop().replace('*', '')) && n.length > 4 && t.includes(n.toLowerCase().split('\\')[1] || '~~'));
  let id = /buy|pay|purchase|domain/.test(t) ? 'money' : /push.*main|main.*push/.test(t) ? 'main' : /push|branch/.test(t) ? 'branch' : /delete|remove|clean/.test(t) ? (/permanent/.test(t) ? 'delete' : 'recycle') : /install|npm i|pip/.test(t) ? 'install' : /test|build/.test(t) ? 'tests' : /sign in|log in|form/.test(t) ? 'forms' : /startup|windows|registry/.test(t) ? 'win' : /edit|change|rename|fix/.test(t) ? 'edit' : /website|http|docs/.test(t) ? 'web' : /open|read/.test(t) ? 'read' : null;
  if (/\.env\b|secret|passwords\.kdbx/.test(t)) return out.innerHTML = res('never', 'It never opens this.', 'Folders \u2192 Never open: <span class="mono">*.env</span>, <span class="mono">**/secrets/**</span>, password files', 'folders');
  const pth = (t.match(/[a-z]:\\[^\s]*/) || [])[0];
  if (pth && !/finance/.test(pth) && !S.dirs.some(d => pth.startsWith(d.p.toLowerCase()))) return out.innerHTML = res('never', 'It cannot touch this. The path is outside the folders you added.', `Folders \u2192 Folders it can use. <span class="mono">${esc(pth)}</span> is not on the list.`, 'folders');
  if (/rm -rf|del \/s|format /.test(t)) t += ' permanent delete';
  if (/finance/.test(t)) return out.innerHTML = res('never', 'It never opens this.', `Folders \u2192 Never open: <span class="mono">D:\\Finance</span>`, 'folders');
  if (!id) return out.innerHTML = res('ask', 'Not sure what this is, so it would ask first.', 'Anything it cannot match to a setting asks first.', null);
  const p = PERMS.find(x => x[0] === id), fo = dir && S.paOv[id][dir.id], v = fo || S.pa[id];
  const src = fo ? `Permissions \u2192 ${p[1]} \u2192 override for ${dir.id}` : `Permissions \u2192 ${p[1]}${p[3].length === 1 ? ' (hard limit)' : ''}`;
  out.innerHTML = res(v, v === 'auto' ? 'It does this without asking, and records it in Changes.' : v === 'ask' ? 'It asks in Approvals first.' : 'It never does this, even if a task asks.', src, 'perm.' + id);
  function res(v, t1, t2, jump) { return `<div class="sout ${v}"><span class="rval ${v}">${PV[v]}</span><div><div>${t1}</div><div class="sd">${t2}${jump ? ` <button class="linkbtn inl" data-sjump="${jump}">Open</button>` : ''}</div></div></div>`; }
}
function notifPreview() {
  const n = document.createElement('div'); n.className = 'wnote';
  n.innerHTML = `<div class="wn-h">${MARK}<span>Aetheris</span><span class="faint">now</span><button class="wx" aria-label="Close">${ic('x')}</button></div><div class="wn-t">Approval needed</div><div class="wn-b">Delete 212 old log files in Downloads (1.4 GB). Goes to the Recycle Bin.</div><div class="wn-a"><button data-wn="yes">Approve</button><button data-wn="later">Later</button><button data-wn="open">Open</button></div>`;
  document.body.appendChild(n);
  const close = () => { n.classList.add('out'); setTimeout(() => n.remove(), 250); };
  n.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; close(); if (b.dataset.wn === 'yes') toast(ic('check') + 'Approved from the notification. (Test only: nothing was deleted.)'); else if (b.dataset.wn === 'later') toast(ic('clock') + 'Later: it stays in Approvals.'); else if (b.dataset.wn === 'open') { S.sub = 'waiting'; go('needs'); } });
  setTimeout(close, 8000);
}
function wipeDialog() {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  scrim.innerHTML = `<div class="dlg" role="dialog" aria-label="Delete History"><h3>Delete History?</h3><p>${ic('alert')}Removes ${plural(S.hist.length, 'entry', 'entries')} with their reasons and logs. Changes already made stay, but older ones can no longer be undone from History.</p><p>${ic('download')}Export first if you might need it.</p>
    <div class="acts"><button class="btn ghost" data-dlg="no">Cancel<kbd>Esc</kbd></button><button class="btn danger" data-dlg="yes">${ic('trash')}Delete History</button></div></div>`;
  document.body.appendChild(scrim);
  const close = () => { scrim.remove(); removeEventListener('keydown', key, true); };
  const key = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } };
  addEventListener('keydown', key, true);
  scrim.addEventListener('click', ev => { const b = ev.target.closest('[data-dlg]'); if (ev.target === scrim || (b && b.dataset.dlg === 'no')) return close(); if (b) { const prev = S.hist; S.hist = []; close(); paintApprovals(); toast(ic('trash') + 'History deleted.', () => { S.hist = prev; paintApprovals(); }); } });
}

document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-ssec],[data-sset],[data-stog],[data-spick],[data-sperm],[data-spre],[data-sov],[data-saddov],[data-sjump],[data-sreset],[data-sprov],[data-sdir],[data-sdirrm],[data-snrm],[data-sact],[data-srt],[data-stry],[data-sall]');
  if (!t) return; const d = t.dataset;
  if (d.ssec) { S.setSec = d.ssec; S.setQ = ''; const q = $('#setQ'); if (q) q.value = ''; $('#view').scrollTop = 0; return paintSettings(); }
  if (d.sall) { S.setSec = '_changed'; S.setQ = ''; $('#setQ').value = ''; return paintSettings(); }
  if (d.sset) return setCfg(d.sset, d.v);
  if (d.stog) return setCfg(d.stog, !S.cfg[d.stog]);
  if (d.spick) { const opts = JSON.parse(d.opts); return pop(t, d.title || labelOf(d.spick), opts, S.cfg[d.spick], v => setCfg(d.spick, v)); }
  if (d.sperm) { const p = PERMS.find(x => x[0] === d.sperm); return pop(t, p[1], p[3].map(v => [v, PV[v], v === 'auto' ? 'Do it and record it in Changes' : v === 'ask' ? 'Ask in Approvals every time' : 'Do not do this, even if a task asks']), S.pa[d.sperm], v => setPerm(d.sperm, v)); }
  if (d.saddov) { const p = PERMS.find(x => x[0] === d.saddov); return pop(t, 'Different for one folder', S.dirs.map(x => [x.id, x.id, S.paOv[p[0]][x.id] ? 'Has its own setting' : 'Same as all folders']), null, f => pop(t, `${p[1]} in ${f}`, p[3].map(v => [v, PV[v], '']), S.paOv[p[0]][f], v => setPerm(p[0], v, f))); }
  if (d.sov) { const [id, f] = d.sov.split('|'); return setPerm(id, null, f); }
  if (d.spre) return applyPreset(+d.spre);
  if (d.stry) { const i = $('#sTest'); i.value = d.stry; return checkAction(d.stry); }
  if (d.sreset) { const k = d.sreset; if (k.startsWith('perm.')) { const id = k.slice(5), p = PERMS.find(x => x[0] === id), prev = S.pa[id], po = S.paOv[id]; S.pa[id] = p[4]; S.paOv[id] = Object.assign({}, p[5] || {}); const e = logSet(p[1], PV[prev], PV[p[4]] + ' (default)'); paintSettings(); return toast(ic('refresh') + `${esc(p[1])}: back to ${PV[p[4]]}`, () => { S.pa[id] = prev; S.paOv[id] = po; dropH(e); paintSettings(); }); } return setCfg(k, DEF[k]); }
  if (d.sjump) { const k = d.sjump; S.setSec = (SKEY[k] || [k.split('.')[0]])[0]; S.setQ = ''; $('#setQ').value = ''; paintSettings(); const r = $('#sr-' + k.replace(/\./g, '-')) || $(`[data-skey="${k}"]`); if (r) { r.scrollIntoView({ block: 'center', behavior: 'smooth' }); r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), 1600); } return; }
  if (d.sprov) {
    const [a, id] = d.sprov.split(':'), p = S.provs.find(x => x.id === id);
    if (a === 'test') return toast(ic('check') + `${p.n} answered in ${(p.ms / 1000).toFixed(1)} s. ${(p.lim - p.used).toLocaleString('en')} requests left today.`);
    if (a === 'setup') return toast(ic('download') + 'The full app downloads Ollama and a 2 GB model. Needs about 4 GB of free memory while it runs.');
    if (a === 'key') return keyDialog(p);
  }
  if (d.sdir) { const x = S.dirs.find(y => y.id === d.sdir); return pop(t, x.id, [['default', 'Same as Permissions', 'Uses the settings above'], ['read', 'Read only', 'Never changes anything here'], ['ask', 'Ask first', 'Asks before every change here'], ['edit', 'Edit files', 'Edits without asking; the rest asks']], x.lv, v => { const prev = x.lv; x.lv = v; const e = logSet(`Folder ${x.id}`, prev, v); paintSettings(); toast(ic('folder') + `${x.id}: ${{ default: 'same as Permissions', read: 'read only', ask: 'ask first', edit: 'edit files' }[v]}`, () => { x.lv = prev; dropH(e); paintSettings(); }); }); }
  if (d.sdirrm) { const i = S.dirs.findIndex(y => y.id === d.sdirrm), [x] = S.dirs.splice(i, 1); const e = logSet('Folders', x.id, 'removed'); paintSettings(); return toast(ic('folder') + `${x.id} removed. Aetheris can no longer open it.`, () => { S.dirs.splice(i, 0, x); dropH(e); paintSettings(); }); }
  if (d.snrm) { const i = +d.snrm, [x] = S.never.splice(i, 1); const e = logSet('Never open', x, 'removed'); paintSettings(); return toast(ic('ban') + `${esc(x)} can be opened again if it is in an added folder.`, () => { S.never.splice(i, 0, x); dropH(e); paintSettings(); }); }
  if (d.srt) { const [a, id] = d.srt.split(':'), r = S.routines.find(x => x.id === id); if (a === 'run') { startExtra(r.t); return; } r.on = !r.on; const e = logSet(r.t, r.on ? 'off' : 'on', r.on ? 'on' : 'off'); paintSettings(); return toast(ic('cal') + `${esc(r.t)}: ${r.on ? 'on, ' + r.w : 'off'}`, () => { r.on = !r.on; dropH(e); paintSettings(); }); }
  if (d.sact === 'addNever') { const i = $('#sNever'), v = i.value.trim(); if (!v) return i.focus(); S.never.push(v); const e = logSet('Never open', '', v); paintSettings(); return toast(ic('ban') + `Added: ${esc(v)}`, () => { S.never = S.never.filter(x => x !== v); dropH(e); paintSettings(); }); }
  if (d.sact === 'addDir') { if (S.dirs.find(x => x.id === 'notes')) return toast(ic('folder') + 'The full app opens the Windows folder picker here.'); const x = { id: 'notes', p: 'D:\\notes', n: '86 files', lv: 'read' }; S.dirs.push(x); const e = logSet('Folders', '', 'notes added (read only)'); paintSettings(); return toast(ic('folder') + 'Added D:\\notes as read only. Change it here any time.', () => { S.dirs = S.dirs.filter(y => y !== x); dropH(e); paintSettings(); }); }
  if (d.sact === 'addRoutine') { go('home'); const a = $('#ask'); a.value = 'Every Sunday at 8 pm: '; a.focus(); a.dispatchEvent(new Event('input')); return toast(ic('cal') + 'Describe the routine in the task box. Start with when it should run.'); }
  if (d.sact === 'previewNotif') return notifPreview();
  if (d.sact === 'export') return toast(ic('download') + 'Saved aetheris-export-2026-10-07.zip (2.1 MB) to Downloads. History, Memory, rules and settings, as JSON.');
  if (d.sact === 'wipe') return wipeDialog();
});
function keyDialog(p) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  scrim.innerHTML = `<div class="dlg" role="dialog" aria-label="API key"><h3>${p.key ? 'Replace' : 'Add'} the ${esc(p.n)} key</h3><p>${ic('key')}Free key from ${p.id === 'gemini' ? 'aistudio.google.com' : p.id === 'groq' ? 'console.groq.com' : 'openrouter.ai'}. Stored in Windows Credential Manager, never in a file, never sent anywhere except ${esc(p.n)}.</p>
    <div class="wrow"><input id="keyIn" type="password" placeholder="Paste the key" autocomplete="off"></div>
    <div class="acts"><button class="btn ghost" data-dlg="no">Cancel<kbd>Esc</kbd></button><button class="btn pri" data-dlg="yes">Save and test<kbd>Enter</kbd></button></div></div>`;
  document.body.appendChild(scrim); $('#keyIn').focus();
  const close = () => { scrim.remove(); removeEventListener('keydown', key, true); };
  const ok = () => { const v = $('#keyIn').value.trim(); if (v.length < 8) { $('#keyIn').classList.add('bad'); return toast(ic('alert') + 'That does not look like a key. Paste the whole key.'); } const was = p.key; p.key = true; close(); const e = logSet(`${p.n} key`, was ? 'set' : 'none', 'saved'); paintSettings(); toast(ic('check') + `${p.n}: key saved and working.`, () => { p.key = was; dropH(e); paintSettings(); }); };
  const key = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } if (ev.key === 'Enter') { ev.preventDefault(); ok(); } };
  addEventListener('keydown', key, true);
  scrim.addEventListener('click', ev => { const b = ev.target.closest('[data-dlg]'); if (ev.target === scrim || (b && b.dataset.dlg === 'no')) return close(); if (b) ok(); });
}
document.addEventListener('input', ev => { if (ev.target.id === 'sTest') checkAction(ev.target.value); });
document.addEventListener('keydown', ev => { if (ev.key === '/' && S.view === 'settings' && !typing()) { ev.preventDefault(); $('#setQ').focus(); } });
function nodeFor(s) {
  if (s.kind === 'think') return '<span class="node"></span>';
  if (s.kind === 'ask') return `<span class="node ask"></span>`;
  if (s.kind === 'note') return `<span class="node done look" style="border-color:var(--text-2)"></span>`;
  const sq = s.kind === 'change' ? 'sq' : 'look';
  return `<span class="node ${sq} ${s.state === 'run' ? 'act' : 'done'}"></span>`;
}
function stepHTML(s) {
  const t = fmt(s.t);
  if (s.kind === 'think') return `<div class="tm">${t}</div><div class="rail">${nodeFor(s)}</div><div class="body"><div class="txt">${esc(s.shown)}${s.shown.length < s.text.length ? '<span class="caret"></span>' : ''}</div></div>`;
  if (s.kind === 'note') return `<div class="tm">${t}</div><div class="rail">${nodeFor(s)}</div><div class="body"><div class="ln1"><span class="tt"><span class="faint">You:</span> ${esc(s.title)}</span></div></div>`;
  if (s.kind === 'ask') return `<div class="tm">${t}</div><div class="rail">${nodeFor(s)}</div><div class="body" style="cursor:default;background:none;box-shadow:none">
    <div class="askbox ${s.answer ? 'answered' : ''}"><div class="q">Approval needed: push to GitHub</div>
      <div class="cmd"><span class="pr">$</span>git push origin fix/date-parsing</div>
      <dl><dt>What happens</dt><dd>Creates the branch <span class="mono">fix/date-parsing</span> on GitHub. Nothing is merged into main.</dd><dt>Undo</dt><dd>Delete the branch, one click in Changes today.</dd><dt>Why</dt><dd>Pushing is set to Ask first in invoice-tool.</dd></dl>
      ${s.answer ? `<div class="acts"><span class="tag ${s.answer === 'yes' ? 'good' : ''}">${s.answer === 'yes' ? 'Approved' : 'Skipped'}</span></div>` : `<div class="acts"><button class="btn ask" data-answer="yes">Push <kbd>Y</kbd></button><button class="btn sec" data-answer="no">Later <kbd>N</kbd></button><span class="sp"></span><button class="btn ghost" data-answer="always">Always allow in invoice-tool</button></div>`}
    </div></div>`;
  if (s.kind === 'done') return `<div class="tm">${t}</div><div class="rail"><span class="node done" style="background:var(--good);border-color:var(--good)"></span></div><div class="body" style="cursor:default;background:none;box-shadow:none"><div class="donebox"><div class="q">${ic('check')}${s.title}</div><p>${s.sub}</p><div class="learnt"><span>${ic('memory')}Memory added: invoice-tool dates are day-first.</span><span>${ic('skills')}Skill used: Fix a failing test (v3) \u00b7 21 of 24 runs successful.</span></div>
    <div class="acts">${s.pushed ? `<button class="btn sec" data-act="github">${ic('ext')}Open on GitHub</button>` : `<button class="btn sec" data-answer-late="1">${ic('up')}Push now</button>`}<button class="btn ghost" data-act="undoall">${ic('undo')}Undo all changes</button></div></div></div>`;
  const run = s.state === 'run';
  return `<div class="tm">${t}</div><div class="rail">${nodeFor(s)}</div><div class="body" data-sel="${s.id}">
    <div class="ln1"><span class="tt ${run ? 'shimmer' : ''}">${esc(run ? s.doing : s.title)}</span><span class="tool">${s.tool}</span></div>
    ${!run && s.sub ? `<div class="sub">${s.sub}</div>` : ''}
    ${!run && s.why ? `<div class="why"><span class="tag live">${ic('memory')}Memory</span><span>${s.why}</span></div>` : ''}
    ${!run && s.stats ? `<div class="stats">${s.stats}</div>` : ''}</div>`;
}
function mountStep(s, anim = true) {
  if (!mounted) return;
  const el = document.createElement('div');
  el.className = `st ${s.kind === 'think' ? 'think' : ''} ${R.sel === s.id ? 'sel' : ''}`;
  if (!anim) el.style.animation = 'none';
  el.innerHTML = stepHTML(s);
  $('#thread').appendChild(el); mounted.set(s.id, el);
}
function repaintStep(s) { const el = mounted && mounted.get(s.id); if (el) { el.innerHTML = stepHTML(s); el.classList.toggle('sel', R.sel === s.id); } }
function scrollEnd(instant) { const t = $('#thread'); if (t && R.follow) { if (instant) t.style.scrollBehavior = 'auto'; t.scrollTop = t.scrollHeight; t.style.scrollBehavior = ''; } }
function addStep(s) { bump(1, s.kind === 'ask' ? 'Asked for approval: push to GitHub' : s.kind === 'done' ? 'Completed the date fix' : s.kind === 'note' ? 'Your instruction: ' + s.title : (s.title || s.doing)); s.id = 's' + R.steps.length; s.t = R.clock; R.steps.push(s); mountStep(s); scrollEnd(); return s; }

/* ---------- inspector ---------- */
const TABS = [['changes', 'diff', 'Changes'], ['terminal', 'terminal', 'Terminal'], ['browser', 'globe', 'Browser'], ['files', 'files', 'Files']];
function paneStep() {
  if (!R.follow && R.sel) return R.steps.find(s => s.id === R.sel);
  for (let i = R.steps.length - 1; i >= 0; i--) if (R.steps[i].pane && R.steps[i].pane.tab === R.tab) return R.steps[i];
  return null;
}
function paintInsp() {
  if (!mounted) return;
  const liveTab = R.steps.filter(s => s.state === 'run' && s.pane).map(s => s.pane.tab)[0];
  $('#tabs').innerHTML = TABS.map(([id, i, l]) => `<button data-tab="${id}" class="${R.tab === id ? 'on' : ''}">${ic(i)}${l}${liveTab === id && !R.paused ? '<span class="live-dot"></span>' : ''}</button>`).join('') +
    `<span class="sp"></span><label class="follow">Live<button class="sw ${R.follow ? 'on' : ''}" data-act="follow" role="switch" aria-checked="${R.follow}" aria-label="Follow the live step"></button></label>`;
  const s = paneStep(), pane = $('#pane');
  if (!s || !s.pane || s.pane.tab !== R.tab) { pane.innerHTML = emptyPane(R.tab); return; }
  pane.innerHTML = renderPane(s.pane);
  if (s.pane.tab === 'terminal' || s.pane.tab === 'changes') pane.scrollTop = pane.scrollHeight;
}
function emptyPane(tab) {
  const m = { changes: [ic('diff'), 'No changes yet. Edits appear here line by line.'], terminal: [ic('terminal'), 'Commands and test output appear here.'], browser: [ic('globe'), 'Web pages opened during the task appear here, with the relevant passage highlighted.'], files: [ic('files'), 'Files opened or changed during the task appear here.'] }[tab];
  return `<div class="empty"><div>${m[0]}<div>${m[1]}</div></div></div>`;
}
const PY = /(#.*$)|("(?:[^"\\]|\\.)*"|f"(?:[^"\\]|\\.)*")|\b(def|return|for|in|try|except|raise|continue|from|import|assert)\b|\b(\d+)\b|\b([a-z_]+)(?=\()/g;
function hl(code) {
  let out = '', last = 0; code.replace(PY, (m, c, s, k, n, f, idx) => { out += esc(code.slice(last, idx)); out += c ? `<span class="tk-c">${esc(m)}</span>` : s ? `<span class="tk-s">${esc(m)}</span>` : k ? `<span class="tk-k">${m}</span>` : n ? `<span class="tk-n">${m}</span>` : `<span class="tk-f">${m}</span>`; last = idx + m.length; return m; });
  return out + esc(code.slice(last));
}
function renderPane(p) {
  if (p.tab === 'changes') {
    const d = D.diffs[p.diff], lines = d.lines.slice(0, p.shown);
    return `<div class="file-h">${ic('file')}<span class="mono">${d.file}</span><span class="tag good">+${d.add}</span>${d.del ? `<span class="tag bad" style="margin-left:0">\u2212${d.del}</span>` : ''}${p.shown >= d.lines.length ? `<button class="btn ghost" data-act="undostep">${ic('undo')}Undo</button>` : ''}</div>
      <div class="flaghint">${R.done ? '' : 'Click a line number to flag it. The task keeps going.'}</div><div class="diff">${lines.map(([k, n, c], li) => k === 'h' ? `<div class="l h"><span class="no"></span><span class="sg"></span><span class="cd">${esc(c)}</span></div>` : `<div class="l ${k} ${li === lines.length - 1 && p.shown < d.lines.length ? 'nw' : ''} ${S.flags.has(p.diff + '|' + n) ? 'flagged' : ''}"><span class="no" data-flag="${p.diff}|${n}" title="Flag this line">${n}</span><span class="sg">${k === 'a' ? '+' : k === 'd' ? '\u2212' : ''}</span><span class="cd">${hl(c)}</span></div>`).join('')}</div>`;
  }
  if (p.tab === 'terminal') {
    const lines = D.term[p.term].slice(0, p.shown);
    return `<div class="flaghint" style="padding-top:10px">${R.done ? '' : 'Click a line to flag it.'}</div><div class="term"><div class="blk">${lines.map((l, i) => i === 0 ? `<div class="cmdl">${esc(l)}</div>` : l.startsWith('#f') ? `<div class="sum f">${esc(l.slice(3))}</div>` : l.startsWith('#p') ? `<div class="sum p">${esc(l.slice(3))}</div>` : l.startsWith('E ') ? `<div class="f tl ${S.flags.has('t:' + p.term + '|' + i) ? 'flagged' : ''}" data-tflag="${p.term}|${i}" title="Flag this line">${esc(l)}</div>` : /^[.F]+/.test(l) ? `<div>${esc(l).replace(/F/g, '<span class="f">F</span>').replace(/\./g, '<span class="p">.</span>')}</div>` : `<div class="${l.startsWith('_') ? 'dim' : ''} ${l ? 'tl' : ''} ${S.flags.has('t:' + p.term + '|' + i) ? 'flagged' : ''}" ${l ? `data-tflag="${p.term}|${i}" title="Flag this line"` : ''}>${esc(l) || '&nbsp;'}</div>`).join('')}</div></div>`;
  }
  if (p.tab === 'browser') {
    const rows = [['%a', 'Weekday as an abbreviated name.', 'Sun, Mon, \u2026'], ['%d', 'Day of the month as a zero-padded decimal number.', '01, 02, \u2026, 31'], ['%b', 'Month as an abbreviated name.', 'Jan, Feb, \u2026'], ['%m', 'Month as a zero-padded decimal number.', '01, 02, \u2026, 12'], ['%Y', 'Year with century as a decimal number.', '2025, 2026']];
    const cur = p.at >= 3 ? 3 : p.at >= 1 ? 1 : -1;
    return `<div class="browser"><div class="bar"><span class="lights"><i></i><i></i><i></i></span><span class="url">${ic('lock')}docs.python.org/3/library/datetime.html#format-codes</span>${ic('reload')}</div>
      <div class="page"><h3>strftime() and strptime() format codes</h3><div>The following is a list of all the format codes that the 1989 C standard requires.</div>
        <h4>Directive \u00b7 Meaning \u00b7 Example</h4><table>${rows.map((r, i) => `<tr class="${(p.at >= 1 && i === 1) || (p.at >= 3 && i === 3) ? 'hl' : ''}"><td>${r[0]}</td><td>${r[1]}${i === cur ? '<svg class="cursor" viewBox="0 0 16 16"><path d="M2 1l11 7-5 1-2 5z" fill="var(--text)" stroke="var(--panel)" stroke-width="1.2"/></svg>' : ''}</td><td>${r[2]}</td></tr>`).join('')}</table></div></div>
      ${p.at >= 3 ? `<div class="readnote"><b>Used from this page:</b> %d is the day, %m is the month. The code puts %m first, so 05/10 is read as 10 May.</div>` : ''}`;
  }
  if (p.tab === 'files') {
    const list = D.files.read.slice(0, p.shown);
    return `<div class="files"><h5>Read</h5>${list.map(([f, m]) => `<div class="f">${ic('eye')}<span class="mono">${f}</span><span class="mono faint">${m}</span></div>`).join('')}
      ${R.steps.some(s => s.pane && s.pane.tab === 'changes' && s.state === 'done') ? `<h5>Changed</h5>${R.steps.filter(s => s.pane && s.pane.tab === 'changes').map(s => { const d = D.diffs[s.pane.diff]; return `<div class="f">${ic('pencil')}<span class="mono">${d.file}</span><span style="display:flex;gap:4px"><span class="tag good">+${d.add}</span>${d.del ? `<span class="tag bad">\u2212${d.del}</span>` : ''}</span></div>`; }).join('')}` : ''}</div>`;
  }
  return '';
}

/* ---------- simulation ---------- */
let ff = +(params.get('ff') || 0), hold = params.get('hold'), evN = 0;
const tick = 40;
async function wait(ms) {
  let left = ms;
  while (left > 0) {
    if (ff && evN < ff) { left -= 1e6; R.clock += ms / 1000; break; }
    await new Promise(r => setTimeout(r, tick));
    if (!R.paused && !R.frozen && !S.allPaused && !blocked()) { left -= tick * R.speed; R.clock += tick * R.speed / 1000; }
  }
}
function setNow(t) { R.now = t; paintSide(); paintLives(); }
async function think(text) {
  evN++;
  const s = addStep({ kind: 'think', text, shown: '' });
  setNow('Writing a note');
  for (let i = 0; i < text.length; i += 2) { s.shown = text.slice(0, i + 2); repaintStep(s); await wait(22); }
  s.shown = text; repaintStep(s); scrollEnd();
  await wait(500);
}
async function step(o, work) {
  evN++;
  const s = addStep(Object.assign({ state: 'run' }, o));
  setNow(o.doing);
  if (s.pane && R.follow) R.tab = s.pane.tab;
  paintInsp();
  await work(s);
  s.state = 'done'; repaintStep(s); paintInsp(); scrollEnd();
  await wait(450);
}
async function stream(s, n, ms) { for (let i = 1; i <= n; i++) { bump(1, s.doing); s.pane.shown = i; if (s.pane.tab === 'browser') s.pane.at = i; paintInsp(); await wait(ms); } }
function plan(i) { R.plan = i; paintHead(); paintSide(); paintLives(); }

let answer = null;
function askUser() { return new Promise(r => { answer = r; }); }
function giveAnswer(a) {
  if (!R.ask || !answer) return;
  const s = R.ask; s.answer = a === 'no' ? 'no' : 'yes'; repaintStep(s);
  R.ask = null; const r = answer; answer = null; r(a);
  paintHead(); paintSide(); paintNeeds(); paintLives(); afterAnswer(a);
  if (a === 'always') toast(ic('check') + 'Pushing in invoice-tool no longer needs approval. Change this in Settings.');
}

async function runSim() {
  await wait(300);
  plan(0);
  await think('Bug report: 05/10/2026 was saved as 10 May, not 5 October. Starting with how dates are parsed.');
  await step({ kind: 'look', doing: 'Reading the bug report and dates.py', title: 'Read the bug report and 3 files', tool: 'read_file \u00d73', sub: 'Read only.', pane: { tab: 'files', shown: 0 } }, s => stream(s, 3, 380));
  plan(1);
  await step({ kind: 'look', doing: 'Searching the project for date formats', title: 'Searched the project for date formats', tool: 'search_content', sub: '<span class="mono">strptime</span> is used in 7 places, all through <span class="mono">parse_date()</span>.' }, () => wait(900));
  await step({ kind: 'look', doing: 'Reading Python\u2019s date format codes', title: 'Checked Python\u2019s date format codes', tool: 'web.read', sub: 'docs.python.org: <span class="mono">%d</span> is the day, <span class="mono">%m</span> is the month.', pane: { tab: 'browser', shown: 0, at: 0 } }, s => stream(s, 3, 900));
  await think('parse_date always uses %m/%d/%Y, so the first number is read as the month. These invoices put the day first. Adding a test to confirm before editing code.');
  plan(2);
  await step({ kind: 'change', doing: 'Writing a test for day-first dates', title: 'Added a test for day-first dates', tool: 'edit_file', sub: '<span class="mono">tests/test_dates.py</span>', stats: '<span class="tag good">+5</span>', pane: { tab: 'changes', diff: 'test', shown: 0 } }, s => stream(s, D.diffs.test.lines.length, 260));
  await step({ kind: 'look', doing: 'Running the new test', title: 'New test fails, as expected', tool: 'run_tests', sub: '1 failed, 2 passed. Bug confirmed.', pane: { tab: 'terminal', term: 'one', shown: 0 } }, s => stream(s, D.term.one.length, 230));
  plan(3);
  await step({ kind: 'change', doing: 'Changing parse_date to read the day first', title: 'parse_date now reads the day first', tool: 'edit_file', sub: '<span class="mono">src/invoice/dates.py</span>. ISO dates like 2026-10-05 still work.', why: '29 Sep: you said 05/10 means 5 October.', stats: '<span class="tag good">+8</span><span class="tag bad">\u22123</span>', pane: { tab: 'changes', diff: 'fix', shown: 0 } }, s => stream(s, D.diffs.fix.lines.length, 220));
  plan(4);
  await step({ kind: 'look', doing: 'Running all 40 tests', title: 'All 40 tests pass', tool: 'run_tests', sub: '3.8 s. No regressions.', pane: { tab: 'terminal', term: 'all', shown: 0 } }, s => stream(s, D.term.all.length, 500));
  plan(5);
  evN++;
  R.ask = addStep({ kind: 'ask' });
  setNow('Waiting for you'); paintHead(); paintNeeds();
  const a = await askUser();
  await wait(400);
  if (a !== 'no') {
    await step({ kind: 'change', doing: 'Pushing to GitHub', title: 'Pushed fix/date-parsing to GitHub', tool: 'git_push', sub: 'Branch created. Open a pull request when you\u2019re ready.' }, () => wait(1200));
    S.changed.unshift({ id: 'cpush', t: 'Pushed fix/date-parsing to GitHub', m: 'just now \u00b7 new branch', i: 'branch', fresh: true }); paintChanged();
  }
  R.done = true; plan(6); S.changed.unshift({ id: 'cfix', t: 'Fixed day-first date parsing in invoice-tool', m: 'just now \u00b7 2 files', i: 'pencil', fresh: true }); paintChanged();
  addStep({ kind: 'done', title: `Completed in ${dur(R.clock)}`, sub: `2 files changed, all 40 tests pass. ${a !== 'no' ? 'Pushed to GitHub as fix/date-parsing.' : 'Not pushed. The fix is only on this computer.'}`, pushed: a !== 'no' });
  setNow('Done'); paintHead(); paintNeeds(); paintLives();
}
function dur(sec) { sec = Math.floor(sec); return sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)} min ${sec % 60} s`; }
function fmt(sec) { sec = Math.floor(sec); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
setInterval(() => { if (!R.done && mounted && $('#clock')) $('#clock').textContent = fmt(R.clock); const el = $('#lives .el'); if (el && !R.done) el.textContent = `step ${Math.min(R.plan + 1, 6)} of 6 \u00b7 ${fmt(R.clock)}`; }, 500);
setInterval(() => { if (S.rename.paused || S.allPaused || S.rename.off || blocked()) return; S.rename.file = S.rename.file >= S.rename.total ? 3 : S.rename.file + 1; bump(2, `Rename: edited file ${S.rename.file} of ${S.rename.total}`, 'rename'); paintSide(); if (S.view === 'home') paintLives(); }, 4200);

/* ---------- placeholder pages ---------- */
const PAGES = {
  tasks: ['tasks', 'Tasks', 'Running, queued and completed tasks.', ['Filter by state, folder and date', 'Long goals split into tasks, with progress', 'The full queue, drag to reorder']],
  needs: ['inbox', 'Approvals', 'Every action waiting for your approval.', ['The exact command, what it changes and how to undo it', 'Approve or skip with Y and N', 'Rules such as \u201calways allow pushing in this project\u201d']],
  reports: ['report', 'Reports', 'Daily and weekly summaries.', ['Tasks completed, files changed, errors', 'Time saved, and how it was measured', 'Every line links to its task']],
  learned: ['learn', 'Progress', 'Measured improvement over time.', ['Practice score on a fixed set of 50 tasks', 'Every self-change tried: kept or dropped, and why', 'Success rate of each skill']],
  knows: ['memory', 'Memory', 'What Aetheris remembers about you and your projects.', ['Where each memory came from', 'Edit or delete any memory', 'Rules such as \u201cnever open D:\\\\Finance\u201d']],
  skills: ['skills', 'Skills', 'Reusable procedures and how well they work.', ['Success rate and version history', 'Turn off or roll back a skill', 'Tasks that used each skill']],
  pc: ['pc', 'PC health', 'Disk, memory, startup apps and Windows Security. Read only.', ['Cleanup suggestions that need approval', 'History of cleanups, with restore']],
  settings: ['settings', 'Settings', 'Permissions, models and folders.', ['Per action: Automatic, Ask first or Never', 'Free models and requests left today', 'Folders, overnight practice, theme']],
};
function placeholder(v) {
  const p = PAGES[v];
  $('#view').innerHTML = `<div class="todo-page"><div class="ic">${ic(p[0])}</div><h1>${p[1]}</h1><p>${p[2]}</p><ul>${p[3].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <p style="margin-top:28px" class="faint">Not designed yet. This page is in the design queue.</p>
    <div style="margin-top:16px;display:flex;gap:8px"><button class="btn sec" data-go="home">${ic('home')}Home</button><button class="btn ghost" data-go="task">Open the running task</button></div></div>`;
}

/* ---------- command palette ---------- */
function palette() {
  if ($('.scrim')) return;
  const items = [
    ['Actions', 'plus', 'New task', () => { go('home'); setTimeout(() => $('#ask').focus(), 50); }, 'Ctrl N'],
    ...(R.done ? [] : [['Actions', R.paused ? 'play' : 'pause', R.paused ? 'Resume the date fix' : 'Pause the date fix', togglePause, 'Space']]),
    ['Actions', 'stopall', S.allPaused ? 'Resume all tasks' : 'Pause all tasks', killAll, 'Ctrl \u21e7 P'],
    ['Actions', S.theme === 'dark' ? 'sun' : 'moon', S.theme === 'dark' ? 'Switch to light' : 'Switch to dark', toggleTheme, ''],
    ['Actions', 'away', S.away ? 'Turn off overnight practice' : 'Turn on overnight practice', toggleAway, ''],
    ...LEVELS.map((l, i) => ['Permissions', 'shield', l[0], () => setLevel(i), '']),
    ...NAV.map(([id, i, l]) => ['Go to', i, l, () => go(id), '']),
    ['Tasks', 'tasks', 'Fix the date parsing bug in invoices', () => go('task'), ''],
    ['Go to', 'scroll', 'History: every decision with its reason', () => { S.sub = 'history'; S.hOpen = null; go('needs'); }, ''],
    ['Go to', 'rule', 'Rules', () => { S.sub = 'rules'; go('needs'); }, ''],
    ...(S.first && S.setup.hidden ? [['Actions', 'flag', 'Show Getting started', () => { S.setup.hidden = false; go('home'); }, '']] : []),
    ...[['normal', 'Normal day'], ['first', 'First day (empty)'], ['problems', 'Problems'], ['away', 'Back after a while'], ['offline', 'Offline']].map(([k, l]) => ['Prototype: show a state', 'sliders', l + (k === DAY ? ' (showing)' : ''), () => { location.search = `?state=${k}&theme=${S.theme}`; }, '']),
    ...(S.first ? [] : D.done).map(x => ['Tasks', 'check', x.t, () => toast(ic('tasks') + 'Completed tasks open from the Tasks page (not designed yet).'), '']),
  ];
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  scrim.innerHTML = `<div class="pal" role="dialog" aria-label="Command menu"><div class="in">${ic('search')}<input placeholder="Type a command or search\u2026" aria-label="Search"><kbd>Esc</kbd></div><div class="list"></div>
    <div class="ft"><span><kbd>\u2191</kbd><kbd>\u2193</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>`;
  document.body.appendChild(scrim);
  const inp = $('input', scrim), list = $('.list', scrim); let sel = 0, shown = items;
  const paint = () => { let g = ''; list.innerHTML = shown.map((x, i) => `${x[0] !== g ? `<h6>${g = x[0]}</h6>` : ''}<div class="it ${i === sel ? 'on' : ''}" data-i="${i}">${ic(x[1])}<span>${esc(x[2])}</span>${x[4] ? `<span class="k"><kbd>${x[4]}</kbd></span>` : ''}</div>`).join('') || '<div class="empty" style="height:120px">Nothing matches.</div>'; const on = $('.it.on', list); if (on) on.scrollIntoView({ block: 'nearest' }); };
  const close = () => scrim.remove();
  const run = i => { const x = shown[i]; close(); if (x) x[3](); };
  inp.addEventListener('input', () => { const q = inp.value.toLowerCase(); shown = items.filter(x => x[2].toLowerCase().includes(q)); sel = 0; paint(); });
  inp.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); paint(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); paint(); e.preventDefault(); } else if (e.key === 'Enter') run(sel); else if (e.key === 'Escape') close(); });
  list.addEventListener('mousemove', e => { const it = e.target.closest('.it'); if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; $$('.it', list).forEach(x => x.classList.toggle('on', +x.dataset.i === sel)); } });
  list.addEventListener('click', e => { const it = e.target.closest('.it'); if (it) run(+it.dataset.i); });
  scrim.addEventListener('mousedown', e => { if (e.target === scrim) close(); });
  paint(); inp.focus();
}


/* ---------- toasts & actions ---------- */
function toast(html, undo, label = 'Undo') {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span style="display:flex;align-items:center;gap:8px">${html}</span>${undo ? `<button data-tundo>${label}</button>` : ''}`;
  $('#toasts').appendChild(t);
  if (undo) $('[data-tundo]', t).onclick = () => { undo(); t.remove(); };
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 4200);
}
function repaintRun() { paintHead(); if (mounted) paintInsp(); paintSide(); paintLives(); paintBrief(); paintBefore(); }
function togglePause() { if (R.done) return; R.paused = !R.paused; if (!R.paused) R.stopped = false; repaintRun(); }
function killAll() {
  S.allPaused = !S.allPaused; paintKill(); repaintRun();
  toast(ic(S.allPaused ? 'stopall' : 'play') + (S.allPaused ? 'All tasks paused.' : 'All tasks resumed.'), S.allPaused ? killAll : null);
}
function setLevel(i, quiet) {
  const prev = S.level; S.level = i; S.perm = i; if (S.pa) Object.assign(S.pa, PRESETS[i]); paintLevel(); if (S.view === 'settings') paintSettings();
  if ($('#ask')) { paintChips(); paintBefore(2); }
  if (!quiet && prev !== i) toast(ic('shield') + `Permissions: ${LEVELS[i][0]}`, () => setLevel(prev, true));
}
function toggleTheme() {
  document.body.classList.add('theming');
  S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; localStorage.setItem('ae-theme', S.theme);
  $('#themeB').innerHTML = ic(S.theme === 'dark' ? 'sun' : 'moon');
  if (S.cfg) { S.cfg['look.theme'] = S.theme; if (S.view === 'settings') paintSettings(); }
  setTimeout(() => document.body.classList.remove('theming'), 300);
}
function paintAway() {
  const b = $('.sw-away'); if (!b) return; b.classList.toggle('on', S.away); b.setAttribute('aria-checked', S.away);
  $('#awayS').textContent = S.away ? '1\u20137 am \u00b7 results need approval' : 'Off';
}
function toggleAway() { S.away = !S.away; paintAway(); toast(ic('away') + (S.away ? 'Overnight practice on, 1\u20137 am. Results need your approval.' : 'Overnight practice off.')); }
function newTask(queue) { if (S.view !== 'home') go('home'); S.queueNext = !!queue; setTimeout(() => { paintChips(); paintBefore(); $('#ask').focus(); }, 60); }

const POPS = {
  folder: () => [FOLDERS.map(f => [f[0], f[1], f[2], '']), S.folder, v => { if (v === 'pick') return toast(ic('folder') + 'The desktop app opens a folder picker here.'); S.folder = v; paintChips(); paintBefore(1); }, 'Folder it may use'],
  perm: () => [LEVELS.map((l, i) => [String(i), l[1], l[2], l[0]]), String(S.perm), v => { S.perm = +v; paintChips(); paintBefore(2); }, 'Permissions for this task'],
  model: () => [D.providers, S.model, v => { S.model = v; paintModelChip(); if ($('#ask')) { paintChips(); paintBefore(3); } toast(ic('bolt') + (v === 'auto' ? 'Model: Auto (a free model per step)' : `Model: ${D.providers.find(p => p[0] === v)[1]}`)); }, 'Model'],
  speed: () => [[['0.5', '0.5\u00d7', ''], ['1', '1\u00d7', ''], ['2', '2\u00d7', ''], ['4', '4\u00d7', '']], String(R.speed), v => { R.speed = +v; paintHead(); }, 'Demo speed'],
};
POPS.model2 = POPS.model;

document.addEventListener('click', e => {
  if (popEl && !e.target.closest('.pop') && !e.target.closest('[data-pop],[data-rv],[data-spick],[data-sperm],[data-saddov],[data-sdir]')) closePop();
  const t = e.target.closest('[data-go],[data-act],[data-yes],[data-no],[data-answer],[data-answer-late],[data-tab],[data-sel],[data-sugg],[data-mode],[data-pop],[data-level],[data-dnav],[data-stat],[data-undo],[data-qtop],[data-qdel],[data-pperm],[data-pskip],[data-xpause],[data-pact],[data-awayto]');
  if (!t) return;
  const d = t.dataset;
  if (d.pop) { const [opts, cur, pick, title] = POPS[d.pop](); return pop(t, title, opts, cur, pick); }
  if (d.go) return go(d.go);
  if (d.yes) return decide(true);
  if (d.no) return decide(false);
  if (d.answer) return giveAnswer(d.answer);
  if (d.answerLate) return toast(ic('up') + 'The desktop app pushes the branch here.');
  if (d.level) return setLevel(+d.level);
  if (d.dnav) { const n = needsList().length; S.dIdx = (S.dIdx + +d.dnav + n) % n; return paintNeeds(); }
  if (d.mode) { S.mode = d.mode; $$('[data-mode]').forEach(b => b.classList.toggle('on', b === t)); const a = $('#ask'); a.placeholder = placeholderFor(); paintChips(); paintBefore(0); return a.focus(); }
  if (d.undo) return undoChange(S.changed.find(x => x.id === d.undo));
  if (d.qtop) { const i = S.queue.findIndex(q => q.id === d.qtop), [q] = S.queue.splice(i, 1); S.queue.unshift(q); paintQueue(); flashQueue(q.id); return toast(ic('up') + 'Moved to the top of the queue.', () => { S.queue.splice(S.queue.indexOf(q), 1); S.queue.splice(i, 0, q); paintQueue(); }); }
  if (d.qdel) { const i = S.queue.findIndex(q => q.id === d.qdel), [q] = S.queue.splice(i, 1); paintQueue(); const e = logH('removed', q.t, { task: 'Queue', log: ['Removed from the queue at position ' + (i + 1), 'It had not started. Nothing was changed.'] }); return whyCard(e, { msg: `<b>Removed</b> ${esc(q.t)}`, undo: () => { S.queue.splice(i, 0, q); paintQueue(); } }); }
  if (d.pperm) { const s = S.plan.steps.find(x => x.id === d.pperm); s.perm = { look: 'ask', ask: 'auto', auto: 'look' }[s.perm]; return paintPlan(); }
  if (d.pskip) { const s = S.plan.steps.find(x => x.id === d.pskip); s.on = !s.on; return paintPlan(); }
  if (d.pact) { const [x, id] = d.pact.split(':'); return problemAct(x, id); }
  if (d.awayto) return awayGo(d.awayto);
  if (d.xpause) { const x = S.extra.find(y => y.id === d.xpause); if (x) { x.paused = !x.paused; paintSide(); paintLives(); } return; }
  if (d.tab) { R.tab = d.tab; R.follow = false; R.sel = null; return paintInsp(); }
  if (d.sugg) { const a = $('#ask'); a.value = d.sugg; a.dispatchEvent(new Event('input')); return a.focus(); }
  if (d.sel) {
    const s = R.steps.find(x => x.id === d.sel); const prev = R.sel;
    R.sel = prev === s.id ? null : s.id; R.follow = !R.sel;
    if (s.pane && R.sel) R.tab = s.pane.tab;
    [prev, R.sel].forEach(id => { const el = id && mounted.get(id); if (el) el.classList.toggle('sel', R.sel === id); });
    return paintInsp();
  }
  const a = d.act;
  if (a === 'palette') palette();
  else if (a === 'new') newTask(true);
  else if (a === 'theme') toggleTheme();
  else if (a === 'away') toggleAway();
  else if (a === 'pause') togglePause();
  else if (a === 'pauseRename') { S.rename.paused = !S.rename.paused; paintSide(); paintLives(); }
  else if (a === 'killall') killAll();
  else if (a === 'stop') stopTask();
  else if (a === 'github') toast(ic('ext') + 'The desktop app opens the branch on GitHub here.');
  else if (a === 'follow') { R.follow = !R.follow; if (R.follow) { const p = R.sel; R.sel = null; const el = p && mounted.get(p); if (el) el.classList.remove('sel'); } paintInsp(); }
  else if (a === 'undostep' || a === 'undoall') toast(ic('undo') + (a === 'undoall' ? '2 changes undone. Files restored to 0:00.' : 'Change undone.'), () => toast(ic('redo') + 'Redone.'));
  else if (a === 'awayClose') { const A = S.awayCard; S.awayCard = null; paintAwayCard(); toast(ic('check') + 'Summary dismissed.', () => { S.awayCard = A; paintAwayCard(); }); }
  else if (a === 'setupHide') { S.setup.hidden = true; paintSetup(); toast(ic('flag') + 'Getting started hidden. Open it again from Ctrl K.'); }
  else if (a === 'toProblems') { if (S.view !== 'home') go('home'); setTimeout(() => awayGo('problems'), 80); }
  else if (a === 'useLocal') { S.local = true; paintNet(); repaintRun(); toast(ic('pc') + 'Using the local model until the internet is back.', () => { S.local = false; paintNet(); repaintRun(); }); }
  else if (a === 'netRetry') toast(ic('wifioff') + 'Still offline. Checking again every 30 s.');
  else if (a === 'undoSince') { const o = undoSinceOptions(); if (o.length) pop(t, 'Undo everything since', o, null, v => confirmUndo(+v)); }
  else if (a === 'attach') toast(ic('clip') + 'The desktop app opens a file picker here.');
  else if (a === 'det') { const el = $('#det'); el.classList.toggle('on'); t.classList.toggle('on'); }
  else if (a === 'closePlan') { S.plan = null; $('#planBox').innerHTML = ''; }
  else if (a === 'addPlanStep') {
    const s = { id: 'p' + Date.now(), t: 'New step', perm: S.perm === 2 ? 'auto' : 'look', on: true }; S.plan.steps.push(s); paintPlan();
    const el = $(`[data-pst="${s.id}"]`); el.focus(); getSelection().selectAllChildren(el);
  }
  else if (a === 'startPlan') {
    const P = S.plan, n = P.steps.filter(s => s.on).length; S.plan = null; paintPlan();
    const ta = $('#ask'); ta.value = ''; ta.dispatchEvent(new Event('input'));
    startExtra(P.text); const x = S.extra.at(-1); x.t = P.text; x.planN = n; paintSide(); paintLives();
  }
});

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (mod && e.shiftKey && k === 'p') { e.preventDefault(); return killAll(); }
  if (mod && k === 'k') { e.preventDefault(); return palette(); }
  if (mod && k === 'n') { e.preventDefault(); return newTask(false); }
  if (e.key === 'Escape') { if (popEl) return closePop(); if (S.plan && !$('.scrim')) { S.plan = null; return paintPlan(); } if (S.queueNext) { S.queueNext = false; paintChips(); paintBefore(); } }
  if (typing() || $('.scrim')) return;
  if (S.view === 'home' && needsList().length) {
    if (k === 'y') decide(true);
    if (k === 'n') decide(false);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = needsList().length; S.dIdx = (S.dIdx + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; paintNeeds(); }
  }
  if (S.view === 'task') {
    if (e.key === ' ') { e.preventDefault(); togglePause(); }
    if (R.ask && k === 'y') giveAnswer('yes');
    if (R.ask && k === 'n') giveAnswer('no');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const sel = R.steps.filter(s => s.kind === 'look' || s.kind === 'change'); if (!sel.length) return;
      let i = sel.findIndex(s => s.id === R.sel); i = e.key === 'ArrowDown' ? Math.min(i + 1, sel.length - 1) : Math.max(i - 1, 0);
      const prev = R.sel; R.sel = sel[i].id; R.follow = false; if (sel[i].pane) R.tab = sel[i].pane.tab;
      [prev, R.sel].forEach(id => { const el = id && mounted.get(id); if (el) el.classList.toggle('sel', R.sel === id); });
      mounted.get(R.sel).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); paintInsp(); e.preventDefault();
    }
  }
});
// Soft light that follows the pointer on cards.
document.addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });
addEventListener('resize', closePop);

// Tasks started from Home run a short sample of five steps.
setInterval(() => {
  if (S.allPaused || R.frozen || blocked()) return;
  let changed = false;
  S.extra.slice().forEach(x => {
    if (x.paused) return; changed = true; bump(1, x.step + ' \u00b7 ' + x.t, x.id);
    x.p = Math.min(1, x.p + 0.025 * R.speed); x.step = XSTEPS[Math.min(4, Math.floor(x.p * 5))];
    if (x.p >= 1) {
      S.extra = S.extra.filter(y => y !== x); S.doneX = (S.doneX || 0) + 1;
      S.changed.unshift({ id: 'c' + x.id, t: x.t, m: 'just now', i: 'pencil', fresh: true }); paintChanged();
      toast(ic('check') + `Completed: ${esc(x.t)}`);
    }
  });
  if (changed) { paintSide(); if (S.view === 'home') paintLives(); }
}, 1000);

/* ---------- boot ---------- */
shell(); go(S.view);
dragList($('#qList'), '.q', 'q', (f, to) => { const a = S.queue, i = a.findIndex(q => q.id === f), j = a.findIndex(q => q.id === to); const [x] = a.splice(i, 1); a.splice(j, 0, x); paintQueue(); flashQueue(x.id); });
if (params.get('speed')) R.speed = +params.get('speed');
if (!S.first) runSim();
if (params.get('palette')) setTimeout(palette, 300);
if (params.get('paused')) setTimeout(killAll, 200);
if (hold) { const h = setInterval(() => { if (evN >= ff) { ff = 0; clearInterval(h); setTimeout(() => { R.frozen = true; }, +hold); } }, 5); }
})();

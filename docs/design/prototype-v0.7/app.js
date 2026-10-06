/* Aetheris prototype v0.7. Vanilla JS, no build step. Simulated run, sample data. */
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
  if (v === 'home') home(); else if (v === 'task') task(); else placeholder(v);
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
      <section><div class="sec-h"><h2>Changes today</h2><span class="c" id="chgC"></span><button class="linkbtn" data-act="undoSince" id="undoSince">${ic('history')}Undo since\u2026</button></div><div class="card chg" id="chg"></div></section>
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
  toast(ic('play') + (S.allPaused ? 'Task added. It starts when you resume.' : 'Task started.'), () => { S.extra = S.extra.filter(y => y !== x); paintSide(); paintLives(); });
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
    paintNeeds(); paintSide(); paintChanged();
    toast(ic(yes ? 'check' : 'clock') + (yes ? x.done : 'Snoozed until tomorrow.'), () => { S.needs.splice(idx, 0, x); if (ch) S.changed = S.changed.filter(c => c !== ch); paintNeeds(); paintSide(); paintChanged(); });
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
  $('#status').innerHTML = R.done ? `<span class="status done">${ic('check')}Completed<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>` : R.ask ? `<span class="status ask"><span class="dot"></span>Waiting for approval<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>` : P ? `<span class="status paused">${ic('pause')}Paused<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>` : `<span class="status"><span class="dot pulse"></span>Running<span>\u00b7</span><span id="clock">${fmt(R.clock)}</span></span>`;
  $('#pauseB').innerHTML = R.paused ? `${ic('play')}Resume` : `${ic('pause')}Pause`;
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
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

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
  if (act === 'undo') { p.undone = true; const c = { id: 'cu' + id, t: 'Edited README.md and docs/usage.md (failed task)', m: '7:10 pm \u00b7 2 files', i: 'pencil', undone: true, at: 1150, time: '7:10 pm' }; S.changed.unshift(c); paintChanged(); paintProblems(); return toast(ic('undo') + 'Changes from the failed task undone.', () => { p.undone = false; S.changed = S.changed.filter(x => x !== c); paintChanged(); paintProblems(); }); }
  if (act === 'retry') { drop(); repaint(); startExtra(p.title); return; }
  if (act === 'wait') { drop(); repaint(); return toast(ic('clock') + 'Checking it again in 10 min.', () => { back(); repaint(); }); }
  if (act === 'stop') { const st = S.stuck; drop(); S.stuck = null; repaint(); return toast(ic('stop') + 'Stopped. Nothing was changed.', () => { back(); S.stuck = st; repaint(); }); }
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
  const yes = () => { close(); list.forEach(c => { c.undone = true; }); S.setup.undo = true; paintChanged(); paintSetup(); toast(ic('undo') + `Undid ${plural(list.length, 'change')}.`, () => { list.forEach(c => { c.undone = false; }); paintChanged(); }); };
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
      <div class="diff">${lines.map(([k, n, c], li) => k === 'h' ? `<div class="l h"><span class="no"></span><span class="sg"></span><span class="cd">${esc(c)}</span></div>` : `<div class="l ${k} ${li === lines.length - 1 && p.shown < d.lines.length ? 'nw' : ''}"><span class="no">${n}</span><span class="sg">${k === 'a' ? '+' : k === 'd' ? '\u2212' : ''}</span><span class="cd">${hl(c)}</span></div>`).join('')}</div>`;
  }
  if (p.tab === 'terminal') {
    const lines = D.term[p.term].slice(0, p.shown);
    return `<div class="term"><div class="blk">${lines.map((l, i) => i === 0 ? `<div class="cmdl">${esc(l)}</div>` : l.startsWith('#f') ? `<div class="sum f">${esc(l.slice(3))}</div>` : l.startsWith('#p') ? `<div class="sum p">${esc(l.slice(3))}</div>` : l.startsWith('E ') ? `<div class="f">${esc(l)}</div>` : /^[.F]+/.test(l) ? `<div>${esc(l).replace(/F/g, '<span class="f">F</span>').replace(/\./g, '<span class="p">.</span>')}</div>` : `<div class="${l.startsWith('_') ? 'dim' : ''}">${esc(l) || '&nbsp;'}</div>`).join('')}</div></div>`;
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
  paintHead(); paintSide(); paintNeeds(); paintLives();
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
function toast(html, undo) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span style="display:flex;align-items:center;gap:8px">${html}</span>${undo ? '<button data-tundo>Undo</button>' : ''}`;
  $('#toasts').appendChild(t);
  if (undo) $('[data-tundo]', t).onclick = () => { undo(); t.remove(); };
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 4200);
}
function repaintRun() { paintHead(); if (mounted) paintInsp(); paintSide(); paintLives(); paintBrief(); paintBefore(); }
function togglePause() { if (R.done) return; R.paused = !R.paused; repaintRun(); }
function killAll() {
  S.allPaused = !S.allPaused; paintKill(); repaintRun();
  toast(ic(S.allPaused ? 'stopall' : 'play') + (S.allPaused ? 'All tasks paused.' : 'All tasks resumed.'), S.allPaused ? killAll : null);
}
function setLevel(i, quiet) {
  const prev = S.level; S.level = i; S.perm = i; paintLevel();
  if ($('#ask')) { paintChips(); paintBefore(2); }
  if (!quiet && prev !== i) toast(ic('shield') + `Permissions: ${LEVELS[i][0]}`, () => setLevel(prev, true));
}
function toggleTheme() {
  document.body.classList.add('theming');
  S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; localStorage.setItem('ae-theme', S.theme);
  $('#themeB').innerHTML = ic(S.theme === 'dark' ? 'sun' : 'moon');
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
  if (popEl && !e.target.closest('.pop') && !e.target.closest('[data-pop]')) closePop();
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
  if (d.undo) { const c = S.changed.find(x => x.id === d.undo); c.undone = !c.undone; if (c.undone) { S.setup.undo = true; paintSetup(); } paintChanged(); return toast(ic(c.undone ? 'undo' : 'redo') + (c.undone ? `Undone: ${c.t}` : `Redone: ${c.t}`)); }
  if (d.qtop) { const i = S.queue.findIndex(q => q.id === d.qtop), [q] = S.queue.splice(i, 1); S.queue.unshift(q); paintQueue(); flashQueue(q.id); return toast(ic('up') + 'Moved to the top of the queue.', () => { S.queue.splice(S.queue.indexOf(q), 1); S.queue.splice(i, 0, q); paintQueue(); }); }
  if (d.qdel) { const i = S.queue.findIndex(q => q.id === d.qdel), [q] = S.queue.splice(i, 1); paintQueue(); return toast(ic('x') + 'Removed from the queue.', () => { S.queue.splice(i, 0, q); paintQueue(); }); }
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
  else if (a === 'stop') toast(ic('stop') + 'The desktop app stops the task here. Its changes stay undoable.');
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

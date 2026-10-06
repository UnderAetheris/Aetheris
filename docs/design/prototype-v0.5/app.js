/* Aetheris prototype v0.5. Vanilla JS, no build step. Simulated run, sample data. */
(() => {
const D = window.DATA, I = window.ICONS;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ic = (n, cls = '') => (I[n] || '').replace('<svg ', `<svg class="${cls}" aria-hidden="true" `);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const params = new URLSearchParams(location.search);

/* ---------- state ---------- */
const S = {
  view: params.get('view') || 'home',
  theme: params.get('theme') || localStorage.getItem('ae-theme') || 'dark',
  needs: D.needs.slice(),
  away: false,
  run: { steps: [], plan: 0, status: 'live', paused: false, speed: 1, clock: 0, sel: null, follow: true, tab: 'changes', ask: null, done: false },
  rename: { file: 3, total: 14 },
};
const R = S.run;
document.documentElement.dataset.theme = S.theme;

/* ---------- logo ---------- */
const MARK = `<svg class="mark" viewBox="0 0 24 24" aria-label="Aetheris"><rect width="24" height="24" rx="7" fill="var(--text)"/><path d="M6.5 16.5 12 12l5.5-4.5" stroke="var(--panel)" stroke-width="1.5" fill="none"/><circle cx="6.5" cy="16.5" r="2.2" fill="var(--text)" stroke="var(--panel)" stroke-width="1.5"/><circle cx="12" cy="12" r="2.2" fill="var(--text)" stroke="var(--panel)" stroke-width="1.5"/><rect x="15.3" y="5.3" width="4.4" height="4.4" rx="1.1" fill="var(--live)"/></svg>`;

/* ---------- shell ---------- */
const NAV = [
  ['home', 'home', 'Home'], ['tasks', 'tasks', 'Tasks'], ['needs', 'inbox', 'Needs you'], ['reports', 'report', 'Reports'],
  ['learned', 'learn', 'What it learned'], ['knows', 'memory', 'What it knows'], ['skills', 'skills', 'Skills'], ['pc', 'pc', 'PC health'], ['settings', 'settings', 'Settings'],
];
function shell() {
  document.body.innerHTML = `
  <div class="app">
    <aside class="side">
      <div class="brand">${MARK}<span>Aetheris</span><span class="ver">v0.5</span></div>
      <button class="search" data-act="palette">${ic('search')}<span>Search or run a command</span><kbd>Ctrl K</kbd></button>
      <button class="newtask" data-act="new"><span class="plus">${ic('plus')}</span>New task<kbd>Ctrl N</kbd></button>
      <nav class="nav">${NAV.map(([id, i, l]) => `<a data-go="${id}" class="${S.view === id ? 'on' : ''}">${ic(i)}${l}${id === 'needs' ? '<span class="n ask" id="needN"></span>' : ''}</a>`).join('')}</nav>
      <h6><span>Running</span><span class="mono" id="runN">2</span></h6>
      <div class="runs" id="sideRuns"></div>
      <div class="grow"></div>
      <div class="away"><span>Learn while I'm away</span><button class="sw sw-away" data-act="away" role="switch" aria-checked="false" aria-label="Learn while I'm away"></button><span class="s" id="awayS">Off</span></div>
      <div class="me"><span class="av">U</span>UnderAetheris<span class="sp" style="flex:1"></span><button class="iconbtn" data-act="theme" aria-label="Switch theme">${ic(S.theme === 'dark' ? 'sun' : 'moon')}</button></div>
    </aside>
    <main class="main"><header class="top" id="top"></header><section class="view" id="view"></section></main>
  </div><div class="toasts" id="toasts"></div>`;
  paintSide();
}
function topbar(crumbs, extra = '') {
  $('#top').innerHTML = `<div class="crumbs">${crumbs}</div><div class="sp"></div>${extra}
    <button class="chip" title="Model in use">${ic('bolt')}<span>Gemini 2.5 Flash</span><span class="meter"><i style="width:72%"></i></span><span class="mono">1,085 left today</span></button>`;
}
function paintSide() {
  const n = S.needs.length + (R.ask ? 1 : 0);
  const el = $('#needN'); if (el) { el.textContent = n || ''; el.style.display = n ? '' : 'none'; }
  const pct = Math.min(1, (R.plan + (R.done ? 1 : .5)) / 6), rp = S.rename.file / S.rename.total;
  const ring = (p, ask) => `<svg class="ring ${ask ? 'ask' : ''}" viewBox="0 0 16 16"><circle class="bg" cx="8" cy="8" r="6"/><circle class="fg" cx="8" cy="8" r="6" stroke-dasharray="37.7" stroke-dashoffset="${37.7 * (1 - p)}" transform="rotate(-90 8 8)"/></svg>`;
  const runs = [];
  runs.push(`<div class="run ${S.view === 'task' ? 'on' : ''}" data-go="task">${R.done ? `<span style="color:var(--good);margin-top:2px">${ic('check')}</span>` : ring(pct, !!R.ask)}<div><div class="t">Fix the date parsing bug in invoices</div><div class="m">${R.done ? 'Done' : R.ask ? 'Waiting for you' : R.paused ? 'Paused' : esc(R.now || 'Starting')}</div></div></div>`);
  runs.push(`<div class="run">${ring(rp)}<div><div class="t">Rename \u201cclient\u201d to \u201ccustomer\u201d</div><div class="m">Editing file ${S.rename.file} of ${S.rename.total}</div></div></div>`);
  $('#sideRuns').innerHTML = runs.join('');
  $('#runN').textContent = R.done ? 1 : 2;
}

/* ---------- router ---------- */
function go(v) {
  S.view = v;
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.go === v));
  const view = $('#view'); view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
  view.scrollTop = 0;
  if (v === 'home') home(); else if (v === 'task') task(); else placeholder(v);
  paintSide();
}

/* ---------- home ---------- */
function greet() { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function home() {
  topbar(`${ic('home')}<b>Home</b>`);
  const d = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#view').innerHTML = `<div class="home">
    <div class="hello"><div class="date">${d}</div><h1>${greet()}.</h1><p id="summary"></p></div>
    <div class="composer"><textarea id="ask" rows="1" placeholder="Give it a task, or ask a question\u2026" aria-label="New task"></textarea>
      <div class="bar"><button class="chip">${ic('folder')}invoice-tool${ic('down')}</button><button class="chip">${ic('shield')}Asks before changing files${ic('down')}</button><button class="iconbtn" aria-label="Attach">${ic('clip')}</button><span class="sp"></span><button class="chip">Auto model${ic('down')}</button><button class="send" id="send" disabled aria-label="Start">${ic('up')}</button></div></div>
    <div class="sugg">${[['terminal', 'Fix the failing tests in invoice-tool'], ['gauge', 'Why is my laptop slow today?'], ['git', 'Summarise today\u2019s commits']].map(([i, t]) => `<button data-sugg="${esc(t)}">${ic(i)}${t}</button>`).join('')}</div>
    <div class="grid">
      <div class="col">
        <section><div class="sec-h"><h2>Needs you</h2><span class="c ask" id="needC"></span><a data-go="needs">All${ic('right')}</a></div><div class="stack" id="needs"></div></section>
        <section><div class="sec-h"><h2>Running</h2><span class="c" id="liveC">2</span><a data-go="tasks">All tasks${ic('right')}</a></div><div class="stack" id="lives"></div></section>
        <section><div class="sec-h"><h2>Done today</h2><span class="c">${D.done.length}</span><a data-go="reports">Today\u2019s report${ic('right')}</a></div>
          <div class="card rows">${D.done.map(x => `<div class="row"><span class="ok">${ic('check')}</span><span>${esc(x.t)}</span><span style="display:flex;gap:10px;align-items:center"><span class="tag ${x.r[1]}">${x.r[0]}</span><span class="meta">${x.m}</span></span></div>`).join('')}</div></section>
      </div>
      <div class="col">
        <section><div class="sec-h"><h2>Getting better</h2><a data-go="learned">What it learned${ic('right')}</a></div>${scoreCard()}</section>
        <section><div class="sec-h"><h2>PC health</h2><a data-go="pc">Details${ic('right')}</a></div>
          <div class="card pc">${D.pc.map(([i, l, v, p]) => `<div class="r">${ic(i)}<span>${l}</span><span class="v">${v}</span>${p != null ? `<div class="bar"><i class="${p > 80 ? 'warn' : ''}" style="width:${p}%"></i></div>` : ''}</div>`).join('')}
          <div class="r sugg-r">${ic('alert')}<span>2 cleanup ideas waiting</span><span class="v" style="color:inherit">1.4 GB</span></div></div></section>
        <section><div class="card awaycard"><div class="h">${ic('away')}Learn while I\u2019m away<button class="sw sw-away" data-act="away" role="switch" aria-label="Learn while I'm away"></button></div>
          <p id="awayP"></p><button class="btn sec" data-go="settings">Choose what it may do</button></div></section>
      </div>
    </div></div>`;
  const ta = $('#ask');
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; $('#send').disabled = !ta.value.trim(); });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && ta.value.trim()) { e.preventDefault(); toast(ic('check') + 'Task added. In the full app it would start here.'); ta.value = ''; ta.dispatchEvent(new Event('input')); } });
  paintNeeds(); paintLives(); paintAway();
}
function summary() {
  const n = S.needs.length + (R.ask ? 1 : 0);
  const parts = [];
  parts.push(n ? `<span class="dot ask"></span><b>${n} ${n === 1 ? 'thing needs' : 'things need'} you</b>` : `<span class="dot good"></span><b>Nothing needs you</b>`);
  parts.push(`<span class="dot live pulse" style="margin-left:14px"></span><b>${R.done ? 1 : 2} running</b>`);
  parts.push(`<span style="margin-left:14px">${D.done.length + (R.done ? 1 : 0)} done today. Practice score up 2 this week.</span>`);
  return parts.join('');
}
function paintNeeds() {
  const box = $('#needs'); if (!box) return;
  const list = (R.ask ? [{ id: 'push', title: 'Push the date fix to GitHub', src: 'Fix the date parsing bug \u00b7 just now', cmd: 'git push origin fix/date-parsing', facts: [['branch', 'Creates a branch. Nothing is merged into main.'], ['refresh', 'Can be undone: delete the branch']], yes: 'Push', live: true }] : []).concat(S.needs);
  box.innerHTML = list.length ? list.map(x => `<div class="card need" data-need="${x.id}"><div class="h"><div><div class="tt">${esc(x.title)}</div><div class="src">${x.src}</div></div>
    <div class="acts"><button class="btn ghost" data-no="${x.id}">Not now</button><button class="btn pri" data-yes="${x.id}">${x.yes}</button></div></div>
    <div class="cmd mono">${esc(x.cmd)}</div><div class="facts">${x.facts.map(([i, t]) => `<span>${ic(i)}${t}</span>`).join('')}</div></div>`).join('')
    : `<div class="card" style="padding:18px 16px;color:var(--text-3);font-size:13.5px;display:flex;gap:10px;align-items:center">${ic('check')}You\u2019re all caught up. New questions show up here first.</div>`;
  $('#needC').textContent = list.length || '';
  $('#summary').innerHTML = summary();
}
function paintLives() {
  const box = $('#lives'); if (!box) return;
  const steps = D.plan.map((_, i) => i < R.plan || R.done ? 'done' : i === R.plan ? (R.ask ? 'ask' : 'act') : 'wait');
  const strip = steps.map((s, i) => `${i ? `<i class="${s === 'wait' ? '' : s === 'act' || s === 'ask' ? 'act' : 'done'}"></i>` : ''}<span class="node ${s} ${i === 2 || i === 3 || i === 5 ? 'sq' : 'look'}"></span>`).join('');
  const rs = Array.from({ length: 5 }, (_, i) => i < 2 ? 'done' : i === 2 ? 'act' : 'wait');
  const rstrip = rs.map((s, i) => `${i ? `<i class="${s === 'wait' ? '' : s === 'act' ? 'act' : 'done'}"></i>` : ''}<span class="node ${s} ${i > 1 ? 'sq' : 'look'}"></span>`).join('');
  const now = R.done ? 'Finished. 2 files changed, all 40 tests pass.' : R.ask ? '<span style="color:var(--ask)">Waiting for you: can it push the fix to GitHub?</span>' : R.paused ? 'Paused' : `<span class="caret">${esc(R.now || 'Starting')}</span>`;
  box.innerHTML = `
    <div class="card live-card" data-go="task"><div class="h"><span class="tt">Fix the date parsing bug in invoices</span><span class="el mono">${R.done ? 'done' : `step ${Math.min(R.plan + 1, 6)} of 6 \u00b7 ${fmt(R.clock)}`}</span></div><div class="strip">${strip}</div><div class="now">${now}</div></div>
    <div class="card live-card"><div class="h"><span class="tt">Rename \u201cclient\u201d to \u201ccustomer\u201d everywhere</span><span class="el mono">step 3 of 5 \u00b7 6:12</span></div><div class="strip">${rstrip}</div><div class="now"><span class="caret">Editing file ${S.rename.file} of ${S.rename.total}: templates/invoice.html</span></div></div>`;
  $('#liveC').textContent = R.done ? 1 : 2;
  const s = $('#summary'); if (s) s.innerHTML = summary();
}
function paintAway() {
  $$('.sw-away').forEach(b => { b.classList.toggle('on', S.away); b.setAttribute('aria-checked', S.away); });
  const p = $('#awayP'); if (p) p.textContent = S.away ? 'On from 1 am to 7 am. It practises on its own tasks and reads the sites you allowed. It can only suggest changes; you decide in the morning.' : 'Off. When on, it practises and researches while you\u2019re away, then shows you what it found. It never changes anything on its own.';
  const s = $('#awayS'); if (s) s.textContent = S.away ? 'On \u00b7 1 am to 7 am' : 'Off';
}
function scoreCard() {
  const { vals, weeks, kept } = D.score, W = 300, H = 70, min = 24, max = 32;
  const pts = vals.map((v, i) => [i * (W / (vals.length - 1)), H - ((v - min) / (max - min)) * H]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<div class="card score"><div class="lbl">Practice tasks solved, out of 50</div>
    <div class="big"><b>${vals.at(-1)}</b><span>/ 50</span><span class="delta">+${vals.at(-1) - vals[0]} in 4 weeks</span></div>
    <div class="chart"><svg viewBox="0 -6 ${W} ${H + 22}" preserveAspectRatio="none"><defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--text)" stop-opacity=".12"/><stop offset="1" stop-color="var(--text)" stop-opacity="0"/></linearGradient></defs>
      <path class="ar" d="${line} L${W} ${H} L0 ${H} Z"/><path class="ln" d="${line}" vector-effect="non-scaling-stroke"/>
      ${kept.map(k => `<circle class="kp" cx="${pts[k][0]}" cy="${pts[k][1]}" r="3.5" vector-effect="non-scaling-stroke"/>`).join('')}
      ${weeks.map((w, i) => `<text class="ax" x="${pts[i][0]}" y="${H + 16}" text-anchor="${i === 0 ? 'start' : i === weeks.length - 1 ? 'end' : 'middle'}">${w}</text>`).join('')}</svg></div>
    <div class="tried">${D.tried.map(([t, r]) => `<div><span>${t}</span><span class="tag ${r === 'kept' ? 'good' : r === 'broke 1' ? 'bad' : ''}">${r}</span></div>`).join('')}</div></div>`;
}

/* ---------- task view ---------- */
let mounted = null; // Map of step id -> element while task view is mounted
function task() {
  topbar(`${ic('tasks')}<span>Tasks</span>${ic('right')}<b>Fix the date parsing bug in invoices</b>`, `<div class="ctl"><div class="seg" id="speed">${[1, 3, 10].map(s => `<button data-speed="${s}" class="${R.speed === s ? 'on' : ''}">${s}\u00d7</button>`).join('')}</div>
        <button class="btn sec" data-act="pause" id="pauseB"></button><button class="btn ghost" data-act="stop" aria-label="Stop">${ic('stop')}Stop</button><span style="width:1px;height:20px;background:var(--line-2);margin:0 4px"></span></div>`);
  $('#view').innerHTML = `<div class="task">
    <div class="thread-wrap">
      <div class="thead"><h1>Fix the date parsing bug in invoices</h1>
        <div class="meta"><span class="chip">${ic('folder')}invoice-tool</span><span class="chip">${ic('branch')}<span class="mono">fix/date-parsing</span></span><span class="chip">${ic('clock')}<span class="mono" id="clock">0:00</span></span><span id="status" style="margin-left:6px"></span></div>
        <div class="plan" id="plan"></div></div>
      <div class="thread" id="thread"></div>
      <div class="steer"><div class="in"><input id="steer" placeholder="Tell it something while it works\u2026" aria-label="Add an instruction"><button class="send" id="steerSend" aria-label="Send" disabled>${ic('up')}</button></div>
        <div class="hint"><span><kbd>Space</kbd> pause</span><span><kbd>Y</kbd> <kbd>N</kbd> answer</span><span><kbd>\u2191</kbd> <kbd>\u2193</kbd> move between steps</span></div></div>
    </div>
    <aside class="insp"><div class="tabs" id="tabs"></div><div class="pane" id="pane"></div></aside></div>`;
  mounted = new Map();
  R.steps.forEach(s => mountStep(s, false));
  paintHead(); paintInsp();
  const si = $('#steer');
  si.addEventListener('input', () => { $('#steerSend').disabled = !si.value.trim(); });
  si.addEventListener('keydown', e => { if (e.key === 'Enter' && si.value.trim()) { addStep({ kind: 'note', title: si.value.trim() }); si.value = ''; $('#steerSend').disabled = true; toast(ic('check') + 'Added. It will use this from the next step.'); } });
  scrollEnd(true);
}
function paintHead() {
  if (!mounted) return;
  const st = $('#status'); if (!st) return;
  st.innerHTML = R.done ? `<span class="status done">${ic('check')}Done</span>` : R.ask ? `<span class="status ask"><span class="dot"></span>Waiting for you</span>` : R.paused ? `<span class="status paused">${ic('pause')}Paused</span>` : `<span class="status"><span class="dot pulse"></span>Working</span>`;
  $('#pauseB').innerHTML = R.paused ? `${ic('play')}Resume` : `${ic('pause')}Pause`;
  $('#pauseB').disabled = R.done; $('.top .ctl').style.display = R.done ? 'none' : '';
  const si = $('#steer'); if (si) si.placeholder = R.done ? 'Ask a follow-up, or give it the next step…' : 'Tell it something while it works…';
  $('#plan').innerHTML = D.plan.map((p, i) => `<div class="p ${i < R.plan || R.done ? 'done' : i === R.plan ? (R.ask ? 'ask' : 'act') : ''}" title="${p}"><span class="i">${i + 1}</span>${p}</div>`).join('');
  $('#clock').textContent = fmt(R.clock);
  $$('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.speed === R.speed));
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
    <div class="askbox ${s.answer ? 'answered' : ''}"><div class="q">Can I push this fix to GitHub?</div>
      <div class="cmd"><span class="pr">$</span>git push origin fix/date-parsing</div>
      <dl><dt>What happens</dt><dd>Creates the branch <span class="mono">fix/date-parsing</span> on GitHub. Nothing is merged into main.</dd><dt>Undo</dt><dd>Delete the branch. One click from History.</dd><dt>Why it asks</dt><dd>Pushing is set to \u201cAsk me\u201d for this project.</dd></dl>
      ${s.answer ? `<div class="acts"><span class="tag ${s.answer === 'yes' ? 'good' : ''}">${s.answer === 'yes' ? 'You said push' : 'You said not now'}</span></div>` : `<div class="acts"><button class="btn ask" data-answer="yes">Push <kbd>Y</kbd></button><button class="btn sec" data-answer="no">Not now <kbd>N</kbd></button><span class="sp"></span><button class="btn ghost" data-answer="always">Always allow in this project</button></div>`}
    </div></div>`;
  if (s.kind === 'done') return `<div class="tm">${t}</div><div class="rail"><span class="node done" style="background:var(--good);border-color:var(--good)"></span></div><div class="body" style="cursor:default;background:none;box-shadow:none"><div class="donebox"><div class="q">${ic('check')}${s.title}</div><p>${s.sub}</p><div class="learnt"><span>${ic('memory')}Saved to memory: dates in invoice-tool are day-first.</span><span>${ic('skills')}Used the skill “Fix a failing test” (v3). It has now worked 21 of 24 times.</span></div>
    <div class="acts">${s.pushed ? `<button class="btn sec">${ic('ext')}Open on GitHub</button>` : `<button class="btn sec" data-answer-late="1">${ic('up')}Push it now</button>`}<button class="btn ghost" data-act="undoall">${ic('undo')}Undo all changes</button></div></div></div>`;
  const run = s.state === 'run';
  return `<div class="tm">${t}</div><div class="rail">${nodeFor(s)}</div><div class="body" data-sel="${s.id}">
    <div class="ln1"><span class="tt ${run ? 'shimmer' : ''}">${esc(run ? s.doing : s.title)}</span><span class="tool">${s.tool}</span></div>
    ${!run && s.sub ? `<div class="sub">${s.sub}</div>` : ''}
    ${!run && s.why ? `<div class="why"><span class="tag live">${ic('memory')}From memory</span><span>${s.why}</span></div>` : ''}
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
function addStep(s) { s.id = 's' + R.steps.length; s.t = R.clock; R.steps.push(s); mountStep(s); scrollEnd(); return s; }

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
    `<span class="sp"></span><label class="follow">Follow<button class="sw ${R.follow ? 'on' : ''}" data-act="follow" role="switch" aria-checked="${R.follow}" aria-label="Follow along"></button></label>`;
  const s = paneStep(), pane = $('#pane');
  if (!s || !s.pane || s.pane.tab !== R.tab) { pane.innerHTML = emptyPane(R.tab); return; }
  pane.innerHTML = renderPane(s.pane);
  if (s.pane.tab === 'terminal' || s.pane.tab === 'changes') pane.scrollTop = pane.scrollHeight;
}
function emptyPane(tab) {
  const m = { changes: [ic('diff'), 'No changes yet. Edits show up here line by line as it makes them.'], terminal: [ic('terminal'), 'Commands and test output show up here as they run.'], browser: [ic('globe'), 'When it reads a web page, you see the page and the part it is reading.'], files: [ic('files'), 'Files it opens or changes are listed here.'] }[tab];
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
      ${p.at >= 3 ? `<div class="readnote"><b>What it took from this page:</b> %d is the day and %m is the month. The code uses %m first, so 05/10 is read as 10 May.</div>` : ''}`;
  }
  if (p.tab === 'files') {
    const list = D.files.read.slice(0, p.shown);
    return `<div class="files"><h5>Read \u00b7 nothing changed</h5>${list.map(([f, m]) => `<div class="f">${ic('eye')}<span class="mono">${f}</span><span class="mono faint">${m}</span></div>`).join('')}
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
    if (!R.paused && !R.frozen) { left -= tick * R.speed; R.clock += tick * R.speed / 1000; }
  }
}
function setNow(t) { R.now = t; paintSide(); paintLives(); }
async function think(text) {
  evN++;
  const s = addStep({ kind: 'think', text, shown: '' });
  setNow('Thinking');
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
async function stream(s, n, ms) { for (let i = 1; i <= n; i++) { s.pane.shown = i; if (s.pane.tab === 'browser') s.pane.at = i; paintInsp(); await wait(ms); } }
function plan(i) { R.plan = i; paintHead(); paintSide(); paintLives(); }

let answer = null;
function askUser() { return new Promise(r => { answer = r; }); }
function giveAnswer(a) {
  if (!R.ask || !answer) return;
  const s = R.ask; s.answer = a === 'no' ? 'no' : 'yes'; repaintStep(s);
  R.ask = null; const r = answer; answer = null; r(a);
  paintHead(); paintSide(); paintNeeds(); paintLives();
  if (a === 'always') toast(ic('check') + 'Pushing to GitHub is now \u201cOn its own\u201d for invoice-tool. Change it in Settings.');
}

async function runSim() {
  await wait(300);
  plan(0);
  await think('The report says 05/10/2026 was saved as 10 May instead of 5 October. I\u2019ll start with how dates are read.');
  await step({ kind: 'look', doing: 'Reading the bug report and dates.py', title: 'Read the bug report and 3 files', tool: 'read_file \u00d73', sub: 'Nothing changed.', pane: { tab: 'files', shown: 0 } }, s => stream(s, 3, 380));
  plan(1);
  await step({ kind: 'look', doing: 'Searching the project for date formats', title: 'Searched the project for date formats', tool: 'search_content', sub: '<span class="mono">strptime</span> is used in 7 places, all through <span class="mono">parse_date()</span>.' }, () => wait(900));
  await step({ kind: 'look', doing: 'Reading Python\u2019s date format codes', title: 'Checked Python\u2019s date format codes', tool: 'web.read', sub: 'docs.python.org: <span class="mono">%d</span> is the day, <span class="mono">%m</span> is the month.', pane: { tab: 'browser', shown: 0, at: 0 } }, s => stream(s, 3, 900));
  await think('parse_date always uses %m/%d/%Y, so the first number becomes the month. You write the day first. I\u2019ll prove it with a test before changing anything.');
  plan(2);
  await step({ kind: 'change', doing: 'Writing a test for day-first dates', title: 'Added a test for day-first dates', tool: 'edit_file', sub: '<span class="mono">tests/test_dates.py</span>', stats: '<span class="tag good">+5</span>', pane: { tab: 'changes', diff: 'test', shown: 0 } }, s => stream(s, D.diffs.test.lines.length, 260));
  await step({ kind: 'look', doing: 'Running the new test', title: 'Ran the new test. It fails, as expected.', tool: 'run_tests', sub: '1 failed, 2 passed. The bug is real.', pane: { tab: 'terminal', term: 'one', shown: 0 } }, s => stream(s, D.term.one.length, 230));
  plan(3);
  await step({ kind: 'change', doing: 'Changing parse_date to read the day first', title: 'Made parse_date read the day first', tool: 'edit_file', sub: '<span class="mono">src/invoice/dates.py</span>. ISO dates like 2026-10-05 still work.', why: 'On 29 Sep you said 05/10 means 5 October.', stats: '<span class="tag good">+8</span><span class="tag bad">\u22123</span>', pane: { tab: 'changes', diff: 'fix', shown: 0 } }, s => stream(s, D.diffs.fix.lines.length, 220));
  plan(4);
  await step({ kind: 'look', doing: 'Running all 40 tests', title: 'Ran all tests. All 40 pass.', tool: 'run_tests', sub: 'Took 3.8 s. Nothing that worked before broke.', pane: { tab: 'terminal', term: 'all', shown: 0 } }, s => stream(s, D.term.all.length, 500));
  plan(5);
  evN++;
  R.ask = addStep({ kind: 'ask' });
  setNow('Waiting for you'); paintHead(); paintNeeds();
  const a = await askUser();
  await wait(400);
  if (a !== 'no') {
    await step({ kind: 'change', doing: 'Pushing to GitHub', title: 'Pushed fix/date-parsing to GitHub', tool: 'git_push', sub: 'Branch created. Open a pull request when you\u2019re ready.' }, () => wait(1200));
  }
  R.done = true; plan(6);
  addStep({ kind: 'done', title: `Fixed in ${dur(R.clock)}`, sub: `2 files changed, all 40 tests pass. ${a !== 'no' ? 'The fix is on GitHub as fix/date-parsing.' : 'The fix is on your computer only; nothing was pushed.'}`, pushed: a !== 'no' });
  setNow('Done'); paintHead(); paintNeeds(); paintLives();
}
function dur(sec) { sec = Math.floor(sec); return sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)} min ${sec % 60} s`; }
function fmt(sec) { sec = Math.floor(sec); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
setInterval(() => { if (!R.done && mounted && $('#clock')) $('#clock').textContent = fmt(R.clock); const el = $('#lives .el'); if (el && !R.done) el.textContent = `step ${Math.min(R.plan + 1, 6)} of 6 \u00b7 ${fmt(R.clock)}`; }, 500);
setInterval(() => { S.rename.file = S.rename.file >= S.rename.total ? 3 : S.rename.file + 1; paintSide(); if (S.view === 'home') paintLives(); }, 4200);

/* ---------- placeholder pages ---------- */
const PAGES = {
  tasks: ['tasks', 'Tasks', 'Everything it is doing, has done and is waiting to do.', ['Running, waiting and finished tasks in one list you can filter', 'Long goals split into tasks, with progress', 'Drag to change what it works on first']],
  needs: ['inbox', 'Needs you', 'Every question it has for you, in one place.', ['What it wants to do, the exact command, and how to undo it', 'Answer with Y and N, one after another', 'Rules like \u201calways allow pushing in this project\u201d']],
  reports: ['report', 'Reports', 'What happened today and this week, in plain words.', ['What it did, what it changed, what went wrong', 'Time it saved you, with how that was counted', 'Everything links back to the task that did it']],
  learned: ['learn', 'What it learned', 'Proof that it is getting better.', ['Practice score over time, from the same set of tasks', 'Every change it tried on itself, kept or dropped, and why', 'Skills it built, with how often they work']],
  knows: ['memory', 'What it knows', 'Everything it remembers about you and your projects.', ['Each memory shows where it came from', 'Edit or delete anything; it forgets right away', 'Rules it must always follow, like \u201cnever open D:\\\\Finance\u201d']],
  skills: ['skills', 'Skills', 'Things it has learned to do well.', ['Each skill: what it does, how often it works, its versions', 'Turn a skill off or roll it back to an older version', 'See which tasks used it']],
  pc: ['pc', 'PC health', 'Your laptop, checked without changing anything.', ['Disk, memory, startup apps, Windows Security status', 'Cleanup ideas that always ask first', 'History of what it cleaned and how to bring it back']],
  settings: ['settings', 'Settings', 'What it may do on its own, and what it must ask about.', ['For each kind of action: On its own, Ask me, or Never', 'Free models and how many requests each one has left', 'Folders it may use, learning while away, light and dark']],
};
function placeholder(v) {
  const p = PAGES[v]; topbar(`${ic(p[0])}<b>${p[1]}</b>`);
  $('#view').innerHTML = `<div class="todo-page"><div class="ic">${ic(p[0])}</div><h1>${p[1]}</h1><p>${p[2]}</p><ul>${p[3].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <p style="margin-top:28px" class="faint">This page is next in the design queue. Home and the task view are designed first because every other page reuses their parts.</p>
    <div style="margin-top:16px;display:flex;gap:8px"><button class="btn sec" data-go="home">${ic('home')}Back to Home</button><button class="btn ghost" data-go="task">See a task running</button></div></div>`;
}

/* ---------- command palette ---------- */
function palette() {
  if ($('.scrim')) return;
  const items = [
    ['Actions', 'plus', 'New task', () => { go('home'); setTimeout(() => $('#ask').focus(), 50); }, 'Ctrl N'],
    ['Actions', R.paused ? 'play' : 'pause', R.paused ? 'Resume the date fix' : 'Pause the date fix', togglePause, 'Space'],
    ['Actions', S.theme === 'dark' ? 'sun' : 'moon', S.theme === 'dark' ? 'Switch to light' : 'Switch to dark', toggleTheme, ''],
    ['Actions', 'away', S.away ? 'Turn off learning while away' : 'Turn on learning while away', toggleAway, ''],
    ...NAV.map(([id, i, l]) => ['Go to', i, l, () => go(id), '']),
    ['Tasks', 'tasks', 'Fix the date parsing bug in invoices', () => go('task'), ''],
    ...D.done.map(x => ['Tasks', 'check', x.t, () => toast('Finished tasks open in the full app.'), '']),
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
  t.innerHTML = `<span style="display:flex;align-items:center;gap:8px">${html}</span>${undo ? '<button data-undo>Undo</button>' : ''}`;
  $('#toasts').appendChild(t);
  if (undo) $('[data-undo]', t).onclick = () => { undo(); t.remove(); };
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 4200);
}
function resolveNeed(id, yes) {
  if (id === 'push') return giveAnswer(yes ? 'yes' : 'no');
  const card = $(`[data-need="${id}"]`), item = S.needs.find(n => n.id === id), idx = S.needs.indexOf(item);
  const finish = () => { S.needs = S.needs.filter(n => n.id !== id); paintNeeds(); paintSide(); };
  if (card) { card.classList.add('gone'); setTimeout(finish, 380); } else finish();
  toast(ic(yes ? 'check' : 'clock') + (yes ? item.done : 'Okay, it will ask again tomorrow.'), () => { S.needs.splice(idx, 0, item); paintNeeds(); paintSide(); });
}
function togglePause() { if (R.done) return; R.paused = !R.paused; paintHead(); paintInsp(); paintSide(); paintLives(); }
function toggleTheme() {
  document.body.classList.add('theming');
  S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; localStorage.setItem('ae-theme', S.theme);
  $('[data-act="theme"]').innerHTML = ic(S.theme === 'dark' ? 'sun' : 'moon');
  setTimeout(() => document.body.classList.remove('theming'), 260);
}
function toggleAway() { S.away = !S.away; paintAway(); toast(ic('away') + (S.away ? 'Learning while away is on, 1 am to 7 am. It will only suggest changes.' : 'Learning while away is off.')); }

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-act],[data-yes],[data-no],[data-answer],[data-answer-late],[data-tab],[data-speed],[data-sel],[data-sugg]');
  if (!t) return;
  if (t.dataset.go) return go(t.dataset.go);
  if (t.dataset.yes) return resolveNeed(t.dataset.yes, true);
  if (t.dataset.no) return resolveNeed(t.dataset.no, false);
  if (t.dataset.answer) return giveAnswer(t.dataset.answer);
  if (t.dataset.answerLate) return toast(ic('up') + 'In the full app this pushes the branch now.');
  if (t.dataset.tab) { R.tab = t.dataset.tab; R.follow = false; R.sel = null; return paintInsp(); }
  if (t.dataset.speed) { R.speed = +t.dataset.speed; return paintHead(); }
  if (t.dataset.sugg) { const a = $('#ask'); a.value = t.dataset.sugg; a.dispatchEvent(new Event('input')); return a.focus(); }
  if (t.dataset.sel) {
    const s = R.steps.find(x => x.id === t.dataset.sel); const prev = R.sel;
    R.sel = prev === s.id ? null : s.id; R.follow = !R.sel;
    if (s.pane && R.sel) R.tab = s.pane.tab;
    [prev, R.sel].forEach(id => { const el = id && mounted.get(id); if (el) el.classList.toggle('sel', R.sel === id); });
    return paintInsp();
  }
  const a = t.dataset.act;
  if (a === 'palette') palette();
  else if (a === 'new') { go('home'); setTimeout(() => $('#ask').focus(), 50); }
  else if (a === 'theme') toggleTheme();
  else if (a === 'away') toggleAway();
  else if (a === 'pause') togglePause();
  else if (a === 'stop') toast(ic('stop') + 'In the full app, Stop ends the task and keeps every change undoable.');
  else if (a === 'follow') { R.follow = !R.follow; if (R.follow) { const p = R.sel; R.sel = null; const el = p && mounted.get(p); if (el) el.classList.remove('sel'); } paintInsp(); }
  else if (a === 'undostep' || a === 'undoall') toast(ic('undo') + (a === 'undoall' ? 'Undid 2 changes. Your files are back to how they were at 0:00.' : 'Undid this change.'), () => toast('Redone.'));
});
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return palette(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); go('home'); return setTimeout(() => $('#ask').focus(), 50); }
  if (typing || $('.scrim')) return;
  if (S.view === 'task') {
    if (e.key === ' ') { e.preventDefault(); togglePause(); }
    if (R.ask && (e.key === 'y' || e.key === 'Y')) giveAnswer('yes');
    if (R.ask && (e.key === 'n' || e.key === 'N')) giveAnswer('no');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const sel = R.steps.filter(s => s.kind === 'look' || s.kind === 'change'); if (!sel.length) return;
      let i = sel.findIndex(s => s.id === R.sel); i = e.key === 'ArrowDown' ? Math.min(i + 1, sel.length - 1) : Math.max(i - 1, 0);
      const prev = R.sel; R.sel = sel[i].id; R.follow = false; if (sel[i].pane) R.tab = sel[i].pane.tab;
      [prev, R.sel].forEach(id => { const el = id && mounted.get(id); if (el) el.classList.toggle('sel', R.sel === id); });
      mounted.get(R.sel).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); paintInsp(); e.preventDefault();
    }
  }
});

/* ---------- boot ---------- */
shell(); go(S.view);
if (params.get('speed')) R.speed = +params.get('speed');
runSim();
if (params.get('palette')) setTimeout(palette, 300);
if (hold) { const h = setInterval(() => { if (evN >= ff) { ff = 0; clearInterval(h); setTimeout(() => { R.frozen = true; }, +hold); } }, 5); }
})();

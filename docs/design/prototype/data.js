/* Sample data for the Aetheris v0.4 prototype. Not real results. */
window.DATA = {
  tasks: [
    { id: 'date', title: 'Fix the date parsing bug in invoices', group: 'live' },
    { id: 'rename', title: 'Rename "client" to "customer" everywhere', group: 'running', meta: 'Step 6 · editing 14 files' },
    { id: 'csv', title: 'Add a CSV export to the reports page', group: 'done', meta: '9:58 · 3 files changed' },
    { id: 'slow', title: 'Why is startup slow?', group: 'done', meta: '9:31 · answer, no changes' },
    { id: 'logs', title: 'Clean up old log files in Downloads', group: 'done', meta: '9:12 · 1.4 GB freed · undone' },
    { id: 'commits', title: "Summarise yesterday's commits", group: 'done', meta: '8:50 · answer, no changes' },
  ],
  approvals: [
    { id: 'clean', title: 'Delete 212 old log files in Downloads', cmd: 'D:\\Users\\you\\Downloads\\*.log  (older than 30 days, 1.4 GB)', why: 'Found while checking disk space. They go to the Recycle Bin first, so you can restore them for 30 days.', undo: 'Can be undone', from: 'PC health · 8:40', yes: 'Delete' },
    { id: 'pkg', title: 'Install the "python-dateutil" package in invoice-tool', cmd: 'pip install python-dateutil==2.9.0', why: 'Suggested for the date fix, but not needed. The fix already works without it. Say no unless you want it.', undo: 'Can be undone (pip uninstall)', from: 'Fix the date parsing bug · 10:42', yes: 'Install' },
  ],
  memory: [
    { fact: 'You prefer day-first dates (05/10 means 5 October).', src: 'You corrected it · Sep 29', kind: 'Preference' },
    { fact: 'Your code projects are in D:\\projects.', src: 'Seen in your folders · Sep 20', kind: 'Your computer' },
    { fact: 'Never open or change anything in D:\\Finance.', src: 'You told it · Sep 18', kind: 'Rule' },
    { fact: 'Keep answers short unless you ask for detail.', src: 'You told it · Sep 18', kind: 'Preference' },
    { fact: 'invoice-tool uses pytest and runs on Python 3.11.', src: 'Learned from the project · Oct 1', kind: 'Project' },
    { fact: 'You push to GitHub as UnderAetheris; branches start with fix/ or feat/.', src: 'Learned from git history · Oct 2', kind: 'Project' },
    { fact: 'You usually work 7 pm to 1 am on weekdays.', src: 'Guessed from activity · Oct 3', kind: 'Habit' },
  ],
  learned: [
    ['Oct 4', 'Run only the failing tests first, then all of them', 'Same tasks: 31 solved (was 29). Nothing that worked before broke.', 'kept'],
    ['Oct 3', 'Read the test file before editing the code', '29 solved either way. No better, so not kept.', 'no'],
    ['Oct 2', 'Use Groq instead of Gemini for short summaries', 'Same quality, answers in 0.6 s instead of 1.8 s.', 'kept'],
    ['Oct 1', 'Retry a failed edit up to 3 times', '30 solved, but broke one that used to pass (csv_quote_escape).', 'no'],
    ['Sep 29', 'You prefer day-first dates (05/10 = 5 October)', 'From your correction in "Fix the date parsing bug".', 'mem'],
  ],
  skills: [
    ['Fix a failing test', 23, '20 of 23', 'Sep 12'],
    ['Rename something across a project', 9, '9 of 9', 'Sep 15'],
    ['Explain why something is slow', 6, '5 of 6', 'Sep 22'],
    ['Free up disk space', 4, '4 of 4', 'Sep 25'],
  ],
  score: { weeks: ['Aug 24', 'Aug 31', 'Sep 7', 'Sep 14', 'Sep 21', 'Sep 28', 'Oct 5'], vals: [22, 23, 23, 26, 27, 29, 31], kept: [3, 5, 6] },
};

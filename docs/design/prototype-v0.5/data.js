/* Sample data for the v0.5 prototype. Made up for design review, not real results. */
window.DATA = {
  plan: ['Read the bug', 'Find the cause', 'Write a test', 'Fix the code', 'Run all tests', 'Push to GitHub'],
  needs: [
    { id: 'logs', title: 'Delete 212 old log files in Downloads', src: 'PC health · 6:40 pm', cmd: 'D:\\Users\\you\\Downloads\\*.log   older than 30 days · 1.4 GB', facts: [['refresh', 'Goes to the Recycle Bin, restorable for 30 days'], ['eye', 'Nothing else in Downloads is touched']], yes: 'Delete', done: 'Moved 212 files to the Recycle Bin' },
    { id: 'startup', title: 'Stop 3 apps from opening when Windows starts', src: 'PC health · 6:41 pm', cmd: 'Spotify · Steam · Epic Games Launcher', facts: [['clock', 'Startup takes about 41 s now'], ['refresh', 'Can be turned back on in one click']], yes: 'Stop them', done: 'Stopped 3 startup apps' },
  ],
  done: [
    { t: 'Add a CSV export to the reports page', m: '5:58 pm', r: ['3 files changed', ''] },
    { t: 'Why is my laptop slow after lunch?', m: '2:31 pm', r: ['answer', ''] },
    { t: 'Summarise yesterday\u2019s commits', m: '11:50 am', r: ['answer', ''] },
    { t: 'Clean up old screenshots on the Desktop', m: '10:12 am', r: ['undone by you', 'bad'] },
  ],
  score: { weeks: ['Sep 8', 'Sep 15', 'Sep 22', 'Sep 29', 'Oct 6'], vals: [26, 27, 27, 29, 31], kept: [1, 3, 4] },
  tried: [
    ['Run the failing tests first, then all of them', 'kept'],
    ['Read the test file before editing code', 'no gain'],
    ['Retry a failed edit up to 3 times', 'broke 1'],
  ],
  pc: [
    ['disk', 'Disk C:', '41 GB free of 237', 83, ''],
    ['mem', 'Memory', '5.1 of 8 GB in use', 64, ''],
    ['shield', 'Windows Security', 'On · scanned today', null, ''],
  ],
  files: {
    read: [['src/invoice/dates.py', '61 lines'], ['src/invoice/parse.py', '118 lines'], ['tests/test_dates.py', '35 lines']],
  },
  diffs: {
    test: { file: 'tests/test_dates.py', add: 5, del: 0, lines: [
      ['h', '', '@@ -31,4 +31,9 @@'],
      [' ', 31, 'def test_iso_dates():'],
      [' ', 32, '    assert parse_date("2026-10-05") == date(2026, 10, 5)'],
      [' ', 33, ''],
      ['a', 34, 'def test_day_first_dates():'],
      ['a', 35, '    # Invoices from India and the UK put the day first.'],
      ['a', 36, '    assert parse_date("05/10/2026") == date(2026, 10, 5)'],
      ['a', 37, '    assert parse_date("31/01/2026") == date(2026, 1, 31)'],
      ['a', 38, ''],
    ] },
    fix: { file: 'src/invoice/dates.py', add: 8, del: 3, lines: [
      ['h', '', '@@ -9,10 +9,15 @@ from datetime import date, datetime'],
      [' ', 9, 'FORMATS = ('],
      [' ', 10, '    "%Y-%m-%d",'],
      ['d', 11, '    "%m/%d/%Y",'],
      ['a', 11, '    "%d/%m/%Y",'],
      [' ', 12, ')'],
      [' ', 13, ''],
      [' ', 14, 'def parse_date(text: str) -> date:'],
      ['d', 15, '    return datetime.strptime(text, FORMATS[1]).date()'],
      ['d', 16, '    # TODO: other formats'],
      ['a', 15, '    for fmt in FORMATS:'],
      ['a', 16, '        try:'],
      ['a', 17, '            return datetime.strptime(text.strip(), fmt).date()'],
      ['a', 18, '        except ValueError:'],
      ['a', 19, '            continue'],
      ['a', 20, '    raise ValueError(f"Not a date I know: {text!r}")'],
      ['a', 21, ''],
    ] },
  },
  term: {
    one: ['pytest tests/test_dates.py -q', '..F', '', '_____ test_day_first_dates _____', '>   assert parse_date("05/10/2026") == date(2026, 10, 5)', 'E   AssertionError: date(2026, 5, 10) != date(2026, 10, 5)', '', '#f 1 failed, 2 passed in 0.21s'],
    all: ['pytest -q', '........................................   [100%]', '', '#p 40 passed in 3.84s'],
  },
};

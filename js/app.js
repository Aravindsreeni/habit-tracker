// ── app.js — bootstrap ─────────────────────────────────────────────
import { loadAll, initSchema } from './store.js';
import { gisLoaded, syncTrigger, loadTrigger, exportJSON, importJSON } from './sync.js';
import { registerView, registerDest, sw } from './router.js';
import { render as rToday } from './views/today.js';
import { render as rHabits } from './views/habits.js';
import { render as rReflect } from './views/reflect.js';
import { render as rCalm }    from './views/calm.js';
import { render as rYou }     from './views/you.js';
import { render as rD, showAddForm as sAFd, closeAddForm as cAFd, addHabit as aHd } from './views/daily.js';
import { render as rW, showAddForm as sAFw, closeAddForm as cAFw, addHabit as aHw } from './views/weekly.js';
import { render as rM, showAddForm as sAFm, closeAddForm as cAFm, addHabit as aHm } from './views/monthly.js';
import { render as rQt, showAddForm as sAFqt, closeAddForm as cAFqt, addHabit as aHqt } from './views/quarterly.js';
import { render as rYr, showAddForm as sAFyr, closeAddForm as cAFyr, addHabit as aHyr } from './views/yearly.js';
import { render as rQ, setFilter, toggleForm, addTask } from './views/tasks.js';
import { render as rInbox } from './views/inbox.js';
import { render as rRoutine } from './views/routine.js';
import { render as rStats } from './views/stats.js';
import { render as rJournal } from './views/journal.js';
import { render as rMood } from './views/mood.js';
import { render as rCbt } from './views/cbt.js';
import { render as rMindful } from './views/mindfulness.js';
import { render as rSettings, applyTheme, initRem } from './views/settings.js';

// ── Register views ─────────────────────────────────────────────────
registerView('today',       'p-today',       rToday);
registerView('habits',      'p-habits',      rHabits);
registerView('reflect',     'p-reflect',     rReflect);
registerView('calm',        'p-calm',        rCalm);
registerView('you',         'p-you',         rYou);
registerView('daily',       'p-daily',       rD);
registerView('weekly',      'p-weekly',      rW);
registerView('monthly',     'p-monthly',     rM);
registerView('quarterly',   'p-quarterly',   rQt);
registerView('yearly',      'p-yearly',      rYr);
registerView('wins',        'p-wins',        rQ);
registerView('inbox',       'p-inbox',       rInbox);
registerView('routine',     'p-routine',     rRoutine);
registerView('stats',       'p-stats',       rStats);
registerView('journal',     'p-journal',     rJournal);
registerView('mood',        'p-mood',        rMood);
registerView('cbt',         'p-cbt',         rCbt);
registerView('mindfulness', 'p-mindfulness', rMindful);
registerView('settings',    'p-settings',    rSettings);

// ── Register 5 destinations ────────────────────────────────────────
registerDest('today',   ['today']);
registerDest('habits',  ['habits']);
registerDest('reflect', ['reflect']);
registerDest('calm',    ['calm']);
registerDest('you',     ['you']);

// ── Date header ────────────────────────────────────────────────────
const _hdr = document.getElementById('hdr');
if (_hdr) _hdr.textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

// ── Keyboard shortcuts ─────────────────────────────────────────────
document.getElementById('qfn')?.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].forEach(s => {
  const inp = document.getElementById(`fn-${s}`);
  const addFns = { daily: aHd, weekly: aHw, monthly: aHm, quarterly: aHqt, yearly: aHyr };
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') addFns[s](); });
});

// ── Sync / backup buttons ──────────────────────────────────────────
document.getElementById('syncbtn')?.addEventListener('click', syncTrigger);
document.getElementById('loadbtn')?.addEventListener('click', loadTrigger);
document.getElementById('exportbtn')?.addEventListener('click', exportJSON);
document.getElementById('importbtn')?.addEventListener('click', importJSON);

// ── Expose globals for GIS script onload + any remaining inline refs
window.gisLoaded = gisLoaded;

// ── Expose add-form handlers so HTML onclick attrs work ────────────
window.showAddForm = (section) => {
  const fns = { daily: sAFd, weekly: sAFw, monthly: sAFm, quarterly: sAFqt, yearly: sAFyr };
  fns[section]?.();
};
window.closeAddForm = (section) => {
  const fns = { daily: cAFd, weekly: cAFw, monthly: cAFm, quarterly: cAFqt, yearly: cAFyr };
  fns[section]?.();
};
window.addHabit = (section) => {
  const fns = { daily: aHd, weekly: aHw, monthly: aHm, quarterly: aHqt, yearly: aHyr };
  fns[section]?.();
};

// ── Init ───────────────────────────────────────────────────────────
applyTheme();   // apply saved theme before paint (avoids flash)
initSchema();   // run migration before loading data
loadAll();
initRem();      // start reminder timers

// Activate Today destination on load; sw() renders all views within it
sw('today');

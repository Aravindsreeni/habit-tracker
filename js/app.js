// ── app.js — bootstrap ─────────────────────────────────────────────
import { loadAll, initSchema } from './store.js';
import { gisLoaded, syncTrigger, loadTrigger, exportJSON, importJSON } from './sync.js';
import { registerView, sw } from './router.js';
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
import { render as rSettings, applyTheme, initRem } from './views/settings.js';

// ── Register views ─────────────────────────────────────────────────
registerView('daily',   'p-daily',   rD);
registerView('weekly',  'p-weekly',  rW);
registerView('monthly', 'p-monthly', rM);
registerView('quarterly','p-quarterly', rQt);
registerView('yearly',  'p-yearly',  rYr);
registerView('wins',    'p-wins',    rQ);
registerView('inbox',   'p-inbox',    rInbox);
registerView('routine', 'p-routine',  rRoutine);
registerView('stats',   'p-stats',    rStats);
registerView('journal', 'p-journal',  rJournal);
registerView('settings','p-settings', rSettings);

// ── Date header ────────────────────────────────────────────────────
document.getElementById('hdr').textContent = new Date().toLocaleDateString('en-IN', {
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
rD(); rW(); rM(); rQt(); rYr(); rQ();

// Activate the wins tab on load (same as original default)
sw('wins');

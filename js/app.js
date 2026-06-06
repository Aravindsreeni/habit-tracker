// ── app.js — bootstrap ─────────────────────────────────────────────
import { loadAll, initSchema } from './store.js';
import { gisLoaded } from './sync.js';
import { registerView, registerDest, sw } from './router.js';
import { render as rToday }   from './views/today.js';
import { render as rHabits }  from './views/habits.js';
import { render as rReflect } from './views/reflect.js';
import { render as rCalm }    from './views/calm.js';
import { render as rYou }     from './views/you.js';
import { applyTheme, initRem } from './views/settings.js';

// ── Register 5 destination views ──────────────────────────────────
registerView('today',   'p-today',   rToday);
registerView('habits',  'p-habits',  rHabits);
registerView('reflect', 'p-reflect', rReflect);
registerView('calm',    'p-calm',    rCalm);
registerView('you',     'p-you',     rYou);

// ── Register 5 destinations ────────────────────────────────────────
registerDest('today',   ['today']);
registerDest('habits',  ['habits']);
registerDest('reflect', ['reflect']);
registerDest('calm',    ['calm']);
registerDest('you',     ['you']);

// ── Init ───────────────────────────────────────────────────────────
applyTheme();   // apply saved theme before paint (avoids flash)
initSchema();   // run migration before loading data
loadAll();
initRem();      // start reminder timers
gisLoaded();    // kick off GIS init (retries internally until google.accounts is ready)

// Activate Today destination on load
sw('today');

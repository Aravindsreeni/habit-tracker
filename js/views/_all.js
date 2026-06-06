// ── _all.js — re-exports renderAll for use by sync restore ────────
// ── _all.js — re-exports renderAll for use by sync restore ────────
import { render as rToday }   from './today.js';
import { render as rHabits }  from './habits.js';
import { render as rReflect } from './reflect.js';
import { render as rCalm }    from './calm.js';
import { render as rD }       from './daily.js';
import { render as rW }       from './weekly.js';
import { render as rM }       from './monthly.js';
import { render as rQt }      from './quarterly.js';
import { render as rYr }      from './yearly.js';
import { render as rQ }       from './tasks.js';
import { render as rRoutine } from './routine.js';
import { render as rStats }   from './stats.js';

export function renderAll() {
  rToday(); rHabits(); rReflect(); rCalm(); rD(); rW(); rM(); rQt(); rYr(); rQ(); rRoutine(); rStats();
}

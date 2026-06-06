// ── _all.js — renderAll called by sync.js after a Drive restore ───────
// Each destination wrapper re-renders its own sub-views, so a single call
// per destination is enough to refresh all visible and hidden panels.
import { render as rToday }   from './today.js';
import { render as rHabits }  from './habits.js';
import { render as rReflect } from './reflect.js';
import { render as rCalm }    from './calm.js';
import { render as rYou }     from './you.js';

export function renderAll() {
  rToday(); rHabits(); rReflect(); rCalm(); rYou();
}

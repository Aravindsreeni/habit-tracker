// ── _all.js — re-exports renderAll for use by sync restore ────────
import { render as rToday } from './today.js';
import { render as rD } from './daily.js';
import { render as rW } from './weekly.js';
import { render as rM } from './monthly.js';
import { render as rQt } from './quarterly.js';
import { render as rYr } from './yearly.js';
import { render as rQ } from './tasks.js';
import { render as rInbox } from './inbox.js';
import { render as rRoutine } from './routine.js';
import { render as rStats } from './stats.js';
import { render as rJournal } from './journal.js';
import { render as rMood } from './mood.js';
import { render as rCbt } from './cbt.js';
import { render as rMindful } from './mindfulness.js';

export function renderAll() {
  rToday(); rD(); rW(); rM(); rQt(); rYr(); rQ(); rInbox(); rRoutine(); rStats(); rJournal(); rMood(); rCbt(); rMindful();
}

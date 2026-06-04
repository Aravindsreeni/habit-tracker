// ── _all.js — re-exports renderAll for use by sync restore ────────
import { render as rD } from './daily.js';
import { render as rW } from './weekly.js';
import { render as rM } from './monthly.js';
import { render as rQ } from './tasks.js';

export function renderAll() {
  rD(); rW(); rM(); rQ();
}

import type { Card } from '../types';

export function emptyCard(): Card {
  return { ease: 2.5, interval: 0, reps: 0, due: new Date(0).toISOString() };
}

/** SM-2. quality is 0..5. Below 3 resets the card to tomorrow. */
export function schedule(card: Card, quality: number, now = new Date()): Card {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let ease = card.ease || 2.5;
  let interval = card.interval;
  let reps = card.reps;
  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * ease));
    reps += 1;
  }
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < 1.3) ease = 1.3;
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + interval);
  return { ease, interval, reps, due: due.toISOString() };
}

export function isDue(card: Card, now = new Date()): boolean {
  return new Date(card.due).getTime() <= now.getTime();
}

import 'server-only';
import { connection } from 'next/server';
import { tunisToday } from './dates';

/** Today's café date in Tunisia, read at request time (never baked into a prerender). */
export async function todayInTunis(): Promise<string> {
  await connection();
  return tunisToday(Date.now());
}

/** The current time at request time (for "il y a 3 jours"), never baked into a prerender. */
export async function requestNowMs(): Promise<number> {
  await connection();
  return Date.now();
}

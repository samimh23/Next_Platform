import 'server-only';
import { connection } from 'next/server';
import { tunisToday } from './dates';

/** Today's café date in Tunisia, read at request time (never baked into a prerender). */
export async function todayInTunis(): Promise<string> {
  await connection();
  return tunisToday(Date.now());
}

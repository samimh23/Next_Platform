'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { shiftDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

/**
 * One filter row above the content it scopes: Today / Yesterday presets, then a date picker.
 * The date lives in the URL (?date=YYYY-MM-DD) so it can be shared and survives a reload.
 */
export function DateFilter({ basePath, date, today }: { basePath: string; date: string; today: string }) {
  const router = useRouter();
  const yesterday = shiftDate(today, -1);
  const href = (d: string) => (d === today ? basePath : `${basePath}?date=${d}`);
  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1 text-sm',
      active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
    );

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Période">
      <Link href={href(today)} className={chip(date === today)} aria-current={date === today ? 'date' : undefined}>
        Aujourd’hui
      </Link>
      <Link href={href(yesterday)} className={chip(date === yesterday)} aria-current={date === yesterday ? 'date' : undefined}>
        Hier
      </Link>
      <input
        type="date"
        aria-label="Choisir une date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && router.push(href(e.target.value))}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
      />
    </div>
  );
}


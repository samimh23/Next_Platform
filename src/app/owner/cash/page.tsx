import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { DateFilter } from '@/components/date-filter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { CashSession } from '@/lib/backend/types';
import { GAP_CLASS, gapLabel, gapTone } from '@/lib/cash';
import { formatDayFr, formatTimeTunis, isDate } from '@/lib/dates';
import { formatDT } from '@/lib/money';
import { todayInTunis } from '@/lib/server-time';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Clôtures' };

export default function CashPage({ searchParams }: PageProps<'/owner/cash'>) {
  return (
    <div className="grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clôtures de caisse</h1>
        <p className="text-muted-foreground">
          Chaque caisse est ouverte avec un fond de caisse et clôturée en comptant le tiroir. L’écart montre s’il
          manque de l’argent.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <Sessions searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Sessions({ searchParams }: Pick<PageProps<'/owner/cash'>, 'searchParams'>) {
  const params = await searchParams;
  const today = await todayInTunis();
  const date = isDate(params.date) ? params.date : today;
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;
  const sessions = await ownerFetch<CashSession[]>(`/v1/owner/branches/${branch.id}/cash-sessions?date=${date}&limit=200`);
  const closed = sessions.filter((s) => s.status === 'closed' && s.difference !== null);
  const totalGap = closed.reduce((sum, s) => sum + (s.difference ?? 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground first-letter:uppercase">{formatDayFr(date)}</p>
        <DateFilter basePath="/owner/cash" date={date} today={today} />
      </div>

      {closed.length > 0 && (
        <p className={cn('text-sm', GAP_CLASS[gapTone(totalGap)])} role="status">
          Écart total du jour : {gapLabel(totalGap, formatDT)}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune caisse ouverte ce jour-là. Sur la caisse, le premier encaissement demande le fond de caisse.
        </p>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-2 font-medium">Caisse</th>
                  <th className="px-4 py-2 font-medium">Ouverture</th>
                  <th className="px-4 py-2 font-medium">Clôture</th>
                  <th className="hidden px-4 py-2 text-right font-medium md:table-cell">Fond</th>
                  <th className="px-4 py-2 text-right font-medium">Espèces attendues</th>
                  <th className="px-4 py-2 text-right font-medium">Comptées</th>
                  <th className="px-4 py-2 text-right font-medium">Écart</th>
                  <th className="hidden px-4 py-2 text-right font-medium md:table-cell">Carte</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-2">
                      <Link href={`/owner/cash/${s.id}`} className="underline-offset-4 hover:underline">
                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{s.drawer?.code ?? '?'}</span>
                        {s.drawer?.name ?? 'Caisse'}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {formatTimeTunis(s.openedAt)}
                      {s.openedBy && <span className="text-muted-foreground"> · {s.openedBy}</span>}
                    </td>
                    <td className="px-4 py-2">
                      {s.closedAt ? (
                        <>
                          {formatTimeTunis(s.closedAt)}
                          {s.closedBy && <span className="text-muted-foreground"> · {s.closedBy}</span>}
                        </>
                      ) : (
                        <Badge variant="outline">En cours</Badge>
                      )}
                    </td>
                    <td className="hidden px-4 py-2 text-right md:table-cell">{formatDT(s.openingFloat)}</td>
                    <td className="px-4 py-2 text-right">{s.expectedCash === null ? '—' : formatDT(s.expectedCash)}</td>
                    <td className="px-4 py-2 text-right">{s.countedCash === null ? '—' : formatDT(s.countedCash)}</td>
                    <td className={cn('px-4 py-2 text-right', s.difference !== null && GAP_CLASS[gapTone(s.difference)])}>
                      {s.difference === null ? '—' : s.difference === 0 ? '✓' : formatDT(s.difference)}
                    </td>
                    <td className="hidden px-4 py-2 text-right md:table-cell">{formatDT(s.cardSales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackendError } from '@/lib/backend/errors';
import { ownerFetch } from '@/lib/backend/server';
import type { CashSessionDetail } from '@/lib/backend/types';
import { GAP_CLASS, gapLabel, gapTone } from '@/lib/cash';
import { formatTimeTunis } from '@/lib/dates';
import { formatDT } from '@/lib/money';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Clôture de caisse' };

export default function CashSessionPage({ params }: PageProps<'/owner/cash/[sessionId]'>) {
  return (
    <div className="grid max-w-2xl gap-6">
      <Link href="/owner/cash" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Clôtures
      </Link>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <Session params={params} />
      </Suspense>
    </div>
  );
}

async function Session({ params }: Pick<PageProps<'/owner/cash/[sessionId]'>, 'params'>) {
  const { sessionId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();

  let s: CashSessionDetail;
  try {
    s = await ownerFetch<CashSessionDetail>(`/v1/owner/cash-sessions/${sessionId}`);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) notFound();
    throw e;
  }
  const row = (label: string, value: string, className?: string) => (
    <div className={cn('flex justify-between gap-4 py-1', className)}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {s.drawer ? `${s.drawer.code} · ${s.drawer.name}` : 'Caisse'}{' '}
          {s.status === 'open' && <Badge variant="outline">En cours</Badge>}
        </h1>
        <p className="text-muted-foreground">
          Ouverte à {formatTimeTunis(s.openedAt)}
          {s.openedBy && ` par ${s.openedBy}`}
          {s.closedAt && ` · clôturée à ${formatTimeTunis(s.closedAt)}`}
          {s.closedBy && ` par ${s.closedBy}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Espèces</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {row('Fond de caisse', formatDT(s.openingFloat))}
          {row('Ventes espèces', formatDT(s.cashSales))}
          {row('Entrées d’argent', formatDT(s.cashIn))}
          {row('Sorties d’argent', formatDT(-s.cashOut))}
          {s.status === 'closed' && s.expectedCash !== null && s.countedCash !== null && s.difference !== null ? (
            <>
              {row('Espèces attendues', formatDT(s.expectedCash), 'border-t mt-2 pt-2 font-medium')}
              {row('Espèces comptées', formatDT(s.countedCash), 'font-medium')}
              {row('Écart', gapLabel(s.difference, formatDT), cn('text-base', GAP_CLASS[gapTone(s.difference)]))}
            </>
          ) : (
            <p className="mt-2 text-muted-foreground">La caisse n’est pas encore clôturée.</p>
          )}
          {s.note && <p className="mt-3 text-muted-foreground">Commentaire : {s.note}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autres paiements</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {row('Ventes carte (TPE)', formatDT(s.cardSales))}
          {row('Tickets encaissés', String(s.ticketCount))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrées et sorties d’argent</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {s.movements.length === 0 ? (
            <p className="text-muted-foreground">Aucune.</p>
          ) : (
            <ul className="grid gap-2">
              {s.movements.map((m) => (
                <li key={m.id} className="flex justify-between gap-4">
                  <span>
                    {formatTimeTunis(m.createdAt)} · {m.reason}
                    {m.staff && <span className="text-muted-foreground"> · {m.staff}</span>}
                  </span>
                  <span className={cn('tabular-nums', m.type === 'out' && 'text-muted-foreground')}>
                    {m.type === 'in' ? '+' : '−'}
                    {formatDT(m.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

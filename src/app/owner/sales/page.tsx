import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { DateFilter } from '@/components/date-filter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { OrderStatus, OrderView } from '@/lib/backend/types';
import { formatDayFr, formatTimeTunis, isDate, PAYMENT_LABEL } from '@/lib/dates';
import { formatDT } from '@/lib/money';
import { todayInTunis } from '@/lib/server-time';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Ventes' };

const STATUS: Record<OrderStatus, { label: string; variant: 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Payé', variant: 'secondary' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
  open: { label: 'En cours', variant: 'outline' },
};

export default function SalesPage({ searchParams }: PageProps<'/owner/sales'>) {
  return (
    <div className="grid max-w-4xl gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Ventes</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <SalesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SalesList({ searchParams }: Pick<PageProps<'/owner/sales'>, 'searchParams'>) {
  const params = await searchParams;
  const today = await todayInTunis();
  const date = isDate(params.date) ? params.date : today;
  const status = (['paid', 'cancelled', 'open'] as const).find((s) => s === params.status);
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;

  const orders = await ownerFetch<OrderView[]>(
    `/v1/owner/branches/${branch.id}/sales/orders?date=${date}&limit=200${status ? `&status=${status}` : ''}`,
  );
  const statusHref = (s?: OrderStatus) => {
    const q = new URLSearchParams();
    if (date !== today) q.set('date', date);
    if (s) q.set('status', s);
    return `/owner/sales${q.size ? `?${q}` : ''}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground first-letter:uppercase">{formatDayFr(date)}</p>
        <DateFilter basePath="/owner/sales" date={date} today={today} />
      </div>

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filtrer par statut">
        {[undefined, 'paid', 'cancelled', 'open'].map((s) => (
          <Link
            key={s ?? 'all'}
            href={statusHref(s as OrderStatus | undefined)}
            aria-current={status === s ? 'page' : undefined}
            className={cn('rounded-md px-3 py-1', status === s ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent')}
          >
            {s ? STATUS[s as OrderStatus].label : 'Tous'}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun ticket pour ce jour.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-2 font-medium">Heure</th>
                  <th className="px-4 py-2 font-medium">Ticket</th>
                  <th className="px-4 py-2 font-medium">Table</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">Caisse</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-2">{formatTimeTunis(o.closedAt ?? o.openedAt)}</td>
                    <td className="px-4 py-2">
                      <Link href={`/owner/sales/${o.id}`} className="underline-offset-4 hover:underline">
                        {o.receiptNumber ?? 'Sans numéro'}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{o.tableName ?? <span className="text-muted-foreground">Comptoir</span>}</td>
                    <td className="hidden px-4 py-2 sm:table-cell">{o.deviceCode ?? '—'}</td>
                    <td className="px-4 py-2">
                      <Badge variant={STATUS[o.status].variant}>{STATUS[o.status].label}</Badge>
                      {o.paymentMethod && (
                        <span className="ml-2 text-muted-foreground">{PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{o.status === 'paid' ? formatDT(o.total) : '—'}</td>
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

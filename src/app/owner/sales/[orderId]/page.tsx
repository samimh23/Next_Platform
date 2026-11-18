import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ownerFetch } from '@/lib/backend/server';
import { BackendError } from '@/lib/backend/errors';
import type { OrderDetail } from '@/lib/backend/types';
import { formatTimeTunis, PAYMENT_LABEL } from '@/lib/dates';
import { formatDT } from '@/lib/money';

export const metadata: Metadata = { title: 'Ticket' };

export default function OrderPage({ params }: PageProps<'/owner/sales/[orderId]'>) {
  return (
    <div className="grid max-w-2xl gap-6">
      <Link href="/owner/sales" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Ventes
      </Link>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <Order params={params} />
      </Suspense>
    </div>
  );
}

async function Order({ params }: Pick<PageProps<'/owner/sales/[orderId]'>, 'params'>) {
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();

  let o: OrderDetail;
  try {
    o = await ownerFetch<OrderDetail>(`/v1/owner/orders/${orderId}`);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) notFound();
    throw e;
  }
  const removed = o.lines.filter((l) => l.voided);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{o.receiptNumber ?? 'Ticket sans numéro'}</h1>
        <p className="text-muted-foreground">
          {formatTimeTunis(o.closedAt ?? o.openedAt)} · {o.tableName ? `table ${o.tableName}` : 'comptoir'} · caisse{' '}
          {o.deviceCode ?? '—'}{' '}
          <Badge variant={o.status === 'cancelled' ? 'destructive' : o.status === 'open' ? 'outline' : 'secondary'}>
            {o.status === 'paid' ? 'Payé' : o.status === 'cancelled' ? 'Annulé' : 'En cours'}
          </Badge>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <ul className="grid gap-2">
            {o.lines
              .filter((l) => !l.voided)
              .map((l) => (
                <li key={l.id} className="flex justify-between gap-2">
                  <span>
                    {l.qty} × {l.name}
                    {l.modifiers.length > 0 && (
                      <span className="block text-muted-foreground">{l.modifiers.map((m) => m.name).join(', ')}</span>
                    )}
                  </span>
                  <span className="tabular-nums">{formatDT(l.total)}</span>
                </li>
              ))}
          </ul>

          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total TTC</span>
            <span className="tabular-nums">{formatDT(o.total)}</span>
          </div>
          {o.vat.map((v) => (
            <div key={v.rateBp} className="flex justify-between text-muted-foreground tabular-nums">
              <span>
                TVA {v.rateBp / 100} % (HT {formatDT(v.ht)})
              </span>
              <span>{formatDT(v.vat)}</span>
            </div>
          ))}
          {o.payments.map((p, i) => (
            <div key={i} className="flex justify-between tabular-nums">
              <span>
                {PAYMENT_LABEL[p.method] ?? p.method}
                {p.method === 'cash' && p.changeGiven > 0 && (
                  <span className="text-muted-foreground">
                    {' '}
                    (reçu {formatDT(p.tendered)}, rendu {formatDT(p.changeGiven)})
                  </span>
                )}
              </span>
              <span>{formatDT(p.amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Control: items removed by the cashier stay visible to the owner. */}
      {removed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Articles retirés par la caisse</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1 text-sm text-muted-foreground">
              {removed.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span className="line-through">
                    {l.qty} × {l.name}
                  </span>
                  <span className="tabular-nums">{formatDT((l.unitPrice + l.modifiersPrice) * l.qty)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

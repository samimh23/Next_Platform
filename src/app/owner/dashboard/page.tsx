import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AutoRefresh } from '@/components/auto-refresh';
import { DateFilter } from '@/components/date-filter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { OrderView, SalesSummary, StockView } from '@/lib/backend/types';
import { formatDayFr, formatTimeTunis, isDate, PAYMENT_LABEL } from '@/lib/dates';
import { todayInTunis } from '@/lib/server-time';
import { formatDT } from '@/lib/money';
import { HourlyChart } from './hourly-chart';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default function DashboardPage({ searchParams }: PageProps<'/owner/dashboard'>) {
  return (
    <div className="grid max-w-5xl gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<'/owner/dashboard'>, 'searchParams'>) {
  const { date: param } = await searchParams;
  const today = await todayInTunis();
  const date = isDate(param) ? param : today;
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;

  const [s, orders, stock] = await Promise.all([
    ownerFetch<SalesSummary>(`/v1/owner/branches/${branch.id}/sales/summary?date=${date}`),
    ownerFetch<OrderView[]>(`/v1/owner/branches/${branch.id}/sales/orders?date=${date}&status=paid&limit=5`),
    ownerFetch<StockView>(`/v1/owner/branches/${branch.id}/stock`),
  ]);
  const lowStock = stock.items.filter((i) => i.low);
  const isToday = date === today;

  return (
    <>
      {/* Live numbers while looking at today */}
      {isToday && <AutoRefresh everyMs={15_000} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground first-letter:uppercase">
          {branch.name} · {formatDayFr(date)}
        </p>
        <DateFilter basePath="/owner/dashboard" date={date} today={today} />
      </div>

      {lowStock.length > 0 && (
        <Link
          href="/owner/stock"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm hover:bg-destructive/10"
        >
          <span className="font-medium">
            Stock bas : {lowStock.slice(0, 3).map((i) => i.name).join(', ')}
            {lowStock.length > 3 && ` et ${lowStock.length - 3} autre${lowStock.length > 4 ? 's' : ''}`}
          </span>{' '}
          <span className="text-muted-foreground">→ Voir le stock</span>
        </Link>
      )}

      {/* Hero figure + KPI row */}
      <section aria-label="Chiffres du jour" className="grid gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Chiffre d’affaires</p>
          <p className="text-5xl font-semibold tracking-tight">{formatDT(s.revenue)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Tickets" value={String(s.ticketCount)} />
          <StatTile label="Panier moyen" value={formatDT(s.averageTicket)} />
          <StatTile label="Articles vendus" value={String(s.itemCount)} />
          <StatTile
            label="Annulés / en cours"
            value={`${s.cancelledCount} / ${s.openCount}`}
            hint={s.cancelledCount > 0 ? 'Vérifiez les annulations dans Ventes' : undefined}
          />
          <StatTile
            label="Remises & offerts"
            value={formatDT(s.discounts.amount)}
            hint={
              s.discounts.lines > 0
                ? `${s.discounts.lines} remise${s.discounts.lines > 1 ? 's' : ''}${s.discounts.freeItems > 0 ? ` · ${s.discounts.freeItems} offert${s.discounts.freeItems > 1 ? 's' : ''}` : ''}`
                : undefined
            }
          />
          <StatTile
            label="Remboursés"
            value={String(s.refunds.count)}
            hint={s.refunds.count > 0 ? `${formatDT(s.refunds.amount)} rendus — détail dans Ventes` : undefined}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Chiffre d’affaires par heure</CardTitle>
          <CardDescription>En dinars, heure de Tunisie.</CardDescription>
        </CardHeader>
        <CardContent>
          <HourlyChart data={s.byHour} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meilleures ventes</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente.</p>
            ) : (
              <ol className="grid gap-2 text-sm">
                {s.topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-baseline justify-between gap-2">
                    <span>
                      <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                      {p.name} <span className="text-muted-foreground">× {p.qty}</span>
                    </span>
                    <span className="font-medium tabular-nums">{formatDT(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paiements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {s.byPaymentMethod.length === 0 ? (
              <p className="text-muted-foreground">Aucun paiement.</p>
            ) : (
              s.byPaymentMethod.map((p) => (
                <div key={p.method} className="flex items-baseline justify-between">
                  <span>
                    {PAYMENT_LABEL[p.method] ?? p.method}{' '}
                    <span className="text-muted-foreground">
                      ({p.count} ticket{p.count > 1 ? 's' : ''})
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{formatDT(p.amount)}</span>
                </div>
              ))
            )}
            {s.vat.length > 0 && (
              <div className="mt-2 border-t pt-2 text-muted-foreground">
                {s.vat.map((v) => (
                  <div key={v.rateBp} className="flex justify-between tabular-nums">
                    <span>TVA {v.rateBp / 100} % (HT {formatDT(v.ht)})</span>
                    <span>{formatDT(v.vat)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Derniers tickets</CardTitle>
          <Link href={isToday ? '/owner/sales' : `/owner/sales?date=${date}`} className="text-sm underline underline-offset-4">
            Tout voir
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun ticket.</p>
          ) : (
            <ul className="divide-y text-sm">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/owner/sales/${o.id}`} className="flex items-center justify-between gap-2 py-2 hover:bg-accent/50">
                    <span className="tabular-nums">
                      <span className="mr-2 text-muted-foreground">{o.closedAt ? formatTimeTunis(o.closedAt) : ''}</span>
                      {o.receiptNumber}
                      {o.paymentMethod && (
                        <Badge variant="outline" className="ml-2">
                          {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                        </Badge>
                      )}
                    </span>
                    <span className="font-medium tabular-nums">{formatDT(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden>
      <div className="h-16 w-56 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

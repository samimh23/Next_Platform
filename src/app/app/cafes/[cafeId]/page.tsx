import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customerFetch, hasCustomerSession, publicFetch } from '@/lib/backend/customer-server';
import { BackendError } from '@/lib/backend/errors';
import type { CafeDetail, MyCafe } from '@/lib/backend/types';
import { formatDateTimeTunis } from '@/lib/dates';

export const metadata: Metadata = { title: 'Café' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A café: its rewards; when logged in, my balance, progress and history there. */
export default function CafePage({ params }: PageProps<'/app/cafes/[cafeId]'>) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
      <Cafe params={params} />
    </Suspense>
  );
}

async function load(id: string): Promise<{ cafe: CafeDetail; mine: MyCafe | null }> {
  try {
    if (await hasCustomerSession()) {
      const mine = await customerFetch<MyCafe>(`/v1/customer/points/${id}`);
      return { cafe: mine, mine };
    }
    return { cafe: await publicFetch<CafeDetail>(`/v1/public/cafes/${id}`), mine: null };
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) notFound();
    throw e;
  }
}

const KIND: Record<string, string> = { earn: 'Ticket', refund: 'Ticket remboursé', redeem: 'Récompense' };

async function Cafe({ params }: Pick<PageProps<'/app/cafes/[cafeId]'>, 'params'>) {
  const { cafeId } = await params;
  if (!UUID.test(cafeId)) notFound();
  const { cafe, mine } = await load(cafeId);
  const rewards = [...cafe.rewards].sort((a, b) => a.points - b.points);
  const next = mine ? rewards.find((r) => r.points > mine.balance) : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/app/cafes" className="text-sm text-muted-foreground hover:underline">
          ← Cafés
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{cafe.name}</h1>
        <p className="text-muted-foreground">{[cafe.address, cafe.city].filter(Boolean).join(', ')}</p>
        {cafe.phone && (
          <a href={`tel:${cafe.phone.replace(/\s/g, '')}`} className="text-sm underline underline-offset-4">
            {cafe.phone}
          </a>
        )}
      </div>

      {mine ? (
        <Card>
          <CardContent className="grid gap-2 py-5 text-center">
            <p className="text-sm text-muted-foreground">Mes points ici</p>
            <p className="text-5xl font-bold tabular-nums">{mine.balance}</p>
            {next && (
              <>
                <div className="mx-auto mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.round((mine.balance / next.points) * 100))}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Encore {next.points - mine.balance} pts pour « {next.name} »
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        cafe.loyalty && (
          <Card>
            <CardContent className="grid gap-3 py-5 text-center">
              <p>Gagnez des points à chaque visite.</p>
              <Link href={`/app/signup?next=/app/cafes/${cafe.id}`} className={buttonVariants({ className: 'mx-auto' })}>
                Créer mon compte
              </Link>
            </CardContent>
          </Card>
        )
      )}

      {cafe.loyalty ? (
        <Card>
          <CardHeader>
            <CardTitle>Récompenses</CardTitle>
            <p className="text-sm text-muted-foreground">
              {cafe.pointsPerDinar} point{cafe.pointsPerDinar > 1 ? 's' : ''} par dinar dépensé
            </p>
          </CardHeader>
          <CardContent>
            {rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">Le café n’a pas encore ajouté de récompense.</p>
            ) : (
              <ul className="grid gap-2">
                {rewards.map((r) => {
                  const ready = mine && mine.balance >= r.points;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className={ready ? 'font-medium' : undefined}>
                        {ready && '🎁 '}
                        {r.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{r.points} pts</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {mine && rewards.some((r) => mine.balance >= r.points) && (
              <p className="mt-4 text-sm text-muted-foreground">Demandez votre récompense à la caisse.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Ce café n’a pas de programme de fidélité pour le moment.</p>
      )}

      {mine && mine.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm">
              {mine.history.map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {KIND[h.kind] ?? h.kind} {h.receiptNumber ?? h.rewardName ?? ''}
                    <span className="block text-muted-foreground">{formatDateTimeTunis(h.at)}</span>
                  </span>
                  <span className={`tabular-nums font-medium ${h.points < 0 ? 'text-destructive' : ''}`}>
                    {h.points > 0 ? '+' : ''}
                    {h.points}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

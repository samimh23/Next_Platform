import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { customerFetch } from '@/lib/backend/customer-server';
import type { CustomerGift, PointsBalance } from '@/lib/backend/types';
import { formatDateTimeTunis } from '@/lib/dates';
import { UseReward } from './cafes/[cafeId]/use-reward';

export const metadata: Metadata = { title: 'Mes points' };

/** "Mes points": the balance in each café the customer earned points in. */
export default function MyPointsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes points</h1>
        <p className="text-muted-foreground">Scannez le QR code de votre ticket de caisse pour gagner des points.</p>
      </div>
      <Suspense fallback={null}>
        <Gifts />
      </Suspense>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <Balances />
      </Suspense>
    </div>
  );
}

async function Balances() {
  const balances = await customerFetch<PointsBalance[]>('/v1/customer/points');
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="grid gap-3 py-6 text-center">
          <p className="font-medium">Pas encore de points</p>
          <p className="text-sm text-muted-foreground">
            Après votre prochain café, scannez le QR code imprimé en bas du ticket avec l’appareil photo de votre
            téléphone.
          </p>
          <Link href="/app/cafes" className={buttonVariants({ variant: 'outline', className: 'mx-auto' })}>
            Voir les cafés
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <ul className="grid gap-3">
      {balances.map((b) => (
        <li key={b.cafeId}>
          <Link href={`/app/cafes/${b.cafeId}`} className="block rounded-xl border p-4 hover:bg-accent">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{b.cafeName}</p>
                {b.city && <p className="text-sm text-muted-foreground">{b.city}</p>}
              </div>
              <p className="shrink-0 text-2xl font-bold tabular-nums">
                {b.balance} <span className="text-sm font-normal text-muted-foreground">pts</span>
              </p>
            </div>
            {b.rewardsAvailable > 0 && (
              <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                🎁 {b.rewardsAvailable} récompense{b.rewardsAvailable > 1 ? 's' : ''} disponible
                {b.rewardsAvailable > 1 ? 's' : ''}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Gifts the customer's cafés sent them (club members only), soonest to expire first. */
async function Gifts() {
  const gifts = await customerFetch<CustomerGift[]>('/v1/customer/gifts');
  if (gifts.length === 0) return null;
  return (
    <section className="grid gap-2 rounded-xl border border-amber-300 p-4 dark:border-amber-700" aria-label="Vos cadeaux">
      <h2 className="font-semibold">🎁 Vos cadeaux</h2>
      <ul className="grid gap-3">
        {gifts.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium">{g.name}</span>
              <span className="block truncate text-muted-foreground">
                {g.cafeName} · jusqu’au {formatDateTimeTunis(g.expiresAt)}
              </span>
            </span>
            <UseReward giftId={g.id} rewardName={`${g.name} · ${g.cafeName}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { ClubView, GiftCampaign, Menu } from '@/lib/backend/types';
import { formatDateTimeTunis } from '@/lib/dates';
import { requestNowMs } from '@/lib/server-time';
import { ClientsManager } from './clients-manager';

export const metadata: Metadata = { title: 'Clients' };

export default function CustomersPage() {
  return (
    <div className="grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Les clients fidélité qui ont rejoint le club de votre café. Envoyez-leur un cadeau pour les faire revenir.
        </p>
      </div>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <Section />
      </Suspense>
    </div>
  );
}

async function Section() {
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;
  const [club, campaigns, menu, nowMs] = await Promise.all([
    ownerFetch<ClubView>(`/v1/owner/branches/${branch.id}/club`),
    ownerFetch<GiftCampaign[]>(`/v1/owner/branches/${branch.id}/gifts`),
    ownerFetch<Menu>(`/v1/owner/branches/${branch.id}/menu`),
    requestNowMs(),
  ]);
  const hidden = club.customers - club.members.length;
  return (
    <>
      <p className="text-sm">
        <span className="font-semibold">{club.members.length}</span> membre{club.members.length > 1 ? 's' : ''} du club
        {hidden > 0 && (
          <span className="text-muted-foreground">
            {' '}
            · {hidden} autre{hidden > 1 ? 's' : ''} client{hidden > 1 ? 's' : ''} fidélité n’ont pas rejoint le club (vous ne
            voyez pas leurs informations)
          </span>
        )}
      </p>
      <ClientsManager
        branchId={branch.id}
        members={club.members}
        products={menu.products.filter((p) => p.available).map((p) => ({ id: p.id, name: p.name }))}
        canSend={me.user.role === 'owner'}
        nowMs={nowMs}
      />
      <section className="grid gap-3" aria-label="Cadeaux envoyés">
        <h2 className="text-lg font-semibold">Cadeaux envoyés</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun cadeau envoyé pour le moment.</p>
        ) : (
          <ul className="grid gap-2">
            {campaigns.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-muted-foreground">
                    Envoyé le {formatDateTimeTunis(c.sentAt)} · valable jusqu’au {formatDateTimeTunis(c.expiresAt)}
                  </span>
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold">{c.used}</span> utilisé{c.used > 1 ? 's' : ''} sur {c.sent}
                  {c.sent > 0 && <span className="text-muted-foreground"> ({Math.round((c.used / c.sent) * 100)} %)</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

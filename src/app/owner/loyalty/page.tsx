import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Business, LoyaltyProgram, Menu } from '@/lib/backend/types';
import { LoyaltyEditor } from './loyalty-editor';

export const metadata: Metadata = { title: 'Fidélité' };

export default function LoyaltyPage() {
  return (
    <div className="grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fidélité</h1>
        <p className="text-muted-foreground">
          Vos clients gagnent des points en scannant le QR code de leur ticket, et les échangent contre des
          récompenses.
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
  const [program, menu, business] = await Promise.all([
    ownerFetch<LoyaltyProgram>(`/v1/owner/branches/${branch.id}/loyalty`),
    ownerFetch<Menu>(`/v1/owner/branches/${branch.id}/menu`),
    ownerFetch<Business>(`/v1/owner/branches/${branch.id}/business`),
  ]);
  return (
    <LoyaltyEditor
      branchId={branch.id}
      program={program}
      products={menu.products.map((p) => ({ id: p.id, name: p.name }))}
      listed={business.listed}
      canEdit={me.user.role === 'owner'}
    />
  );
}

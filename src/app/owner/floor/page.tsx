import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Floor } from '@/lib/backend/types';
import { FloorEditor } from './floor-editor';

export const metadata: Metadata = { title: 'Salle & tables' };

export default function FloorPage() {
  return (
    <div className="grid max-w-4xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salle & tables</h1>
        <p className="text-muted-foreground">
          Vos salles et leurs tables. Les serveurs ouvrent un ticket par table sur la caisse ; les changements arrivent
          à la prochaine synchronisation.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <FloorSection />
      </Suspense>
    </div>
  );
}

async function FloorSection() {
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;
  const floor = await ownerFetch<Floor>(`/v1/owner/branches/${branch.id}/floor`);
  return <FloorEditor branchId={branch.id} floor={floor} />;
}

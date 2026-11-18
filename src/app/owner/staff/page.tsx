import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Staff } from '@/lib/backend/types';
import { StaffDialog } from './staff-dialog';
import { StaffList } from './staff-list';

export const metadata: Metadata = { title: 'Personnel' };

export default function StaffPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personnel</h1>
        <p className="text-muted-foreground">
          Chaque personne se connecte sur la caisse avec son code PIN, même sans internet. Chaque vente indique qui
          l’a faite.
        </p>
      </div>
      <Suspense fallback={<StaffSkeleton />}>
        <StaffSection />
      </Suspense>
    </div>
  );
}

async function StaffSection() {
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;

  const staff = await ownerFetch<Staff[]>(`/v1/owner/branches/${branch.id}/staff`);
  const canManage = me.user.role === 'owner';

  return (
    <>
      {canManage ? (
        <div>
          <StaffDialog branchId={branch.id} trigger={<Button>Ajouter une personne</Button>} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Seul le propriétaire peut ajouter ou modifier le personnel.</p>
      )}
      <StaffList staff={staff} branchId={branch.id} canManage={canManage} />
    </>
  );
}

function StaffSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden>
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

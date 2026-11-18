import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Device, PairingCode } from '@/lib/backend/types';
import { AddDevice } from './add-device';
import { AutoRefresh } from '@/components/auto-refresh';
import { DeviceList } from './device-list';

export const metadata: Metadata = { title: 'Caisses' };

export default function DevicesPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caisses</h1>
        <p className="text-muted-foreground">
          Associez les tablettes et PC de caisse de votre café, et voyez lesquels sont en ligne.
        </p>
      </div>
      <Suspense fallback={<DevicesSkeleton />}>
        <DevicesSection />
      </Suspense>
    </div>
  );
}

async function DevicesSection() {
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;

  const [devices, codes] = await Promise.all([
    ownerFetch<Device[]>(`/v1/owner/branches/${branch.id}/devices`),
    ownerFetch<PairingCode[]>(`/v1/owner/branches/${branch.id}/pairing-codes`),
  ]);
  const canManage = me.user.role === 'owner';

  return (
    <>
      {/* Online status and newly paired POS appear without reloading. */}
      <AutoRefresh everyMs={10_000} />
      {canManage ? (
        <AddDevice branchId={branch.id} hasHub={devices.some((d) => d.role === 'hub')} activeCode={codes.at(-1) ?? null} />
      ) : (
        <p className="text-sm text-muted-foreground">Seul le propriétaire peut associer ou désactiver une caisse.</p>
      )}
      <DeviceList devices={devices} canManage={canManage} />
    </>
  );
}

function DevicesSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

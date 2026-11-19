import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Business } from '@/lib/backend/types';
import { BusinessForm } from './business-form';

export const metadata: Metadata = { title: 'Établissement' };

export default function SettingsPage() {
  return (
    <div className="grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Établissement</h1>
        <p className="text-muted-foreground">Les informations imprimées en haut et en bas des tickets de caisse.</p>
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
  const business = await ownerFetch<Business>(`/v1/owner/branches/${branch.id}/business`);
  return <BusinessForm branchId={branch.id} business={business} canEdit={me.user.role === 'owner'} />;
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Menu } from '@/lib/backend/types';
import { MenuEditor } from './menu-editor';

export const metadata: Metadata = { title: 'Menu' };

export default function MenuPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
        <p className="text-muted-foreground">
          Catégories, produits, prix et options. Les caisses reçoivent les changements à leur prochaine synchronisation.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden />}>
        <MenuSection />
      </Suspense>
    </div>
  );
}

async function MenuSection() {
  const me = await getMe();
  const branch = me.branches[0];
  if (!branch) return <p className="text-muted-foreground">Aucun établissement.</p>;
  const menu = await ownerFetch<Menu>(`/v1/owner/branches/${branch.id}/menu`);
  return <MenuEditor branchId={branch.id} menu={menu} />;
}

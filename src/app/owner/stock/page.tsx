import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getMe, ownerFetch } from '@/lib/backend/server';
import type { Menu, StockView } from '@/lib/backend/types';
import { RecipeList } from './recipe-list';
import { StockList } from './stock-list';

export const metadata: Metadata = { title: 'Stock' };

export default function StockPage() {
  return (
    <div className="grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
        <p className="text-muted-foreground">
          Vos ingrédients et ce que chaque produit utilise. Chaque ticket encaissé retire ses ingrédients du stock.
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
  const [stock, menu] = await Promise.all([
    ownerFetch<StockView>(`/v1/owner/branches/${branch.id}/stock`),
    ownerFetch<Menu>(`/v1/owner/branches/${branch.id}/menu`),
  ]);
  return (
    <>
      <StockList branchId={branch.id} items={stock.items} />
      <RecipeList items={stock.items.filter((i) => !i.archived)} recipes={stock.recipes} products={menu.products} />
    </>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { deleteCategoryAction, deleteProductAction, setProductAvailableAction } from '@/lib/actions/menu';
import type { Category, Menu, Product } from '@/lib/backend/types';
import { formatDT } from '@/lib/money';
import { CategoryDialog } from './category-dialog';
import { ProductDialog } from './product-dialog';

const STATION_LABEL = { bar: 'Bar', kitchen: 'Cuisine', none: '' } as const;

export function MenuEditor({ branchId, menu }: { branchId: string; menu: Menu }) {
  const [selectedId, setSelectedId] = useState<string | null>(menu.categories[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // If the selected category was deleted, fall back to the first one.
  const selected = menu.categories.find((c) => c.id === selectedId) ?? menu.categories[0] ?? null;
  const products = selected ? menu.products.filter((p) => p.categoryId === selected.id) : [];

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? 'Erreur');
    });

  return (
    <div className="grid gap-4">
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        {/* Categories */}
        <section aria-label="Catégories" className="grid content-start gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {menu.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                aria-current={c.id === selected?.id}
                className="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm aria-[current=true]:border-primary aria-[current=true]:bg-accent"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ background: c.color ?? '#9ca3af' }} aria-hidden />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {menu.products.filter((p) => p.categoryId === c.id).length}
                </span>
              </button>
            ))}
          </div>
          <CategoryDialog branchId={branchId} trigger={<Button variant="outline">+ Catégorie</Button>} />
        </section>

        {/* Products of the selected category */}
        <section aria-label="Produits" className="grid content-start gap-3">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <div className="flex gap-2">
                  <CategoryDialog
                    branchId={branchId}
                    category={selected}
                    trigger={<Button variant="ghost" size="sm">Modifier</Button>}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Supprimer la catégorie « ${selected.name} » ?`)) act(() => deleteCategoryAction(selected.id));
                    }}
                  >
                    Supprimer
                  </Button>
                  <ProductDialog
                    branchId={branchId}
                    categories={menu.categories}
                    defaultCategoryId={selected.id}
                    trigger={<Button size="sm">+ Produit</Button>}
                  />
                </div>
              </div>

              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun produit dans cette catégorie.</p>
              ) : (
                <ul className="grid gap-2">
                  {products.map((p) => (
                    <li key={p.id}>
                      <ProductRow
                        product={p}
                        branchId={branchId}
                        categories={menu.categories}
                        pending={pending}
                        onToggle={() => act(() => setProductAvailableAction(p.id, !p.available))}
                        onDelete={() => {
                          if (confirm(`Supprimer « ${p.name} » du menu ?`)) act(() => deleteProductAction(p.id));
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Commencez par créer une catégorie (ex. « Boissons chaudes »).
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductRow({
  product: p,
  branchId,
  categories,
  pending,
  onToggle,
  onDelete,
}: {
  product: Product;
  branchId: string;
  categories: Category[];
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const options = p.modifierGroups.reduce((n, g) => n + g.modifiers.length, 0);
  return (
    <Card className={p.available ? undefined : 'opacity-70'}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="grid gap-1">
          <p className="font-medium">{p.name}</p>
          <div className="flex flex-wrap gap-1.5 text-sm">
            <span className="font-semibold">{formatDT(p.price)}</span>
            <Badge variant="secondary">TVA {p.vatRateBp / 100} %</Badge>
            {STATION_LABEL[p.station] && <Badge variant="outline">{STATION_LABEL[p.station]}</Badge>}
            {options > 0 && <Badge variant="outline">{options} option{options > 1 ? 's' : ''}</Badge>}
            {!p.available && <Badge variant="destructive">Épuisé</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={p.available} onChange={onToggle} disabled={pending} />
            Disponible
          </label>
          <ProductDialog
            branchId={branchId}
            categories={categories}
            product={p}
            trigger={<Button variant="outline" size="sm">Modifier</Button>}
          />
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={pending} aria-label={`Supprimer ${p.name}`}>
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

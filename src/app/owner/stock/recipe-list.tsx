'use client';

import { useState, useTransition } from 'react';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { setRecipeAction } from '@/lib/actions/stock';
import type { Product, Recipe, StockItem } from '@/lib/backend/types';
import { formatQty, parseQty, QTY_HINT } from '@/lib/stock';

/** What each product uses: one unit of Cappuccino = 8 g café + 150 ml lait. */
export function RecipeList({ items, recipes, products }: { items: StockItem[]; recipes: Recipe[]; products: Product[] }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const recipeOf = new Map(recipes.map((r) => [r.productId, r.lines]));
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const withRecipe = sorted.filter((p) => recipeOf.get(p.id)?.length).length;

  return (
    <section className="grid gap-3" aria-label="Recettes">
      <div>
        <h2 className="text-lg font-semibold">Recettes</h2>
        <p className="text-sm text-muted-foreground">
          {withRecipe} produit{withRecipe > 1 ? 's' : ''} sur {products.length} avec une recette. Un produit sans recette ne
          retire rien du stock.
        </p>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ajoutez d’abord des produits dans le Menu.</p>
      ) : (
        <ul className="grid gap-2">
          {sorted.map((p) => {
            const lines = recipeOf.get(p.id) ?? [];
            return (
              <li key={p.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lines.length === 0
                          ? 'Pas de recette'
                          : lines
                              .map((l) => {
                                const i = byId.get(l.stockItemId);
                                return i ? `${formatQty(l.qty, i.unit)} ${i.name}` : '';
                              })
                              .filter(Boolean)
                              .join(' + ')}
                      </p>
                    </div>
                    <RecipeDialog product={p} lines={lines} items={items} />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type Row = { stockItemId: string; qty: string };

function RecipeDialog({ product, lines, items }: { product: Product; lines: Recipe['lines']; items: StockItem[] }) {
  const toRows = (): Row[] =>
    lines.map((l) => {
      const i = items.find((x) => x.id === l.stockItemId);
      return { stockItemId: l.stockItemId, qty: i ? String(l.qty) : '' };
    });
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(toRows);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setRow = (k: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === k ? { ...r, ...patch } : r)));

  const save = () => {
    const out: { stockItemId: string; qty: number }[] = [];
    for (const r of rows) {
      const item = items.find((i) => i.id === r.stockItemId);
      if (!item) return setError('Choisissez l’ingrédient de chaque ligne.');
      const qty = parseQty(r.qty, item.unit);
      if (!qty) return setError(`Quantité invalide pour ${item.name} (${QTY_HINT[item.unit]}).`);
      out.push({ stockItemId: item.id, qty });
    }
    startTransition(async () => {
      const r = await setRecipeAction(product.id, out);
      if (r.ok) setOpen(false);
      else setError(r.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(null);
        if (o) setRows(toRows());
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline">{lines.length ? 'Modifier' : 'Ajouter une recette'}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recette · {product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Ce qu’utilise 1 {product.name}.</p>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {items.length === 0 && <p className="text-sm text-muted-foreground">Ajoutez d’abord vos ingrédients.</p>}
          {rows.map((r, k) => {
            const item = items.find((i) => i.id === r.stockItemId);
            return (
              <div key={k} className="grid grid-cols-[1fr_8rem_auto] items-center gap-2">
                <NativeSelect
                  aria-label="Ingrédient"
                  value={r.stockItemId}
                  onChange={(e) => setRow(k, { stockItemId: e.target.value })}
                >
                  <option value="">— Ingrédient —</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  aria-label="Quantité"
                  inputMode="decimal"
                  value={r.qty}
                  placeholder={item ? QTY_HINT[item.unit].replace('ex. ', '') : ''}
                  onChange={(e) => setRow(k, { qty: e.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== k))}>
                  Retirer
                </Button>
              </div>
            );
          })}
          {items.length > 0 && rows.length < 20 && (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => setRows([...rows, { stockItemId: '', qty: '' }])}>
                Ajouter un ingrédient
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

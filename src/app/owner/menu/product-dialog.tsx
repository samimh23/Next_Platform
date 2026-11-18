'use client';

import { useState, useTransition } from 'react';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProductAction, updateProductAction } from '@/lib/actions/menu';
import type { Category, Product, Station } from '@/lib/backend/types';
import { VAT_RATES } from '@/lib/money';
import {
  emptyGroup,
  emptyOption,
  formFromProduct,
  toProductInput,
  type GroupFormState,
  type ProductFormState,
} from './product-form';

export function ProductDialog({
  branchId,
  categories,
  product,
  defaultCategoryId,
  trigger,
}: {
  branchId: string;
  categories: Category[];
  product?: Product;
  defaultCategoryId?: string;
  trigger: React.ReactElement;
}) {
  const initial = () => formFromProduct(product, defaultCategoryId ?? categories[0]?.id ?? '');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setGroup = (key: string, change: (g: GroupFormState) => GroupFormState) =>
    setForm((f) => ({ ...f, groups: f.groups.map((g) => (g.key === key ? change(g) : g)) }));

  const save = () => {
    const r = toProductInput(form);
    if (!r.ok) return setError(r.error);
    startTransition(async () => {
      const res = product ? await updateProductAction(product.id, r.input) : await createProductAction(branchId, r.input);
      if (res.ok) setOpen(false);
      else setError(res.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(null);
        if (o) setForm(initial()); // fresh form each time it opens
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? `Modifier « ${product.name} »` : 'Nouveau produit'}</DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Nom</Label>
            <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Cappuccino" required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-price">Prix TTC (DT)</Label>
              <Input
                id="p-price"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="1.200"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-vat">TVA</Label>
              <NativeSelect id="p-vat" value={form.vatRateBp} onChange={(e) => set('vatRateBp', Number(e.target.value))}>
                {VAT_RATES.map((v) => (
                  <option key={v.bp} value={v.bp}>
                    {v.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-cat">Catégorie</Label>
              <NativeSelect id="p-cat" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-station">Préparé au</Label>
              <NativeSelect id="p-station" value={form.station} onChange={(e) => set('station', e.target.value as Station)}>
                <option value="bar">Bar</option>
                <option value="kitchen">Cuisine</option>
                <option value="none">Rien à préparer</option>
              </NativeSelect>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={form.available} onChange={(e) => set('available', e.target.checked)} />
            Disponible à la vente
          </label>

          {/* Options (size, extras…) */}
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Options</legend>
            {form.groups.length === 0 && (
              <p className="text-sm text-muted-foreground">Ex. « Taille » (Normal / Grand +0.500) ou « Extras ».</p>
            )}
            {form.groups.map((g) => (
              <div key={g.key} className="grid gap-2 rounded-lg border p-3">
                <div className="flex gap-2">
                  <Input
                    aria-label="Nom du groupe"
                    value={g.name}
                    onChange={(e) => setGroup(g.key, (x) => ({ ...x, name: e.target.value }))}
                    placeholder="Taille"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, groups: f.groups.filter((x) => x.key !== g.key) }))}
                  >
                    Retirer
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={g.required}
                      onChange={(e) => setGroup(g.key, (x) => ({ ...x, required: e.target.checked }))}
                    />
                    Choix obligatoire
                  </label>
                  <label className="flex items-center gap-2">
                    Choix max
                    <Input
                      type="number"
                      min={1}
                      max={g.options.length}
                      className="w-16"
                      value={g.maxSelect}
                      onChange={(e) => setGroup(g.key, (x) => ({ ...x, maxSelect: Number(e.target.value) || 1 }))}
                    />
                  </label>
                </div>
                {g.options.map((o) => (
                  <div key={o.key} className="flex gap-2">
                    <Input
                      aria-label="Nom de l’option"
                      value={o.name}
                      onChange={(e) =>
                        setGroup(g.key, (x) => ({
                          ...x,
                          options: x.options.map((y) => (y.key === o.key ? { ...y, name: e.target.value } : y)),
                        }))
                      }
                      placeholder="Grand"
                    />
                    <Input
                      aria-label="Supplément (DT)"
                      inputMode="decimal"
                      className="w-28"
                      value={o.extraPrice}
                      onChange={(e) =>
                        setGroup(g.key, (x) => ({
                          ...x,
                          options: x.options.map((y) => (y.key === o.key ? { ...y, extraPrice: e.target.value } : y)),
                        }))
                      }
                      placeholder="+0.500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Retirer l’option"
                      disabled={g.options.length === 1}
                      onClick={() => setGroup(g.key, (x) => ({ ...x, options: x.options.filter((y) => y.key !== o.key) }))}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => setGroup(g.key, (x) => ({ ...x, options: [...x.options, emptyOption()] }))}
                >
                  + Option
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => setForm((f) => ({ ...f, groups: [...f.groups, emptyGroup()] }))}
            >
              + Groupe d’options
            </Button>
          </fieldset>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

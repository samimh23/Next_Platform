'use client';

import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  createStockItemAction,
  moveStockAction,
  stockHistoryAction,
  updateStockItemAction,
} from '@/lib/actions/stock';
import type { StockItem, StockMovement } from '@/lib/backend/types';
import { formatDateTimeTunis } from '@/lib/dates';
import { formatQty, parseQty, QTY_HINT, UNIT_LABEL, type StockUnit } from '@/lib/stock';

export function StockList({ branchId, items }: { branchId: string; items: StockItem[] }) {
  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);
  const low = active.filter((i) => i.low);
  return (
    <section className="grid gap-3" aria-label="Ingrédients">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Ingrédients{' '}
          {low.length > 0 && (
            <Badge variant="destructive" className="ml-1 align-middle">
              {low.length} en stock bas
            </Badge>
          )}
        </h2>
        <ItemDialog branchId={branchId} trigger={<Button>Ajouter un ingrédient</Button>} />
      </div>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ajoutez ce que vous achetez : café en grains, lait, sucre, croissants… puis dites ce que chaque produit utilise.
        </p>
      ) : (
        <ul className="grid gap-2">
          {[...low, ...active.filter((i) => !i.low)].map((i) => (
            <li key={i.id}>
              <ItemRow item={i} />
            </li>
          ))}
        </ul>
      )}
      {archived.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Archivés ({archived.length})</summary>
          <ul className="mt-2 grid gap-2">
            {archived.map((i) => (
              <li key={i.id}>
                <ItemRow item={i} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function ItemRow({ item: i }: { item: StockItem }) {
  return (
    <Card className={i.archived ? 'opacity-60' : undefined}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="font-medium">{i.name}</p>
          <p className="text-sm text-muted-foreground">
            {i.lowThreshold !== null ? `Alerte à ${formatQty(i.lowThreshold, i.unit)}` : 'Pas d’alerte'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-lg font-semibold tabular-nums ${i.quantity < 0 ? 'text-destructive' : ''}`}>
            {formatQty(i.quantity, i.unit)}
          </span>
          {i.low && <Badge variant="destructive">{i.quantity < 0 ? 'Négatif' : 'Stock bas'}</Badge>}
          {!i.archived && (
            <>
              <MoveDialog item={i} kind="delivery" trigger={<Button size="sm">Réception</Button>} />
              <MoveDialog item={i} kind="waste" trigger={<Button size="sm" variant="outline">Perte</Button>} />
              <MoveDialog item={i} kind="count" trigger={<Button size="sm" variant="outline">Inventaire</Button>} />
            </>
          )}
          <HistoryDialog item={i} />
          <EditDialog item={i} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Add an ingredient ──

function ItemDialog({ branchId, trigger }: { branchId: string; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<StockUnit>('g');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (form: FormData) => {
    const name = String(form.get('name') ?? '').trim();
    const qtyText = String(form.get('quantity') ?? '').trim();
    const lowText = String(form.get('lowThreshold') ?? '').trim();
    const quantity = qtyText ? parseQty(qtyText, unit) : 0;
    const lowThreshold = lowText ? parseQty(lowText, unit) : null;
    if (!name) return setError('Donnez un nom à l’ingrédient.');
    if (quantity === null) return setError(`Quantité invalide (${QTY_HINT[unit]}).`);
    if (lowText && lowThreshold === null) return setError(`Seuil invalide (${QTY_HINT[unit]}).`);
    startTransition(async () => {
      const r = await createStockItemAction(branchId, { name, unit, quantity, lowThreshold });
      if (r.ok) setOpen(false);
      else setError(r.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), setError(null))}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un ingrédient</DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField name="name" label="Nom" placeholder="Café en grains" maxLength={60} required autoFocus />
          <div className="grid gap-1.5">
            <Label htmlFor="unit">Se compte en</Label>
            <NativeSelect id="unit" value={unit} onChange={(e) => setUnit(e.target.value as StockUnit)}>
              {(Object.keys(UNIT_LABEL) as StockUnit[]).map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL[u]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <FormField name="quantity" label="Quantité actuelle" placeholder={QTY_HINT[unit]} hint="Ce que vous avez aujourd’hui (0 si vide)." />
          <FormField
            name="lowThreshold"
            label="Alerte « stock bas » à"
            placeholder={QTY_HINT[unit]}
            hint="Laissez vide pour ne pas être prévenu."
          />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Ajout…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Réception / Perte / Inventaire ──

const MOVE: Record<'delivery' | 'waste' | 'count', { title: string; label: string; button: string }> = {
  delivery: { title: 'Réception', label: 'Quantité reçue', button: 'Ajouter au stock' },
  waste: { title: 'Perte', label: 'Quantité perdue ou jetée', button: 'Retirer du stock' },
  count: { title: 'Inventaire', label: 'Quantité comptée', button: 'Corriger le stock' },
};

function MoveDialog({ item, kind, trigger }: { item: StockItem; kind: 'delivery' | 'waste' | 'count'; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const m = MOVE[kind];

  const submit = (form: FormData) => {
    const quantity = parseQty(String(form.get('quantity') ?? ''), item.unit);
    if (quantity === null || (kind !== 'count' && quantity === 0)) return setError(`Quantité invalide (${QTY_HINT[item.unit]}).`);
    startTransition(async () => {
      const r = await moveStockAction(item.id, { kind, quantity, note: String(form.get('note') ?? '') });
      if (r.ok) setOpen(false);
      else setError(r.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), setError(null))}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {m.title} · {item.name}
          </DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">En stock : {formatQty(item.quantity, item.unit)}</p>
          <FormField name="quantity" label={m.label} placeholder={QTY_HINT[item.unit]} required autoFocus inputMode="decimal" />
          <FormField
            name="note"
            label="Note (facultatif)"
            placeholder={kind === 'delivery' ? 'Fournisseur, facture…' : kind === 'waste' ? 'Périmé, renversé…' : ''}
            maxLength={120}
          />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : m.button}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── History ──

const KIND_LABEL: Record<StockMovement['kind'], string> = {
  sale: 'Ventes (ticket)',
  delivery: 'Réception',
  waste: 'Perte',
  count: 'Inventaire',
};

function HistoryDialog({ item }: { item: StockItem }) {
  const [rows, setRows] = useState<StockMovement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = async (open: boolean) => {
    if (!open) return;
    setRows(null);
    const r = await stockHistoryAction(item.id);
    if (r.ok) setRows(r.data);
    else setError(r.error);
  };
  return (
    <Dialog onOpenChange={load}>
      <DialogTrigger render={<Button size="sm" variant="ghost">Historique</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historique · {item.name}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : rows === null ? (
          <div className="h-32 animate-pulse rounded bg-muted" aria-hidden />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun mouvement.</p>
        ) : (
          <ul className="grid max-h-96 gap-2 overflow-y-auto text-sm">
            {rows.map((m, k) => (
              <li key={k} className="flex justify-between gap-3">
                <span>
                  {KIND_LABEL[m.kind]}
                  {m.note && <span className="text-muted-foreground"> · {m.note}</span>}
                  <span className="block text-muted-foreground">{formatDateTimeTunis(m.at)}</span>
                </span>
                <span className="text-right tabular-nums">
                  <span className={m.delta < 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}>
                    {m.delta > 0 ? '+' : ''}
                    {formatQty(m.delta, item.unit)}
                  </span>
                  <span className="block text-muted-foreground">→ {formatQty(m.quantityAfter, item.unit)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Rename / alert / archive ──

function EditDialog({ item }: { item: StockItem }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (patch: Parameters<typeof updateStockItemAction>[1]) =>
    startTransition(async () => {
      const r = await updateStockItemAction(item.id, patch);
      if (r.ok) setOpen(false);
      else setError(r.error);
    });

  const submit = (form: FormData) => {
    const name = String(form.get('name') ?? '').trim();
    const lowText = String(form.get('lowThreshold') ?? '').trim();
    const lowThreshold = lowText ? parseQty(lowText, item.unit) : null;
    if (!name) return setError('Donnez un nom à l’ingrédient.');
    if (lowText && lowThreshold === null) return setError(`Seuil invalide (${QTY_HINT[item.unit]}).`);
    save({ name, lowThreshold });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), setError(null))}>
      <DialogTrigger render={<Button size="sm" variant="ghost">Modifier</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier · {item.name}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField name="name" label="Nom" defaultValue={item.name} maxLength={60} required />
          <FormField
            name="lowThreshold"
            label="Alerte « stock bas » à"
            defaultValue={item.lowThreshold !== null ? String(item.lowThreshold) : ''}
            placeholder={QTY_HINT[item.unit]}
            hint={`En ${item.unit === 'piece' ? 'pièces' : item.unit} si vous ne précisez pas. Vide = pas d’alerte.`}
          />
          <DialogFooter className="justify-between sm:justify-between">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => save({ archived: !item.archived })}>
              {item.archived ? 'Réactiver' : 'Archiver'}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

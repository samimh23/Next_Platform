'use client';

import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { sendGiftsAction } from '@/lib/actions/club';
import type { ClubMember } from '@/lib/backend/types';
import { formatDT, parseMillimes } from '@/lib/money';
import { daysSince, filterClients, FILTER_LABEL, type ClientFilter } from './clients';

export function ClientsManager({
  branchId,
  members,
  products,
  canSend,
  nowMs,
}: {
  branchId: string;
  members: ClubMember[];
  products: { id: string; name: string }[];
  canSend: boolean;
  nowMs: number;
}) {
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const list = filterClients(members, filter, nowMs);
  const allSelected = list.length > 0 && list.every((m) => selected.has(m.id));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((m) => m.id)));

  if (members.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        Personne n’a encore rejoint le club. Quand un client scanne le QR de son ticket, il peut choisir de partager son
        prénom et ses visites avec vous et de recevoir vos cadeaux.
      </p>
    );
  }

  return (
    <section className="grid gap-3" aria-label="Membres du club">
      {done && (
        <Alert role="status">
          <AlertDescription>{done}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrer">
          {(Object.keys(FILTER_LABEL) as ClientFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              role="tab"
              aria-selected={filter === f}
              onClick={() => {
                setFilter(f);
                setSelected(new Set());
              }}
            >
              {FILTER_LABEL[f]}
            </Button>
          ))}
        </div>
        {canSend && (
          <Button disabled={selected.size === 0} onClick={() => setOpen(true)}>
            🎁 Envoyer un cadeau{selected.size > 0 && ` (${selected.size})`}
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun client dans cette liste.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                {canSend && (
                  <th className="w-10 px-3 py-2">
                    <input type="checkbox" className="size-4" checked={allSelected} onChange={toggleAll} aria-label="Tout choisir" />
                  </th>
                )}
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 text-right font-medium">Visites</th>
                <th className="px-3 py-2 text-right font-medium">Dépensé</th>
                <th className="px-3 py-2 text-right font-medium">Points</th>
                <th className="px-3 py-2 text-right font-medium">Dernière visite</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const days = daysSince(m, nowMs);
                return (
                  <tr key={m.id} className="border-t">
                    {canSend && (
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={selected.has(m.id)}
                          onChange={() => toggle(m.id)}
                          aria-label={`Choisir ${m.name}`}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 font-medium">{m.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.visits}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatDT(m.spent)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.points}</td>
                    <td className={`px-3 py-2 text-right ${days !== null && days >= 30 ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                      {days === null ? '—' : days === 0 ? 'Aujourd’hui' : days === 1 ? 'Hier' : `Il y a ${days} jours`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!canSend && <p className="text-sm text-muted-foreground">Seul le propriétaire peut envoyer des cadeaux.</p>}

      <GiftDialog
        open={open}
        onOpenChange={setOpen}
        branchId={branchId}
        customerIds={[...selected]}
        products={products}
        onSent={(text) => {
          setDone(text);
          setSelected(new Set());
        }}
      />
    </section>
  );
}

function GiftDialog({
  open,
  onOpenChange,
  branchId,
  customerIds,
  products,
  onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  branchId: string;
  customerIds: string[];
  products: { id: string; name: string }[];
  onSent: (text: string) => void;
}) {
  const [kind, setKind] = useState<'free_product' | 'amount_off'>('free_product');
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const productName = products.find((p) => p.id === productId)?.name;

  const submit = (form: FormData) => {
    const amount = kind === 'amount_off' ? parseMillimes(String(form.get('amount') ?? '')) : null;
    if (kind === 'free_product' && !productId) return setError('Choisissez le produit offert.');
    if (kind === 'amount_off' && !(amount && amount > 0)) return setError('Montant invalide (ex. 3 ou 2,500).');
    const giftName =
      name.trim() || (kind === 'free_product' ? `${productName} offert` : `${formatDT(amount!)} offerts`);
    startTransition(async () => {
      const r = await sendGiftsAction(branchId, {
        customerIds,
        name: giftName,
        kind,
        productId: kind === 'free_product' ? productId : undefined,
        amount: amount ?? undefined,
        validDays: Number(form.get('validDays')),
      });
      if (!r.ok) return setError(r.error);
      onOpenChange(false);
      onSent(
        `« ${giftName} » envoyé à ${r.data.sent} client${r.data.sent > 1 ? 's' : ''}. Ils le voient dans leur application Kahwti.`,
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange(o), setError(null))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Envoyer un cadeau à {customerIds.length} client{customerIds.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="gift-kind">Cadeau</Label>
            <NativeSelect id="gift-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="free_product">Un produit offert</option>
              <option value="amount_off">Une remise en dinars</option>
            </NativeSelect>
          </div>
          {kind === 'free_product' ? (
            <div className="grid gap-1.5">
              <Label htmlFor="gift-product">Produit</Label>
              <NativeSelect id="gift-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">— Choisir —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <FormField name="amount" label="Remise (DT)" placeholder="3" inputMode="decimal" className="max-w-32" />
          )}
          <FormField
            name="name"
            label="Message (ce que voit le client)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'free_product' ? `${productName ?? 'Un express'} offert` : '3 DT offerts'}
            maxLength={60}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="validDays">Valable</Label>
            <NativeSelect id="validDays" name="validDays" defaultValue="14">
              <option value="7">7 jours</option>
              <option value="14">14 jours</option>
              <option value="30">30 jours</option>
            </NativeSelect>
          </div>
          <p className="text-sm text-muted-foreground">
            Le client montre un code à la caisse ; le caissier le tape dans « Fidélité » sur la caisse. Chaque cadeau ne
            sert qu’une fois.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Envoi…' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

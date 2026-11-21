'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveLoyaltyAction } from '@/lib/actions/loyalty';
import type { LoyaltyProgram } from '@/lib/backend/types';
import { emptyReward, toForm, validateProgram, type ProgramErrors, type RewardRow } from './loyalty-form';

export function LoyaltyEditor({
  branchId,
  program,
  products,
  listed,
  canEdit,
}: {
  branchId: string;
  program: LoyaltyProgram;
  products: { id: string; name: string }[];
  listed: boolean;
  canEdit: boolean;
}) {
  const [f, setF] = useState(toForm(program));
  const [errors, setErrors] = useState<ProgramErrors>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const setReward = (i: number, patch: Partial<RewardRow>) =>
    setF({ ...f, rewards: f.rewards.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const save = () => {
    const v = validateProgram(f);
    if (!v.ok) {
      setErrors(v.errors);
      setMsg({ ok: false, text: 'Corrigez les champs en rouge.' });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const r = await saveLoyaltyAction(branchId, v.data);
      if (r.ok) {
        setF(toForm(r.data));
        setMsg({
          ok: true,
          text: r.data.enabled
            ? 'Enregistré. Les caisses impriment le QR fidélité dès leur prochaine synchronisation.'
            : 'Enregistré. Le programme est désactivé.',
        });
      } else setMsg({ ok: false, text: r.error });
    });
  };

  const rate = Number(f.pointsPerDinar) || 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <form action={save} className="grid content-start gap-5" onChange={() => setMsg(null)}>
        {msg && (
          <Alert variant={msg.ok ? 'default' : 'destructive'} role={msg.ok ? 'status' : 'alert'}>
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        )}
        <fieldset disabled={!canEdit || pending} className="grid gap-5">
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              name="enabled"
              className="mt-0.5 size-4"
              checked={f.enabled}
              onChange={(e) => setF({ ...f, enabled: e.target.checked })}
            />
            <span>
              <span className="font-medium">Programme de fidélité actif</span>
              <span className="block text-sm text-muted-foreground">
                Un QR code est imprimé en bas de chaque ticket (ou affiché sur la caisse).
              </span>
            </span>
          </label>

          <FormField
            name="pointsPerDinar"
            label="Points par dinar dépensé"
            inputMode="numeric"
            value={f.pointsPerDinar}
            onChange={(e) => setF({ ...f, pointsPerDinar: e.target.value })}
            error={errors.pointsPerDinar}
            hint={rate > 0 ? `Un ticket de 12,500 DT donne ${Math.floor(12.5 * rate)} points.` : undefined}
            className="max-w-32"
          />

          <div className="grid gap-3">
            <h2 className="font-semibold">Récompenses</h2>
            {f.rewards.length === 0 && (
              <p className="text-sm text-muted-foreground">Ajoutez ce que vos clients peuvent obtenir avec leurs points.</p>
            )}
            {f.rewards.map((r, i) => (
              <div key={r.id ?? `new-${i}`} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_6rem]">
                <div className="grid gap-1.5">
                  <Label htmlFor={`reward-${i}-name`}>Nom</Label>
                  <Input
                    id={`reward-${i}-name`}
                    value={r.name}
                    placeholder="Un express offert"
                    maxLength={60}
                    onChange={(e) => setReward(i, { name: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`reward-${i}-points`}>Points</Label>
                  <Input
                    id={`reward-${i}-points`}
                    inputMode="numeric"
                    value={r.points}
                    placeholder="10"
                    onChange={(e) => setReward(i, { points: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`reward-${i}-kind`}>Type</Label>
                  <NativeSelect
                    id={`reward-${i}-kind`}
                    value={r.kind}
                    onChange={(e) => setReward(i, { kind: e.target.value as RewardRow['kind'] })}
                  >
                    <option value="free_product">Produit offert</option>
                    <option value="amount_off">Remise en dinars</option>
                  </NativeSelect>
                </div>
                {r.kind === 'free_product' ? (
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor={`reward-${i}-product`}>Produit</Label>
                    <NativeSelect
                      id={`reward-${i}-product`}
                      value={r.productId}
                      onChange={(e) => setReward(i, { productId: e.target.value })}
                    >
                      <option value="">— Choisir —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                ) : (
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor={`reward-${i}-amount`}>Remise (DT)</Label>
                    <Input
                      id={`reward-${i}-amount`}
                      inputMode="decimal"
                      value={r.amount}
                      placeholder="5"
                      className="max-w-32"
                      onChange={(e) => setReward(i, { amount: e.target.value })}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                  <p className="text-sm text-destructive">{errors.rewards?.[i]}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setF({ ...f, rewards: f.rewards.filter((_, j) => j !== i) })}
                  >
                    Retirer
                  </Button>
                </div>
              </div>
            ))}
            {f.rewards.length < 20 && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setF({ ...f, rewards: [...f.rewards, emptyReward()] })}
                >
                  Ajouter une récompense
                </Button>
              </div>
            )}
          </div>
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Seul le propriétaire peut modifier le programme.</p>
        )}
      </form>

      <div className="grid h-fit gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comment ça marche</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <p>1. Le client paie : son ticket porte un QR code signé par votre caisse.</p>
            <p>2. Il le scanne avec son téléphone et crée son compte Kahwti (gratuit).</p>
            <p>3. Les points s’ajoutent. Un ticket ne donne des points qu’une fois, pendant 30 jours.</p>
            <p>4. Un ticket remboursé retire ses points.</p>
          </CardContent>
        </Card>
        {!listed && (
          <Alert>
            <AlertDescription>
              Votre café n’apparaît pas dans la recherche de l’application client.{' '}
              <Link href="/owner/settings" className="font-medium underline underline-offset-4">
                L’afficher (Établissement)
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

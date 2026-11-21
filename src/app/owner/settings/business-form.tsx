'use client';

import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateBusinessAction } from '@/lib/actions/business';
import type { Business } from '@/lib/backend/types';

type Fields = Record<Exclude<keyof Business, 'listed' | 'loyaltyEnabled'>, string> & { listed: boolean };

const toFields = (b: Business): Fields => ({
  businessName: b.businessName,
  taxId: b.taxId ?? '',
  branchName: b.branchName,
  address: b.address ?? '',
  phone: b.phone ?? '',
  receiptFooter: b.receiptFooter ?? '',
  city: b.city ?? '',
  listed: b.listed,
});

export function BusinessForm({ branchId, business, canEdit }: { branchId: string; business: Business; canEdit: boolean }) {
  const [f, setF] = useState<Fields>(toFields(business));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: Exclude<keyof Fields, 'listed'>) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = () =>
    startTransition(async () => {
      const r = await updateBusinessAction(branchId, f);
      setMsg(r.ok ? { ok: true, text: 'Enregistré. Les caisses l’impriment dès leur prochaine synchronisation.' } : { ok: false, text: r.error });
      if (r.ok) setF(toFields(r.data));
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        action={save}
        className="grid content-start gap-4"
        onChange={() => setMsg(null)}
      >
        {msg && (
          <Alert variant={msg.ok ? 'default' : 'destructive'} role={msg.ok ? 'status' : 'alert'}>
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        )}
        <fieldset disabled={!canEdit || pending} className="grid gap-4">
          <FormField name="businessName" label="Nom commercial" value={f.businessName} onChange={set('businessName')} required maxLength={80} />
          <FormField
            name="taxId"
            label="Matricule fiscal (MF)"
            placeholder="1234567/A/M/000"
            value={f.taxId}
            onChange={set('taxId')}
            hint="Imprimé sur chaque ticket. Vérifiez avec votre comptable les mentions obligatoires."
            maxLength={40}
          />
          <FormField name="branchName" label="Nom de l’établissement" value={f.branchName} onChange={set('branchName')} required maxLength={80} />
          <FormField name="address" label="Adresse" placeholder="Rue de Marseille, Tunis" value={f.address} onChange={set('address')} maxLength={160} />
          <FormField name="phone" label="Téléphone" placeholder="71 000 000" value={f.phone} onChange={set('phone')} maxLength={30} />
          <FormField
            name="receiptFooter"
            label="Message en bas du ticket"
            placeholder="Merci de votre visite !"
            value={f.receiptFooter}
            onChange={set('receiptFooter')}
            maxLength={120}
          />
          <fieldset className="grid gap-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">Application client Kahwti</legend>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="listed"
                className="mt-0.5 size-4"
                checked={f.listed}
                onChange={(e) => setF({ ...f, listed: e.target.checked })}
              />
              <span>
                Afficher mon café dans la recherche
                <span className="block text-muted-foreground">
                  Les clients le trouvent par son nom ou sa ville et voient vos récompenses fidélité.
                </span>
              </span>
            </label>
            <FormField name="city" label="Ville" placeholder="La Marsa" value={f.city} onChange={set('city')} maxLength={60} />
          </fieldset>
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Seul le propriétaire peut modifier ces informations.</p>
        )}
      </form>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Aperçu du ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-md border bg-white p-4 font-mono text-xs leading-relaxed text-neutral-900 shadow-sm"
            aria-label="Aperçu de l’en-tête et du pied du ticket"
          >
            <p className="text-center text-sm font-bold">{f.businessName || 'Nom commercial'}</p>
            {f.address && <p className="text-center">{f.address}</p>}
            {f.phone && <p className="text-center">Tél. {f.phone}</p>}
            {f.taxId && <p className="text-center">MF : {f.taxId}</p>}
            <p className="my-1 overflow-hidden whitespace-nowrap text-neutral-400">{'-'.repeat(48)}</p>
            <p className="flex justify-between">
              <span>2 x Express</span>
              <span>2.400</span>
            </p>
            <p className="text-right font-bold">TOTAL 2.400 DT</p>
            <p className="my-1 overflow-hidden whitespace-nowrap text-neutral-400">{'-'.repeat(48)}</p>
            <p className="text-center">{f.receiptFooter || 'Merci de votre visite !'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

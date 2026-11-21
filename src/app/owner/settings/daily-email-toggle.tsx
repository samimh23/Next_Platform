'use client';

import { useState, useTransition } from 'react';
import { setDailyEmailAction } from '@/lib/actions/business';

/** "Résumé du matin": yesterday's figures by email at 7:00. Each person chooses for themselves. */
export function DailyEmailToggle({ on: initial, email }: { on: boolean; email: string }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const change = (next: boolean) =>
    startTransition(async () => {
      setError(null);
      setOn(next);
      const r = await setDailyEmailAction(next);
      if (!r.ok) {
        setOn(!next);
        setError(r.error);
      }
    });
  return (
    <div className="grid gap-2 rounded-lg border p-4">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4" checked={on} disabled={pending} onChange={(e) => change(e.target.checked)} />
        <span>
          <span className="font-medium">Résumé du matin par email</span>
          <span className="block text-muted-foreground">
            Chaque jour vers 7 h, à {email} : le chiffre d’affaires de la veille, les tickets, et ce qu’il faut vérifier
            (annulations, remboursements, écarts de caisse, stock bas).
          </span>
        </span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

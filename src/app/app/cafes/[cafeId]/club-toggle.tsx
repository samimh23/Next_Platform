'use client';

import { useState, useTransition } from 'react';
import { setClubAction } from '@/lib/actions/customer';

/** Join or leave the café's club: the customer's choice, any time. */
export function ClubToggle({ cafeId, cafeName, optIn }: { cafeId: string; cafeName: string; optIn: boolean }) {
  const [on, setOn] = useState(optIn);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const change = (next: boolean) =>
    startTransition(async () => {
      setError(null);
      setOn(next);
      const r = await setClubAction(cafeId, next);
      if (!r.ok) {
        setOn(!next);
        setError(r.error);
      }
    });

  return (
    <div className="grid gap-2 rounded-xl border p-4">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          checked={on}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
        />
        <span>
          <span className="font-medium">Membre du club de {cafeName}</span>
          <span className="block text-muted-foreground">
            {on
              ? 'Le café voit votre prénom et vos visites (jamais votre email) et peut vous envoyer des cadeaux.'
              : 'Rejoignez le club pour recevoir les cadeaux du café. Il verra votre prénom et vos visites, jamais votre email.'}
          </span>
        </span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

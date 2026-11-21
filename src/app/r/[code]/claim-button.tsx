'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { claimAction, type ClaimState } from '@/lib/actions/customer';

export function ClaimButton({ code }: { code: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimAction, {});

  if (state.result) {
    const r = state.result;
    return (
      <div className="grid gap-3 text-center" role="status">
        <p className="text-4xl font-bold">+{r.points} pts</p>
        <p>
          chez <span className="font-semibold">{r.cafeName}</span> · total {r.balance} pts
        </p>
        <Link href={`/app/cafes/${r.cafeId}`} className={buttonVariants({ size: 'lg' })}>
          Voir mes points
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3">
      {state.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <input type="hidden" name="code" value={code} />
      <label className="flex items-start gap-3 text-left text-sm">
        <input type="checkbox" name="optIn" className="mt-0.5 size-4" />
        <span>
          Rejoindre le club de ce café
          <span className="block text-muted-foreground">
            Le café voit votre prénom et vos visites (jamais votre email) et peut vous envoyer des cadeaux. Vous pouvez
            quitter le club à tout moment.
          </span>
        </span>
      </label>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Un instant…' : 'Récupérer mes points'}
      </Button>
    </form>
  );
}

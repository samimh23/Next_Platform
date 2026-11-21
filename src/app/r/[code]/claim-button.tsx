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
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Un instant…' : 'Récupérer mes points'}
      </Button>
    </form>
  );
}

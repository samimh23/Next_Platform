'use client';

import { useEffect, useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createRedemptionAction, type RedemptionCode } from '@/lib/actions/customer';

/** "Utiliser": shows a 6-digit code to give the cashier (valid 10 minutes). */
export function UseReward({ cafeId, rewardId, rewardName }: { cafeId: string; rewardId: string; rewardName: string }) {
  const [code, setCode] = useState<RedemptionCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ask = () =>
    startTransition(async () => {
      setError(null);
      const r = await createRedemptionAction(cafeId, rewardId);
      if (r.ok) setCode(r.data);
      else setError(r.error);
    });

  return (
    <>
      <Button size="sm" onClick={ask} disabled={pending}>
        {pending ? '…' : 'Utiliser'}
      </Button>
      {error && (
        <Alert variant="destructive" role="alert" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Dialog open={!!code} onOpenChange={(open) => !open && setCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rewardName}</DialogTitle>
          </DialogHeader>
          {code && <CodeView code={code} onAgain={ask} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CodeView({ code, onAgain }: { code: RedemptionCode; onAgain: () => void }) {
  const [left, setLeft] = useState(() => secondsLeft(code.expiresAt));
  useEffect(() => {
    const t = setInterval(() => setLeft(secondsLeft(code.expiresAt)), 1000);
    return () => clearInterval(t);
  }, [code.expiresAt]);

  if (left <= 0) {
    return (
      <div className="grid gap-3 text-center">
        <p className="text-muted-foreground">Ce code a expiré.</p>
        <Button onClick={onAgain}>Nouveau code</Button>
      </div>
    );
  }
  return (
    <div className="grid gap-3 text-center" role="status">
      <p className="text-sm text-muted-foreground">Montrez ce code à la caisse</p>
      <p className="font-mono text-5xl font-bold tracking-[0.3em] tabular-nums" aria-label={`Code ${code.code.split('').join(' ')}`}>
        {code.code}
      </p>
      <p className="text-sm text-muted-foreground">
        {code.points} points · valable encore {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </p>
      <p className="text-xs text-muted-foreground">Les points ne sont retirés que quand la caisse valide le code.</p>
    </div>
  );
}

const secondsLeft = (iso: string) => Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));

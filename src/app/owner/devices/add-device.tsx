'use client';

import { useEffect, useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createPairingCodeAction } from '@/lib/actions/devices';
import type { PairingCode } from '@/lib/backend/types';

/**
 * "Ajouter une caisse": creates a one-time code and shows it big, with a countdown.
 * The first device of the café should be the Hub (main POS).
 */
export function AddDevice({
  branchId,
  hasHub,
  activeCode,
}: {
  branchId: string;
  hasHub: boolean;
  activeCode: PairingCode | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // The action calls refresh(): the new code comes back from the server as `activeCode`.
  // Once a POS uses it, the server stops listing it and it disappears here.
  const remaining = useRemaining(activeCode?.expiresAt ?? null);
  const code = activeCode && remaining > 0 ? activeCode : null;

  const create = (role: 'hub' | 'pos') =>
    startTransition(async () => {
      setError(null);
      const r = await createPairingCodeAction(branchId, role);
      if (!r.ok) setError(r.error);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une caisse</CardTitle>
        <CardDescription>
          {hasHub
            ? 'Ajoutez une tablette ou un PC supplémentaire.'
            : 'Commencez par la caisse principale (Hub) : c’est elle qui relie les autres caisses du café.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {code ? (
          <PairingCodeBox code={code} remaining={remaining} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => create(hasHub ? 'pos' : 'hub')} disabled={pending}>
              {pending ? 'Création du code…' : hasHub ? 'Ajouter une caisse' : 'Ajouter la caisse principale'}
            </Button>
            {hasHub && (
              <Button variant="outline" onClick={() => create('hub')} disabled={pending}>
                Remplacer la caisse principale
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PairingCodeBox({ code, remaining }: { code: PairingCode; remaining: number }) {
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
      <p className="text-sm text-muted-foreground">
        Code pour {code.role === 'hub' ? 'la caisse principale (Hub)' : 'une caisse'} — valable{' '}
        <span className="font-medium text-foreground" aria-live="polite">
          {minutes}:{seconds}
        </span>
      </p>
      <p
        className="select-all text-center font-mono text-4xl font-bold tracking-[0.2em] sm:text-5xl"
        aria-label={`Code d'association ${code.code.split('').join(' ')}`}
      >
        {code.code}
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Ouvrez l’application de caisse sur la tablette ou le PC.</li>
        <li>Entrez ce code et un nom (ex. « Caisse principale »).</li>
        <li>La caisse apparaîtra ci-dessous en quelques secondes.</li>
      </ol>
    </div>
  );
}

/** Seconds left until `iso` (0 when null or past), re-rendering every second. */
function useRemaining(iso: string | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [iso]);
  return iso ? Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000)) : 0;
}

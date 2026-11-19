'use client';

import { useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { setDeviceDisabledAction, setDevicePaymentsAction } from '@/lib/actions/devices';
import type { Device } from '@/lib/backend/types';

const ROLE_LABEL: Record<Device['role'], string> = { hub: 'Caisse principale', pos: 'Caisse secondaire', kds: 'Écran cuisine' };

export function DeviceList({ devices, canManage }: { devices: Device[]; canManage: boolean }) {
  if (devices.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune caisse associée pour le moment.</p>;
  }
  return (
    <ul className="grid gap-3" aria-label="Caisses associées">
      {devices.map((d) => (
        <li key={d.id}>
          <DeviceCard device={d} canManage={canManage} />
        </li>
      ))}
    </ul>
  );
}

function DeviceCard({ device: d, canManage }: { device: Device; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const togglePayments = () =>
    startTransition(async () => {
      setError(null);
      const r = await setDevicePaymentsAction(d.id, !d.canTakePayments);
      if (!r.ok) setError(r.error);
    });

  const toggle = () => {
    if (!d.disabled && !confirm(`Désactiver « ${d.name} » ? Elle sera bloquée à sa prochaine synchronisation.`)) return;
    startTransition(async () => {
      setError(null);
      const r = await setDeviceDisabledAction(d.id, !d.disabled);
      if (!r.ok) setError(r.error);
    });
  };

  const status = d.disabled
    ? { label: 'Désactivée', dot: 'bg-muted-foreground' }
    : d.online
      ? { label: 'En ligne', dot: 'bg-green-500' }
      : { label: 'Hors ligne', dot: 'bg-amber-500' };

  return (
    <Card className={d.disabled ? 'opacity-70' : undefined}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="grid gap-0.5">
          <p className="font-medium">
            <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{d.code}</span>
            {d.name}
            <RoleBadge role={d.role} />
          </p>
          <p className="text-sm text-muted-foreground">
            {ROLE_LABEL[d.role]} · {d.lastSeq} événement{d.lastSeq > 1 ? 's' : ''} reçu{d.lastSeq > 1 ? 's' : ''}
          </p>
          {d.role === 'hub' && (
            <p className="text-sm text-muted-foreground">
              {d.lanAddress
                ? `Les tablettes des serveurs se connectent à elle par le Wi-Fi (${d.lanAddress}).`
                : 'Adresse Wi-Fi pas encore connue : elle s’affiche quand la caisse est ouverte.'}
            </p>
          )}
          {d.role === 'pos' && (
            <label className="mt-1 flex w-fit items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={d.canTakePayments}
                disabled={!canManage || pending || d.disabled}
                onChange={togglePayments}
              />
              Peut encaisser
              <span className="text-muted-foreground">
                {d.canTakePayments ? '' : '· sinon le serveur « demande l’addition » à la caisse principale'}
              </span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm" title={d.lastSeenAt ? `Vue ${relative(d.lastSeenAt)}` : 'Jamais synchronisée'}>
            <span className={`size-2 rounded-full ${status.dot}`} aria-hidden />
            {status.label}
            {!d.online && !d.disabled && d.lastSeenAt && (
              <span className="text-muted-foreground"> · {relative(d.lastSeenAt)}</span>
            )}
          </span>
          {canManage && (
            <Button variant={d.disabled ? 'outline' : 'destructive'} size="sm" onClick={toggle} disabled={pending}>
              {pending ? '…' : d.disabled ? 'Réactiver' : 'Désactiver'}
            </Button>
          )}
        </div>
        {error && (
          <Alert variant="destructive" role="alert" className="w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/** PRINCIPALE (filled) / SECONDAIRE (outlined) — same badges as on the POS screens. */
function RoleBadge({ role }: { role: Device['role'] }) {
  if (role === 'hub')
    return (
      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold tracking-wide text-primary-foreground">
        PRINCIPALE
      </span>
    );
  if (role === 'pos')
    return (
      <span className="ml-2 rounded-full border border-primary px-2 py-0.5 text-xs font-semibold tracking-wide text-primary">
        SECONDAIRE
      </span>
    );
  return null;
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

/** "il y a 3 minutes" */
function relative(iso: string): string {
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (Math.abs(s) < 60) return rtf.format(s, 'second');
  if (Math.abs(s) < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (Math.abs(s) < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}

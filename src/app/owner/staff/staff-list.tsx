'use client';

import { useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { updateStaffAction } from '@/lib/actions/staff';
import type { Staff } from '@/lib/backend/types';
import { StaffDialog } from './staff-dialog';
import { ROLE_LABEL } from './staff-form';

export function StaffList({ staff, branchId, canManage }: { staff: Staff[]; branchId: string; canManage: boolean }) {
  if (staff.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun membre du personnel. Ajoutez au moins une personne pour pouvoir se connecter sur les caisses.
      </p>
    );
  }
  // Active first, then by name.
  const sorted = [...staff].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'fr'));
  return (
    <ul className="grid gap-3" aria-label="Personnel">
      {sorted.map((s) => (
        <li key={s.id}>
          <StaffCard staff={s} branchId={branchId} canManage={canManage} />
        </li>
      ))}
    </ul>
  );
}

function StaffCard({ staff: s, branchId, canManage }: { staff: Staff; branchId: string; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    if (s.active && !confirm(`Désactiver « ${s.name} » ? Cette personne ne pourra plus se connecter sur les caisses.`))
      return;
    startTransition(async () => {
      setError(null);
      const r = await updateStaffAction(s.id, { active: !s.active });
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <Card className={s.active ? undefined : 'opacity-70'}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-muted font-semibold"
            aria-hidden
          >
            {s.name.charAt(0).toUpperCase()}
          </span>
          <div className="grid gap-0.5">
            <p className="font-medium">{s.name}</p>
            <p className="text-sm text-muted-foreground">
              {ROLE_LABEL[s.role]}
              {!s.active && ' · Désactivé'}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {s.active && (
              <StaffDialog
                branchId={branchId}
                staff={s}
                trigger={
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                }
              />
            )}
            <Button variant={s.active ? 'destructive' : 'outline'} size="sm" onClick={toggle} disabled={pending}>
              {pending ? '…' : s.active ? 'Désactiver' : 'Réactiver'}
            </Button>
          </div>
        )}
        {error && (
          <Alert variant="destructive" role="alert" className="w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteAreaAction } from '@/lib/actions/floor';
import type { Floor } from '@/lib/backend/types';
import { AddTablesDialog, AreaDialog, TableDialog } from './floor-dialogs';

export function FloorEditor({ branchId, floor }: { branchId: string; floor: Floor }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const seats = floor.tables.reduce((sum, t) => sum + t.seats, 0);

  const removeArea = (id: string, name: string) => {
    if (!confirm(`Supprimer la salle « ${name} » ?`)) return;
    startTransition(async () => {
      setError(null);
      const r = await deleteAreaAction(id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="grid gap-4">
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {floor.tables.length} table{floor.tables.length > 1 ? 's' : ''} · {seats} place{seats > 1 ? 's' : ''}
        </p>
        <AreaDialog branchId={branchId} trigger={<Button>+ Salle</Button>} />
      </div>

      {floor.areas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Créez d’abord une salle (par exemple « Salle » ou « Terrasse »), puis ajoutez ses tables. Sans tables, la
            caisse fonctionne au comptoir.
          </CardContent>
        </Card>
      )}

      {floor.areas.map((area) => {
        const tables = floor.tables.filter((t) => t.areaId === area.id);
        return (
          <Card key={area.id}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>
                {area.name}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  · {tables.length} table{tables.length > 1 ? 's' : ''}
                </span>
              </CardTitle>
              <div className="flex gap-1">
                <AreaDialog branchId={branchId} area={area} trigger={<Button variant="ghost" size="sm">Renommer</Button>} />
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => removeArea(area.id, area.name)}>
                  Supprimer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {tables.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune table dans cette salle.</p>
              ) : (
                <ul className="flex flex-wrap gap-2" aria-label={`Tables de ${area.name}`}>
                  {tables.map((t) => (
                    <li key={t.id}>
                      <TableDialog
                        table={t}
                        areas={floor.areas}
                        trigger={
                          <button
                            type="button"
                            className="grid min-w-16 place-items-center rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                            aria-label={`Table ${t.name}, ${t.seats} places — modifier`}
                          >
                            <span className="font-semibold">{t.name}</span>
                            <span className="text-xs text-muted-foreground">{t.seats} pl.</span>
                          </button>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <AddTablesDialog
                  branchId={branchId}
                  area={area}
                  trigger={
                    <Button variant="outline" size="sm">
                      + Tables
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

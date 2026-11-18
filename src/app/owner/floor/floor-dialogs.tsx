'use client';

import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  createAreaAction,
  createTablesAction,
  deleteTableAction,
  renameAreaAction,
  updateTableAction,
} from '@/lib/actions/floor';
import type { ActionResult } from '@/lib/actions/devices';
import type { Area, DiningTable } from '@/lib/backend/types';
import { parseTableNames } from './table-names';

/** Shared open/error/pending state of a small form dialog. */
function useDialogForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submit = (call: () => Promise<ActionResult<unknown>> | null) =>
    startTransition(async () => {
      const p = call();
      if (!p) return;
      const r = await p;
      if (r.ok) setOpen(false);
      else setError(r.error);
    });
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    setError(null);
  };
  return { open, setOpen, error, setError, pending, submit, onOpenChange };
}

function ErrorAlert({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

/** New room, or rename one. */
export function AreaDialog({ branchId, area, trigger }: { branchId: string; area?: Area; trigger: React.ReactElement }) {
  const f = useDialogForm();
  return (
    <Dialog open={f.open} onOpenChange={f.onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{area ? 'Renommer la salle' : 'Nouvelle salle'}</DialogTitle>
        </DialogHeader>
        <form
          action={(form) => {
            const name = String(form.get('name') ?? '');
            f.submit(() => (area ? renameAreaAction(area.id, name) : createAreaAction(branchId, name)));
          }}
          className="grid gap-4"
        >
          <ErrorAlert error={f.error} />
          <FormField name="name" label="Nom" placeholder="Salle, Terrasse, Étage…" defaultValue={area?.name} required autoFocus />
          <DialogFooter>
            <Button type="submit" disabled={f.pending}>
              {f.pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "Ajouter des tables": 1-12, T1-T4, or a list. */
export function AddTablesDialog({ branchId, area, trigger }: { branchId: string; area: Area; trigger: React.ReactElement }) {
  const f = useDialogForm();
  const [input, setInput] = useState('');
  const parsed = input.trim() ? parseTableNames(input) : null;

  return (
    <Dialog
      open={f.open}
      onOpenChange={(o) => {
        f.onOpenChange(o);
        setInput('');
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter des tables — {area.name}</DialogTitle>
        </DialogHeader>
        <form
          action={(form) => {
            const seats = Number(form.get('seats'));
            f.submit(() => {
              const r = parseTableNames(input);
              if (!r.ok) {
                f.setError(r.error);
                return null;
              }
              return createTablesAction(branchId, { areaId: area.id, names: r.names, seats });
            });
          }}
          className="grid gap-4"
        >
          <ErrorAlert error={f.error} />
          <FormField
            name="names"
            label="Tables"
            placeholder="1-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            hint="Exemples : 1-12 · T1-T6 · 1-4, Bar, VIP"
            error={parsed && !parsed.ok ? parsed.error : undefined}
            required
            autoFocus
          />
          {parsed?.ok && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {parsed.names.length} table{parsed.names.length > 1 ? 's' : ''} : {preview(parsed.names)}
            </p>
          )}
          <FormField name="seats" label="Places par table" type="number" min={1} max={50} defaultValue={4} required />
          <DialogFooter>
            <Button type="submit" disabled={f.pending || !parsed?.ok}>
              {f.pending ? 'Ajout…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const preview = (names: string[]) =>
  names.length <= 8 ? names.join(', ') : `${names.slice(0, 6).join(', ')} … ${names.at(-1)}`;

/** Rename a table, change its seats or room, or delete it. */
export function TableDialog({ table, areas, trigger }: { table: DiningTable; areas: Area[]; trigger: React.ReactElement }) {
  const f = useDialogForm();
  return (
    <Dialog open={f.open} onOpenChange={f.onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Table {table.name}</DialogTitle>
        </DialogHeader>
        <form
          action={(form) =>
            f.submit(() =>
              updateTableAction(table.id, {
                name: String(form.get('name') ?? ''),
                seats: Number(form.get('seats')),
                areaId: String(form.get('areaId') ?? ''),
              }),
            )
          }
          className="grid gap-4"
        >
          <ErrorAlert error={f.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="name" label="Nom" defaultValue={table.name} maxLength={20} required autoFocus />
            <FormField name="seats" label="Places" type="number" min={1} max={50} defaultValue={table.seats} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="areaId">Salle</Label>
            <NativeSelect id="areaId" name="areaId" defaultValue={table.areaId}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={f.pending}
              onClick={() => {
                if (confirm(`Supprimer la table ${table.name} ? Un ticket en cours sur cette table reste sur la caisse.`))
                  f.submit(() => deleteTableAction(table.id));
              }}
            >
              Supprimer
            </Button>
            <Button type="submit" disabled={f.pending}>
              {f.pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

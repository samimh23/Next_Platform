'use client';

import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { NativeSelect } from '@/components/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createStaffAction, updateStaffAction } from '@/lib/actions/staff';
import type { Staff } from '@/lib/backend/types';
import { ROLE_LABEL, ROLES, validateStaffForm, type StaffFormErrors } from './staff-form';

/** Add a staff member, or edit one (name, role, new PIN). */
export function StaffDialog({
  branchId,
  staff,
  trigger,
}: {
  branchId: string;
  staff?: Staff;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = !!staff;

  const submit = (form: FormData) => {
    const values = {
      name: String(form.get('name') ?? ''),
      role: String(form.get('role') ?? ''),
      pin: String(form.get('pin') ?? ''),
      pinConfirm: String(form.get('pinConfirm') ?? ''),
    };
    const v = validateStaffForm(values, { pinRequired: !editing });
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    startTransition(async () => {
      let r;
      if (staff) {
        // Send only what changed.
        const patch = {
          ...(v.data.name !== staff.name ? { name: v.data.name } : {}),
          ...(v.data.role !== staff.role ? { role: v.data.role } : {}),
          ...(v.data.pin ? { pin: v.data.pin } : {}),
        };
        if (Object.keys(patch).length === 0) return setOpen(false);
        r = await updateStaffAction(staff.id, patch);
      } else {
        r = await createStaffAction(branchId, { name: v.data.name, role: v.data.role, pin: v.data.pin! });
      }
      if (r.ok) setOpen(false);
      else setError(r.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(null);
        setErrors({});
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{staff ? `Modifier ${staff.name}` : 'Ajouter un membre du personnel'}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField
            name="name"
            label="Prénom ou surnom"
            placeholder="Ahmed"
            defaultValue={staff?.name}
            error={errors.name}
            maxLength={40}
            required
            autoFocus
          />
          <div className="grid gap-1.5">
            <Label htmlFor="role">Rôle</Label>
            <NativeSelect id="role" name="role" defaultValue={staff?.role ?? 'server'} aria-invalid={!!errors.role}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </NativeSelect>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              name="pin"
              label={editing ? 'Nouveau code' : 'Code PIN'}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              placeholder="4 à 6 chiffres"
              error={errors.pin}
              hint={editing ? 'Laisser vide pour garder le code actuel.' : 'Pour se connecter sur la caisse.'}
              required={!editing}
            />
            <FormField
              name="pinConfirm"
              label="Confirmer le code"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              error={errors.pinConfirm}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Les caisses reçoivent le changement à leur prochaine synchronisation (moins d’une minute si elles sont en
            ligne).
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

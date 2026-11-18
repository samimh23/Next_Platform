'use client';

import { useState, useTransition } from 'react';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createCategoryAction, updateCategoryAction } from '@/lib/actions/menu';
import type { Category } from '@/lib/backend/types';

/** Same palette as the POS category buttons. */
const COLORS = ['#8B5E3C', '#2E86AB', '#E0A458', '#3E8E41', '#C0392B', '#8E44AD', '#16A085', '#7F8C8D'];

export function CategoryDialog({
  branchId,
  category,
  trigger,
}: {
  branchId: string;
  category?: Category;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(category?.color ?? COLORS[0]!);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (form: FormData) =>
    startTransition(async () => {
      const input = { name: String(form.get('name') ?? ''), color };
      const r = category ? await updateCategoryAction(category.id, input) : await createCategoryAction(branchId, input);
      if (r.ok) setOpen(false);
      else setError(r.error);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(null);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-4">
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField name="name" label="Nom" placeholder="Boissons chaudes" defaultValue={category?.name} required autoFocus />
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Couleur sur la caisse</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Couleur ${c}`}
                  aria-pressed={color === c}
                  className="size-8 rounded-full ring-offset-2 ring-offset-background aria-pressed:ring-2 aria-pressed:ring-foreground"
                  style={{ background: c }}
                />
              ))}
            </div>
          </fieldset>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

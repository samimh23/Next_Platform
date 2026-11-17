import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Label + input + error message, wired for accessibility. */
export function FormField({
  name,
  label,
  error,
  hint,
  ...input
}: React.ComponentProps<typeof Input> & { name: string; label: string; error?: string; hint?: string }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={!!error} aria-describedby={describedBy} {...input} />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

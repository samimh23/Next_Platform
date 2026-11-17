'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signupAction, type FormState } from '@/lib/actions/auth';

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signupAction, {});
  const v = state.values ?? {};
  const f = state.fields ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer mon café</CardTitle>
        <CardDescription>Votre compte propriétaire et votre premier établissement.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="grid gap-4">
          {state.error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <FormField name="name" label="Votre nom" autoComplete="name" required defaultValue={v.name} error={f.name} />
          <FormField
            name="businessName"
            label="Nom du café"
            placeholder="Café Le Jasmin"
            required
            defaultValue={v.businessName}
            error={f.businessName}
          />
          <FormField
            name="taxId"
            label="Matricule fiscal (optionnel)"
            placeholder="1234567/A/M/000"
            defaultValue={v.taxId}
            error={f.taxId}
          />
          <FormField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            defaultValue={v.email}
            error={f.email}
          />
          <FormField
            name="password"
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            hint="Au moins 10 caractères."
            error={f.password}
          />
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Création…' : 'Créer mon café'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

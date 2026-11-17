'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { loginAction, type FormState } from '@/lib/actions/auth';

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Se connecter</CardTitle>
        <CardDescription>Accédez au tableau de bord de votre café.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="grid gap-4">
          {state.error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <input type="hidden" name="next" value={next ?? ''} />
          <FormField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            error={state.fields?.email}
          />
          <FormField
            name="password"
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            required
            error={state.fields?.password}
          />
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Connexion…' : 'Se connecter'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Créer mon café
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormState } from '@/lib/actions/auth';
import { customerLoginAction, customerSignupAction } from '@/lib/actions/customer';

/** Customer login or sign-up. [next] = where to go after (e.g. back to the receipt to claim). */
export function CustomerAuthForm({ mode, next }: { mode: 'login' | 'signup'; next?: string }) {
  const signup = mode === 'signup';
  const [state, action, pending] = useActionState<FormState, FormData>(
    signup ? customerSignupAction : customerLoginAction,
    {},
  );
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{signup ? 'Créer mon compte' : 'Se connecter'}</CardTitle>
        <CardDescription>
          {signup
            ? 'Gratuit. Gagnez des points dans vos cafés préférés en scannant vos tickets.'
            : 'Retrouvez vos points fidélité.'}
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="grid gap-4">
          {state.error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <input type="hidden" name="next" value={next ?? ''} />
          {signup && (
            <FormField
              name="name"
              label="Prénom"
              autoComplete="given-name"
              required
              defaultValue={state.values?.name}
              error={state.fields?.name}
            />
          )}
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
            autoComplete={signup ? 'new-password' : 'current-password'}
            required
            hint={signup ? 'Au moins 8 caractères' : undefined}
            error={state.fields?.password}
          />
          {!signup && (
            <Link
              href="/app/forgot-password"
              className="-mt-2 justify-self-end text-sm text-muted-foreground underline underline-offset-4"
            >
              Mot de passe oublié ?
            </Link>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Un instant…' : signup ? 'Créer mon compte' : 'Se connecter'}
          </Button>
          <p className="text-sm text-muted-foreground">
            {signup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
            <Link
              href={`${signup ? '/app/login' : '/app/signup'}${nextQuery}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {signup ? 'Se connecter' : 'Créer un compte'}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

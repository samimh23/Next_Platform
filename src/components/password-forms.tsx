'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  customerForgotAction,
  customerResetAction,
  ownerForgotAction,
  ownerResetAction,
  type PasswordFormState,
} from '@/lib/actions/password';

type Who = 'owner' | 'customer';
const LOGIN: Record<Who, string> = { owner: '/login', customer: '/app/login' };

/** "Mot de passe oublié" — asks the email, then says to check the inbox (same answer for any email). */
export function ForgotPasswordForm({ who }: { who: Who }) {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(
    who === 'owner' ? ownerForgotAction : customerForgotAction,
    {},
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>Nous vous envoyons un lien pour en choisir un nouveau.</CardDescription>
      </CardHeader>
      {state.done ? (
        <CardContent className="grid gap-3" role="status">
          <p>
            Si un compte existe pour <span className="font-medium">{state.email}</span>, un email vient de partir. Ouvrez
            le lien qu’il contient (valable 1 heure).
          </p>
          <p className="text-sm text-muted-foreground">Rien reçu ? Regardez dans les spams, ou réessayez dans une minute.</p>
          <Link href={LOGIN[who]} className={buttonVariants({ variant: 'outline' })}>
            Retour à la connexion
          </Link>
        </CardContent>
      ) : (
        <form action={action}>
          <CardContent className="grid gap-4">
            {state.error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <FormField name="email" label="Email" type="email" autoComplete="email" required defaultValue={state.email} />
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Envoi…' : 'Recevoir le lien'}
            </Button>
            <Link href={LOGIN[who]} className="text-sm text-muted-foreground underline underline-offset-4">
              Retour à la connexion
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

/** The page the email link opens: choose the new password (twice). */
export function ResetPasswordForm({ who, token }: { who: Who; token: string }) {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(
    who === 'owner' ? ownerResetAction : customerResetAction,
    {},
  );
  const min = who === 'owner' ? 10 : 8;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>Vous serez déconnecté de tous vos appareils.</CardDescription>
      </CardHeader>
      {state.done ? (
        <CardContent className="grid gap-3" role="status">
          <p>C’est fait : votre mot de passe est changé.</p>
          <Link href={LOGIN[who]} className={buttonVariants()}>
            Se connecter
          </Link>
        </CardContent>
      ) : !token ? (
        <CardContent>
          <p className="text-muted-foreground">Ce lien est incomplet. Ouvrez à nouveau le lien reçu par email.</p>
        </CardContent>
      ) : (
        <form action={action}>
          <CardContent className="grid gap-4">
            {state.error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <input type="hidden" name="token" value={token} />
            <FormField
              name="password"
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              hint={`Au moins ${min} caractères`}
              required
            />
            <FormField name="confirm" label="Encore une fois" type="password" autoComplete="new-password" required />
          </CardContent>
          <CardFooter className="mt-6">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Changer le mot de passe'}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

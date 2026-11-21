import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/password-forms';

export const metadata: Metadata = { title: 'Nouveau mot de passe', robots: { index: false } };

/** Opened from the email link (?token=…). */
export default function ResetPasswordPage({ searchParams }: PageProps<'/app/reset-password'>) {
  return (
    <Suspense fallback={null}>
      <WithToken searchParams={searchParams} />
    </Suspense>
  );
}

async function WithToken({ searchParams }: Pick<PageProps<'/app/reset-password'>, 'searchParams'>) {
  const { token } = await searchParams;
  return <ResetPasswordForm who="customer" token={typeof token === 'string' ? token : ''} />;
}

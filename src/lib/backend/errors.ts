/** Error returned by the backend: { error: { code, message } }. */
export class BackendError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** French messages for the codes the user can see. */
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_TAKEN: 'Un compte existe déjà avec cet email.',
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans une minute.',
  VALIDATION_ERROR: 'Certaines informations ne sont pas valides.',
  NETWORK: 'Le serveur ne répond pas. Réessayez dans un instant.',
};

export function messageFor(e: unknown): string {
  if (e instanceof BackendError) return MESSAGES[e.code] ?? e.message;
  return MESSAGES.NETWORK!;
}

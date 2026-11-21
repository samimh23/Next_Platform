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
  FORBIDDEN: "Seul le propriétaire peut faire cette action.",
  DEVICE_NOT_FOUND: 'Cette caisse est introuvable.',
  BRANCH_NOT_FOUND: 'Cet établissement est introuvable.',
  CATEGORY_NOT_EMPTY: 'Cette catégorie contient encore des produits. Déplacez-les ou supprimez-les d’abord.',
  CATEGORY_NOT_FOUND: 'Cette catégorie est introuvable.',
  PRODUCT_NOT_FOUND: 'Ce produit est introuvable.',
  AREA_NOT_FOUND: 'Cette salle est introuvable.',
  AREA_NOT_EMPTY: 'Cette salle contient encore des tables. Déplacez-les ou supprimez-les d’abord.',
  TABLE_NOT_FOUND: 'Cette table est introuvable.',
  TABLE_NAME_TAKEN: 'Ce nom de table existe déjà dans votre établissement.',
  CASH_SESSION_NOT_FOUND: 'Cette clôture de caisse est introuvable.',
  STAFF_NOT_FOUND: 'Ce membre du personnel est introuvable.',
  INVALID_MODIFIERS: 'Les options ne sont pas valides (vérifiez minimum et maximum).',
  CAFE_NOT_FOUND: 'Ce café est introuvable.',
  TOKEN_EXPIRED: 'Votre session a expiré. Reconnectez-vous.',
  RECEIPT_INVALID: 'Ce code de ticket n’est pas valide.',
  RECEIPT_ALREADY_CLAIMED: 'Les points de ce ticket ont déjà été récupérés.',
  RECEIPT_TOO_OLD: 'Ce ticket a plus de 30 jours : il ne donne plus de points.',
  RECEIPT_REFUNDED: 'Ce ticket a été remboursé : il ne donne pas de points.',
  LOYALTY_DISABLED: 'Ce café n’a pas (encore) de programme de fidélité.',
  INVALID_REWARD: 'Une récompense est incomplète.',
  REWARD_NOT_FOUND: 'Cette récompense n’existe plus.',
  NOT_ENOUGH_POINTS: 'Pas assez de points pour cette récompense.',
  NETWORK: 'Le serveur ne répond pas. Réessayez dans un instant.',
};

export function messageFor(e: unknown): string {
  if (e instanceof BackendError) return MESSAGES[e.code] ?? e.message;
  return MESSAGES.NETWORK!;
}

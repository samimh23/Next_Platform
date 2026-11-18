/** Most tables a café adds at once (the backend accepts 100 per request). */
export const MAX_TABLES = 100;

export type TableNamesResult = { ok: true; names: string[] } | { ok: false; error: string };

/**
 * "1-12" → 1…12, "T1-T4" or "T1-4" → T1…T4, "1 à 6", and lists: "1-6, Bar, Terrasse 2".
 * Names are trimmed, 1–20 characters, no duplicates (case ignored, like the backend).
 */
export function parseTableNames(input: string): TableNamesResult {
  const tokens = input
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: 'Indiquez au moins une table, par exemple 1-12.' };

  const names: string[] = [];
  for (const token of tokens) {
    const range = /^(\D*?)\s*(\d+)\s*(?:-|–|à)\s*(\D*?)\s*(\d+)$/i.exec(token);
    if (range && (range[3] === '' || range[3]!.toLowerCase() === range[1]!.toLowerCase())) {
      const prefix = range[1]!;
      const from = Number(range[2]);
      const to = Number(range[4]);
      if (from > to) return { ok: false, error: `« ${token} » : le premier numéro doit être le plus petit.` };
      if (to - from + 1 > MAX_TABLES) return { ok: false, error: `Maximum ${MAX_TABLES} tables à la fois.` };
      for (let n = from; n <= to; n++) names.push(`${prefix}${n}`);
    } else {
      names.push(token);
    }
  }

  if (names.length > MAX_TABLES) return { ok: false, error: `Maximum ${MAX_TABLES} tables à la fois.` };
  const tooLong = names.find((n) => n.length > 20);
  if (tooLong) return { ok: false, error: `« ${tooLong} » est trop long (20 caractères maximum).` };
  const seen = new Set<string>();
  for (const n of names) {
    const key = n.toLocaleLowerCase('fr');
    if (seen.has(key)) return { ok: false, error: `« ${n} » apparaît deux fois.` };
    seen.add(key);
  }
  return { ok: true, names };
}
